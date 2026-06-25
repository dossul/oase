import { PrismaService } from '../prisma/prisma.service';
export interface CreateAuditDto {
    action: string;
    entite: string;
    entiteId: string;
    utilisateurId?: string;
    roleAuMoment?: string;
    institution?: string;
    demandeId?: string;
    ancienneValeur?: Record<string, unknown>;
    nouvelleValeur?: Record<string, unknown>;
    ip?: string;
    userAgent?: string;
}
export declare class AuditService {
    private prisma;
    constructor(prisma: PrismaService);
    createEntry(dto: CreateAuditDto): Promise<void>;
    verifyChain(): Promise<{
        verified: number;
        breaks: string[];
    }>;
}
