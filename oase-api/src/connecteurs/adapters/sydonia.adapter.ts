import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { CircuitBreakerService } from '../circuit-breaker.service';

export interface SydoniaDeclaration {
  numero_declaration: string;
  nif_importateur: string;
  code_exoneration: string;
  montant_droits: number;
  date_declaration: string;
  bureau_douane: string;
  statut: 'validee' | 'en_attente' | 'annulee';
}

@Injectable()
export class SydoniaAdapter {
  private readonly logger = new Logger(SydoniaAdapter.name);
  private readonly CIRCUIT = 'SYDONIA';

  constructor(
    private cfg: ConfigService,
    private prisma: PrismaService,
    private cb: CircuitBreakerService,
  ) {
    this.cb.register(this.CIRCUIT, {
      failureThreshold: 5,
      timeout: 30_000,
      requestTimeout: 8_000,
    });
  }

  async verifierExoneration(nif: string, codeExo: string): Promise<boolean> {
    if (this.isMock()) return this.mockVerifierExoneration(nif, codeExo);

    return this.cb.execute(
      this.CIRCUIT,
      async () => {
        const token = await this.getToken();
        const res = await fetch(`${this.endpoint()}/exonerations/verifier?nif=${nif}&code=${codeExo}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`Sydonia HTTP ${res.status}`);
        const data: any = await res.json();
        return data.exoneration_valide === true;
      },
      () => {
        this.logger.warn('Sydonia indisponible — fallback: exonération non vérifiable');
        return false;
      },
    );
  }

  async getDeclarations(nif: string, annee?: number): Promise<SydoniaDeclaration[]> {
    if (this.isMock()) return this.mockDeclarations(nif);

    return this.cb.execute(
      this.CIRCUIT,
      async () => {
        const token = await this.getToken();
        const params = new URLSearchParams({ nif, ...(annee ? { annee: String(annee) } : {}) });
        const res = await fetch(`${this.endpoint()}/declarations?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`Sydonia HTTP ${res.status}`);
        return (await res.json()).declarations ?? [];
      },
      () => [],
    );
  }

  async notifierDecision(referenceOase: string, codeExo: string, approuve: boolean): Promise<void> {
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

  private async getToken(): Promise<string> {
    const conn = await this.prisma.connecteur.findUnique({ where: { codeSysteme: 'SYDONIA' } });
    if (!conn) throw new Error('Connecteur SYDONIA non configuré');
    const cfg: any = conn.configAuth;
    const res = await fetch(cfg.token_url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: cfg.client_id,
        client_secret: cfg.client_secret,
      }),
    });
    const data: any = await res.json();
    return data.access_token;
  }

  private endpoint(): string {
    return this.cfg.get('SYDONIA_ENDPOINT', 'https://sydonia.otr.tg/api/v2');
  }

  private isMock(): boolean {
    return this.cfg.get('SYDONIA_MOCK', 'true') === 'true';
  }

  private mockVerifierExoneration(nif: string, code: string): boolean {
    const valid = ['TG-LOM-2018-B-0042', 'TG-KAR-2020-A-0115'];
    return valid.includes(nif) && ['141', '142', '143'].includes(code);
  }

  private mockDeclarations(nif: string): SydoniaDeclaration[] {
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
}
