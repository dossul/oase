import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    cfg: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: cfg.getOrThrow<string>('JWT_SECRET'),
      ignoreExpiration: false,
    });
  }

  async validate(payload: any) {
    const user = await this.prisma.utilisateur.findUnique({
      where: { id: payload.sub },
      select: { id: true, statutCode: true, role: true },
    });

    if (!user || user.statutCode !== 'actif') {
      throw new UnauthorizedException({ code: 'COMPTE_INACTIF' });
    }

    return {
      id: payload.sub,
      email: payload.email,
      nom: payload.nom,
      prenom: payload.prenom,
      role: payload.role,
      institutionId: payload.institutionId,
      institution: payload.institution,
      mfaActive: payload.mfaActive,
      secteurAffecte: payload.secteurAffecte,
    };
  }
}
