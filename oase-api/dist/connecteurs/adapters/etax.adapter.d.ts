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
export declare class EtaxAdapter {
    private cfg;
    private cb;
    private readonly logger;
    private readonly CIRCUIT;
    constructor(cfg: ConfigService, cb: CircuitBreakerService);
    getStatutFiscal(nif: string): Promise<StatutFiscalResult>;
    notifierDecision(nif: string, codeExo: string, approuve: boolean): Promise<void>;
    private endpoint;
    private isMock;
    private mockStatutFiscal;
}
