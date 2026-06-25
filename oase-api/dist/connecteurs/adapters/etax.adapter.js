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
var EtaxAdapter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EtaxAdapter = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const circuit_breaker_service_1 = require("../circuit-breaker.service");
let EtaxAdapter = EtaxAdapter_1 = class EtaxAdapter {
    constructor(cfg, cb) {
        this.cfg = cfg;
        this.cb = cb;
        this.logger = new common_1.Logger(EtaxAdapter_1.name);
        this.CIRCUIT = 'ETAX';
        this.cb.register(this.CIRCUIT, {
            failureThreshold: 3,
            timeout: 20_000,
            requestTimeout: 5_000,
        });
    }
    async getStatutFiscal(nif) {
        if (this.isMock())
            return this.mockStatutFiscal(nif);
        return this.cb.execute(this.CIRCUIT, async () => {
            const res = await fetch(`${this.endpoint()}/contribuables/${nif}/statut`, { headers: { 'X-Api-Key': this.cfg.getOrThrow('ETAX_API_KEY') } });
            if (!res.ok)
                throw new Error(`E-TAX HTTP ${res.status}`);
            return await res.json();
        }, () => ({ nif, raisonSociale: '', statut: 'inconnu', source: 'mock' }));
    }
    async notifierDecision(nif, codeExo, approuve) {
        if (this.isMock()) {
            this.logger.log(`[MOCK] E-TAX notifié : ${nif} / ${codeExo} → ${approuve ? 'APPROUVÉ' : 'REJETÉ'}`);
            return;
        }
        await this.cb.execute(this.CIRCUIT, async () => {
            await fetch(`${this.endpoint()}/exonerations/sync`, {
                method: 'POST',
                headers: {
                    'X-Api-Key': this.cfg.getOrThrow('ETAX_API_KEY'),
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ nif, code_exoneration: codeExo, approuve }),
            });
        });
    }
    endpoint() { return this.cfg.get('ETAX_ENDPOINT', 'https://etax.otr.tg/api/v1'); }
    isMock() { return this.cfg.get('ETAX_MOCK', 'true') === 'true'; }
    mockStatutFiscal(nif) {
        const conformes = ['TG-LOM-2018-B-0042', 'TG-KAR-2020-A-0115', 'TG-INT-ONU-PNUD'];
        return {
            nif,
            raisonSociale: nif === 'TG-LOM-2018-B-0042' ? 'TEXLOME SA' : 'Contribuable',
            statut: conformes.includes(nif) ? 'conforme' : 'dette_active',
            solde_dette_fcfa: conformes.includes(nif) ? 0 : 1_250_000,
            derniere_declaration: '2026-04-30',
            source: 'mock',
        };
    }
};
exports.EtaxAdapter = EtaxAdapter;
exports.EtaxAdapter = EtaxAdapter = EtaxAdapter_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        circuit_breaker_service_1.CircuitBreakerService])
], EtaxAdapter);
//# sourceMappingURL=etax.adapter.js.map