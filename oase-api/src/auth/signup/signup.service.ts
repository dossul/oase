import {
  Injectable,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthService } from '../auth.service';
import { OtpService } from '../../otp/otp.service';
import { AuditService } from '../../audit/audit.service';
import { SignupDto } from './dto/signup.dto';

/**
 * Constante d'institution par défaut pour les nouveaux comptes contribuables.
 * L'OTR-CI est l'autorité fiscale de tutelle pour tous les contribuables togolais.
 * Si l'institution n'existe pas en base, c'est un problème de seed — on remonte
 * une erreur explicite plutôt que de la créer implicitement.
 */
const DEFAULT_CONTRIBUABLE_INSTITUTION_ID = 'inst-001';
const DEFAULT_CONTRIBUABLE_TYPE = 'personne_physique';
const DEFAULT_STATUT_FISCAL = 'inconnu';
const PASSWORD_HASH_ROUNDS = 12;

@Injectable()
export class SignupService {
  private readonly logger = new Logger(SignupService.name);

  constructor(
    private prisma: PrismaService,
    private auth: AuthService,
    private otp: OtpService,
    private audit: AuditService,
  ) {}

  /**
   * Inscription complète en 1 appel :
   *   1. Vérifie l'OTP (tel, SIGNUP) et son email matche celui du payload
   *   2. Vérifie que l'email n'existe pas déjà
   *   3. Hash le password
   *   4. Transaction : crée Utilisateur + Contribuable (profil placeholder)
   *   5. Audit
   *   6. Login direct via AuthService (access + refresh tokens)
   */
  async inscrire(dto: SignupDto, ip: string, ua: string) {
    // 1. Vérifier l'OTP (le consomme : marqué utilisé, retourne le payload)
    let otpPayload: Record<string, unknown> | null = null;
    try {
      const result = await this.otp.verifier(dto.telephone, dto.contexte, dto.codeOtp);
      otpPayload = result.payload;
    } catch (e: any) {
      // Le service OTP throw UnauthorizedException — on remappe en 400/401
      // selon le code pour que le front puisse afficher le bon message
      const code = e?.response?.code ?? 'OTP_ERREUR';
      if (code === 'OTP_INVALIDE' || code === 'OTP_EXPIRE' || code === 'OTP_TROP_DE_TENTATIVES') {
        throw e; // on garde le 401 + le code métier
      }
      throw new BadRequestException({ code });
    }

    // 2. Sécurité : l'email du body doit matcher celui mis dans le payload OTP
    // (sinon quelqu'un pourrait consommer l'OTP d'un autre avec son propre email)
    if (otpPayload && typeof otpPayload === 'object' && 'email' in otpPayload) {
      const otpEmail = String(otpPayload.email).toLowerCase();
      if (otpEmail !== dto.email.toLowerCase()) {
        throw new BadRequestException({ code: 'EMAIL_OTP_MISMATCH' });
      }
    }

    // 3. Email déjà pris ?
    const existing = await this.prisma.utilisateur.findUnique({
      where: { email: dto.email },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException({ code: 'EMAIL_DEJA_UTILISE' });
    }

    // 4. Hash password
    const passwordHash = await bcrypt.hash(dto.password, PASSWORD_HASH_ROUNDS);

    // 5. Transaction : Utilisateur + Contribuable profil placeholder
    const { user, contribuable } = await this.prisma.$transaction(async (tx) => {
      const user = await tx.utilisateur.create({
        data: {
          email: dto.email,
          passwordHash,
          nom: dto.nom,
          prenom: dto.prenom,
          telephone: dto.telephone,
          role: 'contribuable',
          institutionId: DEFAULT_CONTRIBUABLE_INSTITUTION_ID,
          statutCode: 'actif',
          mfaActive: false, // pas de MFA forcé à l'inscription
        },
      });

      // NIF placeholder unique : "PENDING-XXXXXXXX" basé sur l'UUID du user
      // Le vrai NIF sera renseigné lors de la complétion du profil contribuable.
      const nifPlaceholder = `PENDING-${user.id.replace(/-/g, '').slice(0, 12).toUpperCase()}`;

      const contribuable = await tx.contribuable.create({
        data: {
          userId: user.id,
          raisonSociale: `${dto.prenom} ${dto.nom}`,
          nif: nifPlaceholder,
          typeContribuableCode: DEFAULT_CONTRIBUABLE_TYPE,
          statutFiscalCode: DEFAULT_STATUT_FISCAL,
          telephone: dto.telephone,
          emailContact: dto.email,
          // 60% au signup = identité (20) + emailContact (10) + telephone (10)
          //                + raisonSociale auto (10) + type contribuable (10).
          // Manque : NIF réel (20) + adresse (15) + secteur (5) = 40%.
          // Le scoring est recalculé par ContribuableService à chaque PATCH.
          profilCompletude: 60,
          profilLocked: false,
          derniereMajCompletude: new Date(),
        },
      });

      return { user, contribuable };
    });

    // 6. Audit (2 entrées : user + contribuable)
    await this.audit.createEntry({
      action: 'USER_CREATED',
      entite: 'utilisateurs',
      entiteId: user.id,
      utilisateurId: user.id,
      roleAuMoment: 'contribuable',
      institution: 'OTR-CI',
      nouvelleValeur: {
        email: user.email,
        role: user.role,
        provenance: 'SIGNUP_OTP',
        telephone: user.telephone,
      },
      ip,
      userAgent: ua,
    });

    await this.audit.createEntry({
      action: 'CONTRIBUABLE_CREE',
      entite: 'contribuables',
      entiteId: contribuable.id,
      utilisateurId: user.id,
      nouvelleValeur: {
        userId: user.id,
        nif: contribuable.nif,
        typeContribuableCode: contribuable.typeContribuableCode,
        profilCompletude: contribuable.profilCompletude,
      },
      ip,
      userAgent: ua,
    });

    this.logger.log(
      `Nouveau compte contribuable: ${user.email} (userId=${user.id}, contribuableId=${contribuable.id})`,
    );

    // 7. Login direct : émet access + refresh tokens
    const userWithInstitution = {
      ...user,
      institutions: { nom: 'OTR-CI' },
      secteurAffecte: null,
    };
    const tokens = await this.auth.issueTokensForUser(userWithInstitution, ip, ua);

    return {
      ...tokens,
      contribuable: {
        id: contribuable.id,
        profilCompletude: contribuable.profilCompletude,
        profilLocked: contribuable.profilLocked,
        nif: contribuable.nif,
        raisonSociale: contribuable.raisonSociale,
      },
    };
  }
}
