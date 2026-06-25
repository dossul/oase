"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const bcrypt = __importStar(require("bcrypt"));
const crypto_1 = require("crypto");
const prisma_service_1 = require("../prisma/prisma.service");
const mfa_service_1 = require("./mfa.service");
const audit_service_1 = require("../audit/audit.service");
let AuthService = class AuthService {
    constructor(prisma, jwt, cfg, mfa, audit) {
        this.prisma = prisma;
        this.jwt = jwt;
        this.cfg = cfg;
        this.mfa = mfa;
        this.audit = audit;
    }
    async validateCredentials(email, password) {
        const user = await this.prisma.utilisateur.findUnique({
            where: { email },
            include: { institutions: true },
        });
        if (!user || user.statutCode !== 'actif') {
            throw new common_1.UnauthorizedException({ code: 'CREDENTIALS_INVALIDES' });
        }
        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) {
            await this.audit.createEntry({
                action: 'LOGIN_ECHEC',
                entite: 'utilisateurs',
                entiteId: user.id,
                utilisateurId: user.id,
                nouvelleValeur: { reason: 'password_incorrect' },
            });
            throw new common_1.UnauthorizedException({ code: 'CREDENTIALS_INVALIDES' });
        }
        return user;
    }
    async login(dto, ip, userAgent) {
        const user = await this.validateCredentials(dto.email, dto.password);
        const mfaRequis = user.mfaActive;
        if (mfaRequis) {
            const mfaToken = this.jwt.sign({ sub: user.id, step: 'mfa_pending' }, { expiresIn: '5m', secret: this.cfg.getOrThrow('JWT_SECRET') + '_mfa' });
            return { mfa_required: true, mfa_token: mfaToken, expires_in: 300 };
        }
        return this.issueTokenPair(user, ip, userAgent);
    }
    async verifyMfa(mfaToken, code, ip, ua) {
        let payload;
        try {
            payload = this.jwt.verify(mfaToken, {
                secret: this.cfg.getOrThrow('JWT_SECRET') + '_mfa',
            });
        }
        catch {
            throw new common_1.UnauthorizedException({ code: 'MFA_TOKEN_EXPIRE' });
        }
        if (payload.step !== 'mfa_pending') {
            throw new common_1.UnauthorizedException({ code: 'MFA_TOKEN_INVALIDE' });
        }
        const user = await this.prisma.utilisateur.findUniqueOrThrow({
            where: { id: payload.sub },
            include: { institutions: true },
        });
        const valid = await this.mfa.verifyTotp(user.mfaSecretEnc, code);
        if (!valid) {
            throw new common_1.UnauthorizedException({ code: 'CODE_MFA_INVALIDE' });
        }
        return this.issueTokenPair(user, ip, ua);
    }
    async refreshToken(rawToken, ip, ua) {
        const tokenHash = this.hashToken(rawToken);
        const stored = await this.prisma.refreshToken.findUnique({
            where: { tokenHash: tokenHash },
        });
        if (!stored || stored.estRevoque || stored.expiresAt < new Date()) {
            throw new common_1.UnauthorizedException({ code: 'REFRESH_TOKEN_INVALIDE' });
        }
        await this.prisma.refreshToken.update({
            where: { id: stored.id },
            data: { estRevoque: true },
        });
        const user = await this.prisma.utilisateur.findUniqueOrThrow({
            where: { id: stored.utilisateurId },
            include: { institutions: true },
        });
        return this.issueTokenPair(user, ip, ua);
    }
    async logout(rawToken) {
        const tokenHash = this.hashToken(rawToken);
        await this.prisma.refreshToken.updateMany({
            where: { tokenHash: tokenHash },
            data: { estRevoque: true },
        });
    }
    async setPin(userId, dto) {
        const user = await this.prisma.utilisateur.findUniqueOrThrow({
            where: { id: userId },
        });
        if (user.pinHash) {
            const ok = await bcrypt.compare(dto.current_pin, user.pinHash);
            if (!ok)
                throw new common_1.UnauthorizedException({ code: 'PIN_INVALIDE' });
        }
        if (dto.pin !== dto.pin_confirm) {
            throw new common_1.ConflictException({ code: 'PIN_CONFIRMATION_INCORRECTE' });
        }
        const pinHash = await bcrypt.hash(dto.pin, 12);
        await this.prisma.utilisateur.update({
            where: { id: userId },
            data: { pinHash: pinHash },
        });
        await this.audit.createEntry({
            action: 'PIN_MODIFIE',
            entite: 'utilisateurs',
            entiteId: userId,
            utilisateurId: userId,
        });
    }
    async verifyPin(userId, pin) {
        const user = await this.prisma.utilisateur.findUniqueOrThrow({
            where: { id: userId },
            select: { pinHash: true },
        });
        if (!user.pinHash)
            return false;
        return bcrypt.compare(pin, user.pinHash);
    }
    async issueTokenPair(user, ip, ua) {
        const payload = {
            id: user.id,
            email: user.email,
            nom: user.nom,
            prenom: user.prenom,
            role: user.role,
            institutionId: user.institutionId,
            institution: user.institutions.nom,
            mfaActive: user.mfaActive,
            secteurAffecte: user.secteurAffecte,
        };
        const accessToken = this.jwt.sign({ sub: user.id, ...payload }, { expiresIn: this.cfg.get('JWT_ACCESS_EXPIRATION', '15m') });
        const rawRefresh = (0, crypto_1.randomBytes)(48).toString('hex');
        const tokenHash = this.hashToken(rawRefresh);
        const expiresAt = new Date(Date.now() + this.parseDuration(this.cfg.get('JWT_REFRESH_EXPIRATION', '7d')));
        await this.prisma.refreshToken.create({
            data: {
                utilisateurId: user.id,
                tokenHash: tokenHash,
                expiresAt: expiresAt,
                ip,
                userAgent: ua,
            },
        });
        await this.prisma.utilisateur.update({
            where: { id: user.id },
            data: { derniereConnexion: new Date(), ipDerniereCx: ip },
        });
        await this.audit.createEntry({
            action: 'LOGIN_SUCCES',
            entite: 'utilisateurs',
            entiteId: user.id,
            utilisateurId: user.id,
            roleAuMoment: user.role,
            institution: user.institutions.nom,
            ip,
        });
        return {
            access_token: accessToken,
            refresh_token: rawRefresh,
            expires_in: 900,
            user: payload,
        };
    }
    hashToken(raw) {
        return (0, crypto_1.createHash)('sha256').update(raw).digest('hex');
    }
    parseDuration(duration) {
        const units = {
            s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000,
        };
        const match = duration.match(/^(\d+)([smhd])$/);
        if (!match)
            return 7 * 86_400_000;
        return parseInt(match[1]) * units[match[2]];
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        config_1.ConfigService,
        mfa_service_1.MfaService,
        audit_service_1.AuditService])
], AuthService);
//# sourceMappingURL=auth.service.js.map