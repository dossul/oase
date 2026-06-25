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
var SydoniaAdapter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SydoniaAdapter = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../../prisma/prisma.service");
const circuit_breaker_service_1 = require("../circuit-breaker.service");
let SydoniaAdapter = SydoniaAdapter_1 = class SydoniaAdapter {
    constructor(cfg, prisma, cb) {
        this.cfg = cfg;
        this.prisma = prisma;
        this.cb = cb;
        this.logger = new common_1.Logger(SydoniaAdapter_1.name);
        this.CIRCUIT = 'SYDONIA';
        this.cb.register(this.CIRCUIT, {
            failureThreshold: 5,
            timeout: 30_000,
            requestTimeout: 8_000,
        });
    }
    async verifierExoneration(nif, codeExo) {
        if (this.isMock())
            return this.mockVerifierExoneration(nif, codeExo);
        return this.cb.execute(this.CIRCUIT, async () => {
            const token = await this.getToken();
            const res = await fetch(`${this.endpoint()}/exonerations/verifier?nif=${nif}&code=${codeExo}`, { headers: { Authorization: `Bearer ${token}` } });
            if (!res.ok)
                throw new Error(`Sydonia HTTP ${res.status}`);
            const data = await res.json();
            return data.exoneration_valide === true;
        }, () => {
            this.logger.warn('Sydonia indisponible — fallback: exonération non vérifiable');
            return false;
        });
    }
    async getDeclarations(nif, annee) {
        if (this.isMock())
            return this.mockDeclarations(nif);
        return this.cb.execute(this.CIRCUIT, async () => {
            const token = await this.getToken();
            const params = new URLSearchParams({ nif, ...(annee ? { annee: String(annee) } : {}) });
            const res = await fetch(`${this.endpoint()}/declarations?${params}`, { headers: { Authorization: `Bearer ${token}` } });
            if (!res.ok)
                throw new Error(`Sydonia HTTP ${res.status}`);
            return (await res.json()).declarations ?? [];
        }, () => []);
    }
    async notifierDecision(referenceOase, codeExo, approuve) {
        if (this.isMock()) {
            this.logger.log(`[MOCK] Sydonia notifié : ${referenceOase} ${approuve ? 'APPROUVÉ' : 'REJETÉ'}`);
            return;
        }
        await this.cb.execute(this.CIRCUIT, async () => {
            const token = await this.getToken();
            await fetch(`${this.endpoint()}/exonerations/notifier`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ reference_oase: referenceOase, code_exoneration: codeExo, approuve }),
            });
        });
    }
    async getToken() {
        const conn = await this.prisma.connecteur.findUnique({ where: { codeSysteme: 'SYDONIA' } });
        if (!conn)
            throw new Error('Connecteur SYDONIA non configuré');
        const cfg = conn.configAuth;
        const res = await fetch(cfg.token_url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'client_credentials',
                client_id: cfg.client_id,
                client_secret: cfg.client_secret,
            }),
        });
        const data = await res.json();
        return data.access_token;
    }
    endpoint() {
        return this.cfg.get('SYDONIA_ENDPOINT', 'https://sydonia.otr.tg/api/v2');
    }
    isMock() {
        return this.cfg.get('SYDONIA_MOCK', 'true') === 'true';
    }
    mockVerifierExoneration(nif, code) {
        const valid = ['TG-LOM-2018-B-0042', 'TG-KAR-2020-A-0115'];
        return valid.includes(nif) && ['141', '142', '143'].includes(code);
    }
    mockDeclarations(nif) {
        return [
            {
                numero_declaration: `SYD-${Date.now()}-001`,
                nif_importateur: nif,
                code_exoneration: '141',
                montant_droits: 4_500_000,
                date_declaration: '2026-03-15',
                bureau_douane: 'Lomé Port',
                statut: 'validee',
            },
            {
                numero_declaration: `SYD-${Date.now()}-002`,
                nif_importateur: nif,
                code_exoneration: '142',
                montant_droits: 2_100_000,
                date_declaration: '2026-05-02',
                bureau_douane: 'Lomé Port',
                statut: 'validee',
            },
        ];
    }
};
exports.SydoniaAdapter = SydoniaAdapter;
exports.SydoniaAdapter = SydoniaAdapter = SydoniaAdapter_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_1.PrismaService,
        circuit_breaker_service_1.CircuitBreakerService])
], SydoniaAdapter);
//# sourceMappingURL=sydonia.adapter.js.map