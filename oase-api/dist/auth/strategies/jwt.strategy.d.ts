import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
declare const JwtStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtStrategy extends JwtStrategy_base {
    private prisma;
    constructor(cfg: ConfigService, prisma: PrismaService);
    validate(payload: any): Promise<{
        id: any;
        email: any;
        nom: any;
        prenom: any;
        role: any;
        institutionId: any;
        institution: any;
        mfaActive: any;
        secteurAffecte: any;
    }>;
}
export {};
