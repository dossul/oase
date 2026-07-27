import {
  Injectable,
  Inject,
  BadRequestException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { ISmsAdapter, SMS_ADAPTER } from './adapters/sms-adapter.interface';
import { RequestOtpDto, OtpContext } from './dto/request-otp.dto';

export interface RequestOtpResult {
  envoye: true;
  telephone: string;
  contexte: OtpContext;
  expireDans: number;
  /** DEV UNIQUEMENT : code en clair si OTP_EXPOSE_CODE_IN_RESPONSE=true. */
  codeDev?: string;
}

export interface VerifyOtpResult {
  valide: true;
  telephone: string;
  contexte: OtpContext;
  /** Payload contextuel posé à la création (ex: { email } pour SIGNUP). */
  payload: Record<string, unknown> | null;
}

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    @Inject(SMS_ADAPTER) private sms: ISmsAdapter,
  ) {}

  /**
   * Demande un OTP : invalide tout OTP actif précédent pour ce couple
   * (telephone, contexte), en génère un nouveau, et l'envoie via l'adapter SMS.
   */
  async demander(dto: RequestOtpDto, ipOrigine?: string): Promise<RequestOtpResult> {
    const ttlSeconds = this.config.get<number>('OTP_TTL_SECONDS', 600);
    const codeLength = this.config.get<number>('OTP_LENGTH', 6);
    const exposeCode = this.config.get<boolean>('OTP_EXPOSE_CODE_IN_RESPONSE', false);

    // 1. Invalider tous les OTPs actifs précédents pour ce couple
    await this.prisma.phoneOtpCode.updateMany({
      where: { telephone: dto.telephone, contexte: dto.contexte, estUtilise: false },
      data: { estUtilise: true },
    });

    // 2. Générer code + sel + hash
    const code = this.genererCode(codeLength);
    const sel = randomBytes(16).toString('hex'); // 32 chars
    const codeHash = this.hashCode(code, sel);
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

    // 3. Persister
    await this.prisma.phoneOtpCode.create({
      data: {
        telephone: dto.telephone,
        contexte: dto.contexte,
        codeHash,
        sel,
        payloadJson: (dto.payload as any) ?? undefined,
        tentatives: 0,
        expiresAt,
        estUtilise: false,
        ipOrigine: ipOrigine ?? null,
      },
    });

    // 4. Envoyer via l'adapter SMS
    const corps = this.formaterSms(dto.contexte, code, ttlSeconds);
    await this.sms.envoyer({ telephone: dto.telephone, corps });

    this.logger.log(
      `OTP ${dto.contexte} envoyé à ${this.masquerTelephone(dto.telephone)} (expire dans ${ttlSeconds}s)`,
    );

    return {
      envoye: true,
      telephone: dto.telephone,
      contexte: dto.contexte,
      expireDans: ttlSeconds,
      ...(exposeCode ? { codeDev: code } : {}),
    };
  }

  /**
   * Vérifie un OTP : incrémente les tentatives, refuse si expiré / déjà utilisé /
   * trop de tentatives / code incorrect. Renvoie le payload contextuel en cas de succès.
   */
  async verifier(
    telephone: string,
    contexte: OtpContext,
    code: string,
  ): Promise<VerifyOtpResult> {
    const maxAttempts = this.config.get<number>('OTP_MAX_ATTEMPTS', 5);

    // Chercher l'OTP actif le plus récent
    const otp = await this.prisma.phoneOtpCode.findFirst({
      where: { telephone, contexte, estUtilise: false },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp) {
      throw new UnauthorizedException({ code: 'OTP_INEXISTANT_OU_DEJA_UTILISE' });
    }

    if (otp.expiresAt.getTime() < Date.now()) {
      // Marquer comme utilisé pour ne pas le réutiliser
      await this.prisma.phoneOtpCode.update({
        where: { id: otp.id },
        data: { estUtilise: true },
      });
      throw new UnauthorizedException({ code: 'OTP_EXPIRE' });
    }

    if (otp.tentatives >= maxAttempts) {
      // Trop de tentatives : on brûle l'OTP
      await this.prisma.phoneOtpCode.update({
        where: { id: otp.id },
        data: { estUtilise: true },
      });
      throw new UnauthorizedException({ code: 'OTP_TROP_DE_TENTATIVES' });
    }

    const codeHash = this.hashCode(code, otp.sel);
    const match = codeHash === otp.codeHash;

    if (!match) {
      // Incrémenter les tentatives
      await this.prisma.phoneOtpCode.update({
        where: { id: otp.id },
        data: { tentatives: otp.tentatives + 1 },
      });
      this.logger.warn(
        `OTP ${contexte} mauvais code pour ${this.masquerTelephone(telephone)} (tentative ${otp.tentatives + 1}/${maxAttempts})`,
      );
      throw new UnauthorizedException({ code: 'OTP_INVALIDE' });
    }

    // Succès : marquer utilisé
    await this.prisma.phoneOtpCode.update({
      where: { id: otp.id },
      data: { estUtilise: true },
    });

    this.logger.log(
      `OTP ${contexte} validé pour ${this.masquerTelephone(telephone)}`,
    );

    return {
      valide: true,
      telephone,
      contexte,
      payload: (otp.payloadJson as Record<string, unknown> | null) ?? null,
    };
  }

  // --- Helpers privés ---

  private genererCode(length: number): string {
    // Code numérique pur, zéro-padded à gauche
    const max = 10 ** length;
    const code = Math.floor(Math.random() * max).toString();
    return code.padStart(length, '0');
  }

  private hashCode(code: string, sel: string): string {
    return createHash('sha256').update(`${code}:${sel}`).digest('hex');
  }

  private formaterSms(contexte: OtpContext, code: string, ttlSeconds: number): string {
    const minutes = Math.ceil(ttlSeconds / 60);
    const label = contexte === 'SIGNUP' ? 'activer votre compte OASE' : 'reinitialiser votre mot de passe';
    return `OASE: votre code pour ${label} est ${code}. Valable ${minutes} min. Ne le partagez pas.`;
  }

  private masquerTelephone(tel: string): string {
    if (tel.length <= 6) return tel;
    return `${tel.slice(0, 4)}***${tel.slice(-2)}`;
  }
}
