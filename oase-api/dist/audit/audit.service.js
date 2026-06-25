"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const prisma_service_1 = require("../prisma/prisma.service");
let AuditService = class AuditService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createEntry(dto) {
        const last = await this.prisma.auditLog.findFirst({
            orderBy: { horodatage: 'desc' },
            select: { empreinteSha256: true },
        });
        const data = JSON.stringify({
            ...dto,
            horodatage: new Date().toISOString(),
            hashPrecedent: last?.empreinteSha256 ?? null,
        });
        const empreinte = (0, crypto_1.createHash)('sha256').update(data).digest('hex');
        await this.prisma.auditLog.create({
            data: {
                action: dto.action,
                entite: dto.entite,
                entiteId: dto.entiteId,
                utilisateurId: dto.utilisateurId ?? null,
                roleAuMoment: dto.roleAuMoment ?? null,
                institution: dto.institution ?? null,
                demandeId: dto.demandeId ?? null,
                ancienneValeur: dto.ancienneValeur ?? undefined,
                nouvelleValeur: dto.nouvelleValeur ?? undefined,
                ip: dto.ip ?? null,
                userAgent: dto.userAgent ?? null,
                hashPrecedent: last?.empreinteSha256 ?? null,
                empreinteSha256: empreinte,
            },
        });
    }
    async verifyChain() {
        const logs = await this.prisma.auditLog.findMany({
            orderBy: { horodatage: 'asc' },
        });
        const breaks = [];
        let prevHash = null;
        for (const log of logs) {
            if (log.hashPrecedent !== prevHash) {
                breaks.push(`[${log.id}] hashPrecedent attendu: ${prevHash}, trouvé: ${log.hashPrecedent}`);
            }
            prevHash = log.empreinteSha256;
        }
        return { verified: logs.length, breaks };
    }
};
exports.AuditService = AuditService;
exports.AuditService = AuditService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AuditService);
//# sourceMappingURL=audit.service.js.map