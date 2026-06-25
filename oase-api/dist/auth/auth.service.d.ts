import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { MfaService } from './mfa.service';
import { AuditService } from '../audit/audit.service';
import { LoginDto } from './dto/login.dto';
import { SetPinDto } from './dto/set-pin.dto';
export interface AuthUser {
    id: string;
    email: string;
    nom: string;
    prenom: string;
    role: string;
    institutionId: string;
    institution: string;
    mfaActive: boolean;
    secteurAffecte?: string | null;
}
export declare class AuthService {
    private prisma;
    private jwt;
    private cfg;
    private mfa;
    private audit;
    constructor(prisma: PrismaService, jwt: JwtService, cfg: ConfigService, mfa: MfaService, audit: AuditService);
    validateCredentials(email: string, password: string): Promise<{
        institutions: {
            code: string;
            id: string;
            createdAt: Date;
            nom: string;
            typeCode: string;
            estActive: boolean;
        };
    } & {
        id: string;
        createdAt: Date;
        email: string;
        nom: string;
        prenom: string;
        passwordHash: string;
        role: string;
        institutionId: string;
        statutCode: string;
        mfaActive: boolean;
        mfaSecretEnc: string | null;
        pinHash: string | null;
        secteurAffecte: string | null;
        telephone: string | null;
        derniereConnexion: Date | null;
        ipDerniereCx: string | null;
        updatedAt: Date;
    }>;
    login(dto: LoginDto, ip: string, userAgent: string): Promise<{
        access_token: string;
        refresh_token: string;
        expires_in: number;
        user: AuthUser;
    } | {
        mfa_required: boolean;
        mfa_token: string;
        expires_in: number;
    }>;
    verifyMfa(mfaToken: string, code: string, ip: string, ua: string): Promise<{
        access_token: string;
        refresh_token: string;
        expires_in: number;
        user: AuthUser;
    }>;
    refreshToken(rawToken: string, ip: string, ua: string): Promise<{
        access_token: string;
        refresh_token: string;
        expires_in: number;
        user: AuthUser;
    }>;
    logout(rawToken: string): Promise<void>;
    setPin(userId: string, dto: SetPinDto): Promise<void>;
    verifyPin(userId: string, pin: string): Promise<boolean>;
    private issueTokenPair;
    private hashToken;
    private parseDuration;
}
