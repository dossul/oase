import {
  Injectable,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { UpdateContribuableDto } from './dto/update-contribuable.dto';

/**
 * Barème de complétude du profil contribuable.
 *
 * Chaque champ rempli ajoute son poids. La somme = profilCompletude.
 * À 100%, le profil est verrouillé (profilLocked=true) : le user ne peut
 * plus modifier les champs critiques (NIF, raison sociale) sans intervention
 * admin (workflow de modification à venir — hors scope Lot 5).
 *
 * Répartition :
 *   20% — Identité de base (créée au signup : nom, prenom, email, tel, user)
 *   20% — NIF réel (≠ PENDING-*) et unique
 *   10% — Raison sociale explicite (≠ "Prénom Nom" auto-généré)
 *   10% — Type contribuable confirmé (= personne_physique par défaut à l'origine,
 *          +10% si l'user l'a explicitement choisi)
 *   15% — Adresse renseignée
 *   10% — Téléphone (≠ PENDING signup, format E.164)
 *   10% — Email de contact (≠ email de login)
 *    5% — Secteur d'activité
 *  = 100%
 */
const POIDS = {
  BASE: 20,
  NIF: 20,
  RAISON_SOCIALE: 10,
  TYPE_CONTRIBUABLE: 10,
  ADRESSE: 15,
  TELEPHONE: 10,
  EMAIL_CONTACT: 10,
  SECTEUR: 5,
};

@Injectable()
export class ContribuableService {
  private readonly logger = new Logger(ContribuableService.name);

  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  /**
   * GET /contribuables/me : retourne le profil complet + alertes de complétude
   */
  async getMyProfile(userId: string) {
    const contribuable = await this.prisma.contribuable.findUnique({
      where: { userId },
      include: {
        refTypesContribuable: { select: { code: true, libelle: true } },
        refStatutsFiscal: { select: { code: true, libelle: true } },
        utilisateurs: { select: { email: true, nom: true, prenom: true } },
      },
    });

    if (!contribuable) {
      throw new NotFoundException({ code: 'CONTRIBUABLE_INEXISTANT' });
    }

    const isProfilPlaceholder = contribuable.nif.startsWith('PENDING-');

    return {
      data: {
        ...contribuable,
        isProfilPlaceholder,
        // Champs "enrichis" via les refs
        typeContribuable: contribuable.refTypesContribuable,
        statutFiscal: contribuable.refStatutsFiscal,
        // Détail de la complétude : quels champs rapportent combien
        completudeDetail: this.buildCompletudeDetail(contribuable),
        alertes: this.buildProfileAlertes(contribuable, isProfilPlaceholder),
      },
    };
  }

  /**
   * PATCH /contribuables/me : modifie les champs + recalcule profilCompletude
   */
  async updateMyProfile(
    userId: string,
    dto: UpdateContribuableDto,
    ip: string,
    ua: string,
  ) {
    // 1. Charger le contribuable
    const before = await this.prisma.contribuable.findUnique({
      where: { userId },
    });
    if (!before) {
      throw new NotFoundException({ code: 'CONTRIBUABLE_INEXISTANT' });
    }

    // 2. Si profilLocked : filtrer les champs interdits (NIF, raison sociale, type).
    // Stratégie : on retire les champs interdits du DTO et on continue le traitement
    // pour les champs autorisés. C'est plus permissif que de tout refuser d'un coup.
    // (L'utilisateur peut ainsi corriger son téléphone/email même si son profil est
    // verrouillé, sans avoir à séparer ses updates en 2 requêtes.)
    if (before.profilLocked) {
      const CHAMPS_AUTORISES_LOCKED = [
        'telephone',
        'emailContact',
        'adresse',
        'secteur',
        'region',
      ];
      const champsEnvoyes = Object.keys(dto).filter(
        (k) => (dto as any)[k] !== undefined,
      );
      const champsInterdits = champsEnvoyes.filter(
        (c) => !CHAMPS_AUTORISES_LOCKED.includes(c),
      );
      if (champsInterdits.length > 0) {
        // Si TOUS les champs sont interdits → on rejette pour éviter un "no-op update"
        if (champsInterdits.length === champsEnvoyes.length) {
          throw new ForbiddenException({
            code: 'PROFIL_VERROUILLE_CHAMPS_INTERDITS',
            champsInterdits,
            message:
              "Votre profil est verrouillé (complétude 100%). Seuls certains champs peuvent être modifiés (téléphone, email, adresse, secteur, région). Pour modifier NIF/raison sociale, contactez l'admin.",
          });
        }
        // Sinon : on retire les champs interdits du DTO et on log un warning
        this.logger.warn(
          `Profil locked userId=${userId} : champs interdits filtrés : ${champsInterdits.join(',')}`,
        );
        for (const champ of champsInterdits) {
          delete (dto as any)[champ];
        }
      }
    }

    // 3. Valider le NIF si fourni (uniqueness, format)
    if (dto.nif !== undefined && dto.nif !== before.nif) {
      // Refuser PENDING-*
      if (dto.nif.startsWith('PENDING-')) {
        throw new BadRequestException({
          code: 'NIF_NE_PEUT_PAS_ETRE_PLACEHOLDER',
          message: 'Le NIF ne peut pas être un placeholder (PENDING-*)',
        });
      }
      // Vérifier unicité
      const existing = await this.prisma.contribuable.findFirst({
        where: { nif: dto.nif, NOT: { id: before.id } },
        select: { id: true },
      });
      if (existing) {
        throw new ConflictException({ code: 'NIF_DEJA_UTILISE' });
      }
    }

    // 4. Valider typeContribuableCode si fourni
    if (dto.typeContribuableCode !== undefined) {
      const refType = await this.prisma.refTypeContribuable.findUnique({
        where: { code: dto.typeContribuableCode },
        select: { code: true, estActif: true },
      });
      if (!refType || !refType.estActif) {
        throw new BadRequestException({
          code: 'TYPE_CONTRIBUABLE_INVALIDE',
        });
      }
    }

    // 5. Valider statutFiscalCode si fourni
    if (dto.statutFiscalCode !== undefined) {
      const refStatut = await this.prisma.refStatutFiscal.findUnique({
        where: { code: dto.statutFiscalCode },
        select: { code: true, estActif: true },
      });
      if (!refStatut || !refStatut.estActif) {
        throw new BadRequestException({
          code: 'STATUT_FISCAL_INVALIDE',
        });
      }
    }

    // 6. Calculer le diff
    const dataToUpdate: Record<string, any> = {};
    for (const key of Object.keys(dto)) {
      const newVal = (dto as any)[key];
      const oldVal = (before as any)[key];
      if (newVal !== undefined && newVal !== oldVal) {
        dataToUpdate[key] = newVal;
      }
    }

    if (Object.keys(dataToUpdate).length === 0) {
      return { data: { updated: false, message: 'Aucun changement détecté' } };
    }

    // 7. Update
    const updated = await this.prisma.contribuable.update({
      where: { id: before.id },
      data: dataToUpdate,
    });

    // 8. Recalculer la complétude
    const { score, isLocked } = this.computeCompletude(updated);

    // 9. Update du score (et lock si 100%)
    const final = await this.prisma.contribuable.update({
      where: { id: before.id },
      data: {
        profilCompletude: score,
        profilLocked: isLocked,
        derniereMajCompletude: new Date(),
      },
    });

    // 10. Audit
    await this.audit.createEntry({
      action: 'CONTRIBUABLE_PROFILE_UPDATED',
      entite: 'contribuables',
      entiteId: before.id,
      utilisateurId: userId,
      ancienneValeur: {
        profilCompletude: before.profilCompletude,
        profilLocked: before.profilLocked,
        champsModifies: Object.keys(dataToUpdate),
      },
      nouvelleValeur: {
        profilCompletude: final.profilCompletude,
        profilLocked: final.profilLocked,
        champsModifies: Object.keys(dataToUpdate),
      },
      ip,
      userAgent: ua,
    });

    this.logger.log(
      `Contribuable profile updated: userId=${userId} champs=${Object.keys(dataToUpdate).join(',')} score=${score}% locked=${isLocked}`,
    );

    return {
      data: {
        updated: true,
        contribuable: final,
        completude: {
          score,
          isLocked,
          previousScore: before.profilCompletude,
          previousLocked: before.profilLocked,
          detail: this.buildCompletudeDetail(final),
        },
      },
    };
  }

  // --- Helpers privés ---

  /**
   * Calcule la complétude d'un profil contribuable.
   * Retourne { score, isLocked }.
   */
  private computeCompletude(c: {
    nif: string;
    raisonSociale: string;
    typeContribuableCode: string;
    adresse: string | null;
    telephone: string | null;
    emailContact: string | null;
    secteur: string | null;
  }): { score: number; isLocked: boolean } {
    let score = POIDS.BASE; // 20% de base (identité signup)

    // NIF : doit être rempli ET non-placeholder
    if (c.nif && !c.nif.startsWith('PENDING-')) {
      score += POIDS.NIF;
    }

    // Raison sociale : doit être rempli et pas juste "Prénom Nom" auto
    // (critère simple : longueur > 3 et pas le pattern "<Prénom> <NOM>")
    // Note : ici on accepte tout car le user peut très bien avoir une vraie
    // raison sociale = "Prénom Nom" pour les personnes physiques
    if (c.raisonSociale && c.raisonSociale.length >= 2) {
      score += POIDS.RAISON_SOCIALE;
    }

    // Type contribuable : tout code valide compte (incluant personne_physique
    // car c'est déjà le défaut au signup)
    if (c.typeContribuableCode) {
      score += POIDS.TYPE_CONTRIBUABLE;
    }

    if (c.adresse && c.adresse.trim().length > 0) {
      score += POIDS.ADRESSE;
    }

    if (c.telephone && c.telephone.trim().length > 0) {
      score += POIDS.TELEPHONE;
    }

    if (c.emailContact && c.emailContact.trim().length > 0) {
      score += POIDS.EMAIL_CONTACT;
    }

    if (c.secteur && c.secteur.trim().length > 0) {
      score += POIDS.SECTEUR;
    }

    const capped = Math.min(score, 100);
    return { score: capped, isLocked: capped >= 100 };
  }

  /**
   * Construit le détail des points rapportés par chaque champ
   * (utile pour le front : afficher "il vous manque 30% pour compléter").
   */
  private buildCompletudeDetail(c: {
    nif: string;
    raisonSociale: string;
    typeContribuableCode: string;
    adresse: string | null;
    telephone: string | null;
    emailContact: string | null;
    secteur: string | null;
  }) {
    const champs: Array<{ champ: string; poids: number; complete: boolean }> = [
      { champ: 'identite_base', poids: POIDS.BASE, complete: true },
      {
        champ: 'nif',
        poids: POIDS.NIF,
        complete: !!c.nif && !c.nif.startsWith('PENDING-'),
      },
      {
        champ: 'raison_sociale',
        poids: POIDS.RAISON_SOCIALE,
        complete: !!c.raisonSociale && c.raisonSociale.length >= 2,
      },
      {
        champ: 'type_contribuable',
        poids: POIDS.TYPE_CONTRIBUABLE,
        complete: !!c.typeContribuableCode,
      },
      {
        champ: 'adresse',
        poids: POIDS.ADRESSE,
        complete: !!c.adresse && c.adresse.trim().length > 0,
      },
      {
        champ: 'telephone',
        poids: POIDS.TELEPHONE,
        complete: !!c.telephone && c.telephone.trim().length > 0,
      },
      {
        champ: 'email_contact',
        poids: POIDS.EMAIL_CONTACT,
        complete: !!c.emailContact && c.emailContact.trim().length > 0,
      },
      {
        champ: 'secteur',
        poids: POIDS.SECTEUR,
        complete: !!c.secteur && c.secteur.trim().length > 0,
      },
    ];
    return {
      total: champs.reduce((s, x) => s + (x.complete ? x.poids : 0), 0),
      max: 100,
      champs,
    };
  }

  private buildProfileAlertes(
    c: {
      profilCompletude: number;
      profilLocked: boolean;
      nif: string;
    },
    isPlaceholder: boolean,
  ): Array<{ code: string; message: string; niveau: 'info' | 'warning' | 'block' }> {
    const alertes: Array<{ code: string; message: string; niveau: 'info' | 'warning' | 'block' }> = [];
    if (isPlaceholder) {
      alertes.push({
        code: 'NIF_PLACEHOLDER',
        message:
          "Votre NIF est en mode placeholder. Renseignez votre vrai NIF pour débloquer la complétion.",
        niveau: 'warning',
      });
    }
    if (c.profilCompletude < 100) {
      alertes.push({
        code: 'PROFIL_INCOMPLET',
        message: `Profil complété à ${c.profilCompletude}%. Complétez-le pour atteindre 100% et verrouiller votre dossier.`,
        niveau: 'info',
      });
    }
    if (c.profilLocked) {
      alertes.push({
        code: 'PROFIL_VERROUILLE',
        message:
          'Votre profil est complet et verrouillé. Vous pouvez soumettre des demandes en ligne.',
        niveau: 'info',
      });
    }
    return alertes;
  }
}
