import {
  Injectable,
  BadRequestException,
  ConflictException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { OtpService } from '../otp/otp.service';
import { AuditService } from '../audit/audit.service';
import { UpdateMeDto } from './dto/update-me.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

const PASSWORD_HASH_ROUNDS = 12;

/**
 * Service de gestion du profil user connecté.
 *
 * Sépare les responsabilités :
 * - updateProfile : modif nom/prenom/tel (avec OTP si tel)
 * - changePassword : modif password (avec vérif ancien password)
 * - getMeWithContribuable : GET /auth/me enrichi (user + contribuable lié)
 */
@Injectable()
export class ProfileService {
  private readonly logger = new Logger(ProfileService.name);

  constructor(
    private prisma: PrismaService,
    private otp: OtpService,
    private audit: AuditService,
  ) {}

  /**
   * GET /auth/me enrichi : retourne le user + le contribuable lié (si existe)
   * + le score de complétude profil + des alertes onboarding contextuelles.
   */
  async getMeWithContribuable(userId: string) {
    const user = await this.prisma.utilisateur.findUnique({
      where: { id: userId },
      include: {
        institutions: { select: { nom: true } },
        contribuables: {
          select: {
            id: true,
            nif: true,
            raisonSociale: true,
            typeContribuableCode: true,
            statutFiscalCode: true,
            profilCompletude: true,
            profilLocked: true,
          },
        },
      },
    });
    if (!user) {
      throw new UnauthorizedException({ code: 'USER_INEXISTANT' });
    }

    const contribuable = user.contribuables ?? null;
    const isProfilPlaceholder =
      contribuable?.nif?.startsWith('PENDING-') ?? false;

    return {
      data: {
        user: {
          id: user.id,
          email: user.email,
          nom: user.nom,
          prenom: user.prenom,
          telephone: user.telephone,
          role: user.role,
          institutionId: user.institutionId,
          institution: user.institutions.nom,
          mfaActive: user.mfaActive,
          secteurAffecte: user.secteurAffecte,
        },
        contribuable: contribuable
          ? {
              id: contribuable.id,
              nif: contribuable.nif,
              raisonSociale: contribuable.raisonSociale,
              typeContribuableCode: contribuable.typeContribuableCode,
              statutFiscalCode: contribuable.statutFiscalCode,
              profilCompletude: contribuable.profilCompletude,
              profilLocked: contribuable.profilLocked,
              isProfilPlaceholder,
            }
          : null,
        alertes: this.buildOnboardingAlertes(contribuable, isProfilPlaceholder),
      },
    };
  }

  /**
   * PATCH /auth/me : modifie nom/prenom/tel.
   * Si telephone change : OTP CHANGE_PHONE obligatoire (vérifie qu'un OTP
   * actif existe pour (nouveauTel, CHANGE_PHONE) et que le payload.userId
   * matche l'user connecté → empêche l'attaque "je demande un OTP sur MON
   * tel et je l'utilise pour mettre MON tel sur le compte de quelqu'un d'autre").
   */
  async updateProfile(
    userId: string,
    dto: UpdateMeDto,
    ip: string,
    ua: string,
  ) {
    // 1. Vérifier qu'au moins un champ est fourni
    if (dto.nom === undefined && dto.prenom === undefined && dto.telephone === undefined) {
      throw new BadRequestException({ code: 'AUCUN_CHAMPS_A_MODIFIER' });
    }

    // 2. Si telephone fourni : OTP CHANGE_PHONE obligatoire
    let otpPayload: Record<string, unknown> | null = null;
    if (dto.telephone !== undefined) {
      // Garde-fous DTO (normalement déjà enforced par ValidateIf + class-validator)
      if (dto.contexte !== 'CHANGE_PHONE' || !dto.codeOtp) {
        throw new BadRequestException({
          code: 'OTP_CHANGE_PHONE_REQUIS',
        });
      }

      // Vérifier l'OTP : le consomme
      let result;
      try {
        result = await this.otp.verifier(dto.telephone, 'CHANGE_PHONE', dto.codeOtp);
        otpPayload = result.payload;
      } catch (e: any) {
        // Remapper les codes OTP vers 401
        throw e; // OtpService.throw déjà des UnauthorizedException propres
      }

      // Sécurité : le payload OTP doit contenir userId = userId courant
      // (sinon OTP demandé pour quelqu'un d'autre utilisé ici)
      if (!otpPayload || otpPayload.userId !== userId) {
        throw new BadRequestException({
          code: 'OTP_PAYLOAD_USERID_INCOHERENT',
        });
      }

      // Vérifier que le nouveau tel n'est pas déjà pris par un autre user
      const existing = await this.prisma.utilisateur.findFirst({
        where: { telephone: dto.telephone, NOT: { id: userId } },
        select: { id: true },
      });
      if (existing) {
        throw new ConflictException({ code: 'TELEPHONE_DEJA_UTILISE' });
      }
    }

    // 3. Calculer le diff pour l'audit
    const before = await this.prisma.utilisateur.findUniqueOrThrow({
      where: { id: userId },
      select: { nom: true, prenom: true, telephone: true },
    });

    // 4. Update DB
    const dataToUpdate: Record<string, string> = {};
    if (dto.nom !== undefined && dto.nom !== before.nom) dataToUpdate.nom = dto.nom;
    if (dto.prenom !== undefined && dto.prenom !== before.prenom) dataToUpdate.prenom = dto.prenom;
    if (dto.telephone !== undefined && dto.telephone !== before.telephone) {
      dataToUpdate.telephone = dto.telephone;
    }

    if (Object.keys(dataToUpdate).length === 0) {
      // Aucun changement effectif (mêmes valeurs qu'avant)
      return { data: { updated: false, message: 'Aucun changement détecté' } };
    }

    const updated = await this.prisma.utilisateur.update({
      where: { id: userId },
      data: dataToUpdate,
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        telephone: true,
        role: true,
      },
    });

    // 5. Audit
    await this.audit.createEntry({
      action: 'USER_PROFILE_UPDATED',
      entite: 'utilisateurs',
      entiteId: userId,
      utilisateurId: userId,
      roleAuMoment: updated.role,
      ancienneValeur: before,
      nouvelleValeur: {
        nom: updated.nom,
        prenom: updated.prenom,
        telephone: updated.telephone,
        ...(dto.telephone ? { otpChangePhone: true } : {}),
      },
      ip,
      userAgent: ua,
    });

    this.logger.log(
      `Profile updated: userId=${userId} fields=${Object.keys(dataToUpdate).join(',')}`,
    );

    return {
      data: {
        updated: true,
        user: updated,
      },
    };
  }

  /**
   * POST /auth/password/change : change le mot de passe du user connecté.
   * Vérifie l'ancien password (bcrypt.compare) avant de hasher le nouveau.
   */
  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
    ip: string,
    ua: string,
  ) {
    // 1. newPassword === newPasswordConfirm ?
    if (dto.newPassword !== dto.newPasswordConfirm) {
      throw new BadRequestException({ code: 'PASSWORD_CONFIRMATION_INCORRECTE' });
    }

    // 2. Empêcher de re-utiliser le même password
    if (dto.oldPassword === dto.newPassword) {
      throw new BadRequestException({ code: 'PASSWORD_IDENTIQUE' });
    }

    // 3. Charger le user + vérif ancien password
    const user = await this.prisma.utilisateur.findUniqueOrThrow({
      where: { id: userId },
      select: { id: true, email: true, passwordHash: true, role: true },
    });

    const oldOk = await bcrypt.compare(dto.oldPassword, user.passwordHash);
    if (!oldOk) {
      // Audit même en cas d'échec
      await this.audit.createEntry({
        action: 'PASSWORD_CHANGE_ECHEC',
        entite: 'utilisateurs',
        entiteId: userId,
        utilisateurId: userId,
        roleAuMoment: user.role,
        nouvelleValeur: { reason: 'old_password_incorrect' },
        ip,
        userAgent: ua,
      });
      throw new UnauthorizedException({ code: 'ANCIEN_PASSWORD_INVALIDE' });
    }

    // 4. Hash + update
    const newHash = await bcrypt.hash(dto.newPassword, PASSWORD_HASH_ROUNDS);
    await this.prisma.utilisateur.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    // 5. Sécurité : révoquer TOUS les refresh tokens actifs du user.
    // Si le mot de passe a été changé car compromis, l'attaquant ne doit
    // pas pouvoir continuer à utiliser ses sessions parallèles.
    // Le user devra se reconnecter sur chaque appareil (= login + nouveau pwd).
    const { count: revokedCount } = await this.prisma.refreshToken.updateMany({
      where: { utilisateurId: userId, estRevoque: false },
      data: { estRevoque: true },
    });

    // 5. Audit success
    await this.audit.createEntry({
      action: 'PASSWORD_CHANGE_SUCCES',
      entite: 'utilisateurs',
      entiteId: userId,
      utilisateurId: userId,
      roleAuMoment: user.role,
      ip,
      userAgent: ua,
    });

    this.logger.log(`Password changed: userId=${userId}`);

    return {
      data: {
        changed: true,
        message: 'Mot de passe modifié avec succès',
        sessionsRevoquees: revokedCount,
      },
    };
  }

  // --- Helpers privés ---

  /**
   * Construit la liste d'alertes contextuelles pour le user connecté
   * (ex: "votre profil est incomplet, complétez-le pour débloquer X").
   */
  private buildOnboardingAlertes(
    contribuable: {
      profilCompletude: number;
      profilLocked: boolean;
      nif: string;
    } | null,
    isProfilPlaceholder: boolean,
  ): Array<{ code: string; message: string; niveau: 'info' | 'warning' | 'block' }> {
    const alertes: Array<{ code: string; message: string; niveau: 'info' | 'warning' | 'block' }> = [];

    if (!contribuable) {
      alertes.push({
        code: 'CONTRIBUABLE_INEXISTANT',
        message: "Aucun profil contribuable n'est lié à ce compte.",
        niveau: 'block',
      });
      return alertes;
    }

    if (isProfilPlaceholder) {
      alertes.push({
        code: 'PROFIL_PLACEHOLDER',
        message:
          'Votre profil est en mode "placeholder". Complétez votre NIF, raison sociale et adresse pour débloquer toutes les fonctionnalités.',
        niveau: 'warning',
      });
    }

    if (contribuable.profilCompletude < 100 && !contribuable.profilLocked) {
      alertes.push({
        code: 'PROFIL_INCOMPLET',
        message: `Profil complété à ${contribuable.profilCompletude}%. Complétez-le pour atteindre 100% et verrouiller votre dossier.`,
        niveau: 'info',
      });
    }

    if (contribuable.profilLocked) {
      alertes.push({
        code: 'PROFIL_VERROUILLE',
        message: 'Votre profil est complet et verrouillé. Vous pouvez soumettre des demandes.',
        niveau: 'info',
      });
    }

    return alertes;
  }
}
