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
exports.MfaService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const speakeasy = __importStar(require("speakeasy"));
const crypto_1 = require("crypto");
let MfaService = class MfaService {
    constructor(cfg) {
        this.cfg = cfg;
        this.algorithm = 'aes-256-gcm';
    }
    generateSecret() {
        const secret = speakeasy.generateSecret({ length: 32 });
        const otpauthUrl = speakeasy.otpauthURL({
            secret: secret.base32,
            label: 'OASE MEF Togo',
            issuer: 'OASE',
            encoding: 'base32',
        });
        return { secret: secret.base32, otpauthUrl: otpauthUrl };
    }
    async verifyTotp(encryptedSecret, token) {
        try {
            const secret = this.decrypt(encryptedSecret);
            return speakeasy.totp.verify({
                secret,
                encoding: 'base32',
                token,
                window: 1,
            });
        }
        catch {
            return false;
        }
    }
    encrypt(plaintext) {
        const key = Buffer.from(this.cfg.getOrThrow('ENCRYPTION_KEY').padEnd(32).slice(0, 32));
        const iv = (0, crypto_1.randomBytes)(12);
        const cipher = (0, crypto_1.createCipheriv)(this.algorithm, key, iv);
        const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
        const tag = cipher.getAuthTag();
        return [
            iv.toString('hex'),
            tag.toString('hex'),
            encrypted.toString('hex'),
        ].join(':');
    }
    decrypt(ciphertext) {
        const key = Buffer.from(this.cfg.getOrThrow('ENCRYPTION_KEY').padEnd(32).slice(0, 32));
        const [ivHex, tagHex, dataHex] = ciphertext.split(':');
        const decipher = (0, crypto_1.createDecipheriv)(this.algorithm, key, Buffer.from(ivHex, 'hex'));
        decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
        return decipher.update(Buffer.from(dataHex, 'hex')).toString('utf8') +
            decipher.final('utf8');
    }
};
exports.MfaService = MfaService;
exports.MfaService = MfaService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], MfaService);
//# sourceMappingURL=mfa.service.js.map