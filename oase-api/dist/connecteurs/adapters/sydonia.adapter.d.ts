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
export declare class SydoniaAdapter {
    private cfg;
    private prisma;
    private cb;
    private readonly logger;
    private readonly CIRCUIT;
    constructor(cfg: ConfigService, prisma: PrismaService, cb: CircuitBreakerService);
    verifierExoneration(nif: string, codeExo: string): Promise<boolean>;
    getDeclarations(nif: string, annee?: number): Promise<SydoniaDeclaration[]>;
    notifierDecision(referenceOase: string, codeExo: string, approuve: boolean): Promise<void>;
    private getToken;
    private endpoint;
    private isMock;
    private mockVerifierExoneration;
    private mockDeclarations;
}
