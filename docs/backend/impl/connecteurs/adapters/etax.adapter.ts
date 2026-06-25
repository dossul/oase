import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CircuitBreakerService } from '../circuit-breaker.service';

export interface StatutFiscalResult {
  nif: string;
  raisonSociale: string;
  statut: 'conforme' | 'dette_active' | 'inconnu';
  solde_dette_fcfa?: number;
  derniere_declaration?: string;
  source: 'etax' | 'mock';
}

/**
 * EtaxAdapter — interface vers SIGTAS (E-TAX OTR-CI).
 *
 * Opérations :
 *  - getStatutFiscal   : statut fiscal temps réel d'un NIF
 *  - verifierExo       : vérifie si un code E-TAX est actif
 *  - notifierDecision  : pousse la décision dans E-TAX
 */
@Injectable()
export class EtaxAdapter {
  private readonly logger = new Logger(EtaxAdapter.name);
  private readonly CIRCUIT = 'ETAX';

  constructor(
    private cfg: ConfigService,
    private cb: CircuitBreakerService,
  ) {
    this.cb.register(this.CIRCUIT, {
      failureThreshold: 3,
      timeout: 20_000,
      requestTimeout: 5_000,
    });
  }

  async getStatutFiscal(nif: string): Promise<StatutFiscalResult> {
    if (this.isMock()) return this.mockStatutFiscal(nif);

    return this.cb.execute(
      this.CIRCUIT,
      async () => {
        const res = await fetch(
          `${this.endpoint()}/contribuables/${nif}/statut`,
          { headers: { 'X-Api-Key': this.cfg.getOrThrow('ETAX_API_KEY') } },
        );
        if (!res.ok) throw new Error(`E-TAX HTTP ${res.status}`);
        return await res.json();
      },
      () => ({ nif, raisonSociale: '', statut: 'inconnu' as const, source: 'mock' as const }),
    );
  }

  async notifierDecision(nif: string, codeExo: string, approuve: boolean): Promise<void> {
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

  private endpoint() { return this.cfg.get('ETAX_ENDPOINT', 'https://etax.otr.tg/api/v1'); }
  private isMock()   { return this.cfg.get('ETAX_MOCK', 'true') === 'true'; }

  private mockStatutFiscal(nif: string): StatutFiscalResult {
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
}
