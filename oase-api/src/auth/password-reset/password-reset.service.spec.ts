import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import { PasswordResetService } from './password-reset.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

const hashCode = (code: string, sel: string) =>
  createHash('sha256').update(`${code}:${sel}`).digest('hex');

describe('PasswordResetService', () => {
  let service: PasswordResetService;
  let prisma: any;
  let audit: any;
  let cfg: any;

  const user = {
    id: 'user-1',
    email: 'kossiwa.amele@texlome.tg',
    role: 'contribuable',
    statutCode: 'actif',
  };

  beforeEach(() => {
    prisma = {
      utilisateur: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      mfaChallenge: {
        updateMany: jest.fn(),
        create: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      refreshToken: {
        updateMany: jest.fn(),
      },
    };
    audit = { createEntry: jest.fn().mockResolvedValue({}) };
    // SMTP absent → placeholder log (pas d'envoi réel en tests unitaires)
    cfg = { get: jest.fn().mockReturnValue(undefined) };
    service = new PasswordResetService(prisma as PrismaService, cfg as ConfigService, audit as AuditService);
  });

  describe('requestReset', () => {
    it('compte actif → challenge créé + audit, réponse uniforme', async () => {
      prisma.utilisateur.findUnique.mockResolvedValue(user);

      const res = await service.requestReset({ email: 'Kossiwa.Amele@Texlome.tg' }, '1.2.3.4', 'jest');

      expect(res.data.envoye).toBe(true);
      // Email normalisé en minuscules pour la recherche
      expect(prisma.utilisateur.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { email: 'kossiwa.amele@texlome.tg' } }),
      );
      // Anciens challenges invalidés puis nouveau créé (canal password_reset)
      expect(prisma.mfaChallenge.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ canal: 'password_reset', estUtilise: false }) }),
      );
      expect(prisma.mfaChallenge.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            utilisateurId: 'user-1',
            canal: 'password_reset',
            tentatives: 0,
            estUtilise: false,
          }),
        }),
      );
      expect(audit.createEntry).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'PASSWORD_RESET_DEMANDE', utilisateurId: 'user-1' }),
      );
    });

    it('e-mail inconnu → AUCUN challenge, AUCUN audit, réponse identique (anti-énumération)', async () => {
      prisma.utilisateur.findUnique.mockResolvedValue(null);

      const res = await service.requestReset({ email: 'inconnu@nowhere.tg' }, '1.2.3.4', 'jest');

      expect(res.data.envoye).toBe(true);
      expect(prisma.mfaChallenge.create).not.toHaveBeenCalled();
      expect(audit.createEntry).not.toHaveBeenCalled();
    });

    it('compte non actif → aucun challenge, réponse identique', async () => {
      prisma.utilisateur.findUnique.mockResolvedValue({ ...user, statutCode: 'suspendu' });

      const res = await service.requestReset({ email: user.email }, '1.2.3.4', 'jest');

      expect(res.data.envoye).toBe(true);
      expect(prisma.mfaChallenge.create).not.toHaveBeenCalled();
    });
  });

  describe('confirmReset', () => {
    const dto = {
      email: user.email,
      code: '482915',
      newPassword: 'Nouveau@2026!',
      newPasswordConfirm: 'Nouveau@2026!',
    };
    const challenge = {
      id: 'ch-1',
      utilisateurId: 'user-1',
      canal: 'password_reset',
      codeHash: hashCode('482915', 'sel-1'),
      sel: 'sel-1',
      tentatives: 0,
      expiresAt: new Date(Date.now() + 60_000),
      estUtilise: false,
    };

    beforeEach(() => {
      prisma.utilisateur.findUnique.mockResolvedValue(user);
      prisma.mfaChallenge.findFirst.mockResolvedValue(challenge);
      prisma.refreshToken.updateMany.mockResolvedValue({ count: 2 });
    });

    it('code correct → mot de passe changé, sessions révoquées, audit SUCCES', async () => {
      const res = await service.confirmReset(dto, '1.2.3.4', 'jest');

      expect(res.data.reset).toBe(true);
      // Challenge consommé AVANT le changement
      expect(prisma.mfaChallenge.update).toHaveBeenCalledWith({
        where: { id: 'ch-1' },
        data: { estUtilise: true },
      });
      expect(prisma.utilisateur.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'user-1' } }),
      );
      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { utilisateurId: 'user-1', estRevoque: false },
        data: { estRevoque: true },
      });
      expect(audit.createEntry).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'PASSWORD_RESET_SUCCES' }),
      );
    });

    it('confirmation différente → 400 PASSWORD_CONFIRMATION_INCORRECTE (avant toute vérif)', async () => {
      await expect(
        service.confirmReset({ ...dto, newPasswordConfirm: 'Autre@2026!' }, '1.2.3.4', 'jest'),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.mfaChallenge.findFirst).not.toHaveBeenCalled();
    });

    it('code incorrect → 401 RESET_CODE_INVALIDE + tentatives incrémentées + audit ECHEC', async () => {
      await expect(
        service.confirmReset({ ...dto, code: '000000' }, '1.2.3.4', 'jest'),
      ).rejects.toThrow(UnauthorizedException);
      expect(prisma.mfaChallenge.update).toHaveBeenCalledWith({
        where: { id: 'ch-1' },
        data: { tentatives: 1 },
      });
      expect(audit.createEntry).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'PASSWORD_RESET_ECHEC' }),
      );
      expect(prisma.utilisateur.update).not.toHaveBeenCalled();
    });

    it('challenge expiré → 401 + challenge consommé', async () => {
      prisma.mfaChallenge.findFirst.mockResolvedValue({
        ...challenge,
        expiresAt: new Date(Date.now() - 60_000),
      });

      await expect(service.confirmReset(dto, '1.2.3.4', 'jest')).rejects.toThrow(UnauthorizedException);
      expect(prisma.mfaChallenge.update).toHaveBeenCalledWith({
        where: { id: 'ch-1' },
        data: { estUtilise: true },
      });
    });

    it('5 tentatives atteintes → 401 + challenge consommé', async () => {
      prisma.mfaChallenge.findFirst.mockResolvedValue({ ...challenge, tentatives: 5 });

      await expect(service.confirmReset(dto, '1.2.3.4', 'jest')).rejects.toThrow(UnauthorizedException);
      expect(prisma.mfaChallenge.update).toHaveBeenCalledWith({
        where: { id: 'ch-1' },
        data: { estUtilise: true },
      });
    });

    it('e-mail inconnu → 401 identique (anti-énumération), aucun audit', async () => {
      prisma.utilisateur.findUnique.mockResolvedValue(null);

      await expect(service.confirmReset(dto, '1.2.3.4', 'jest')).rejects.toThrow(UnauthorizedException);
      expect(audit.createEntry).not.toHaveBeenCalled();
    });

    it('compte suspendu → 401 + audit ECHEC (pas de contournement de suspension)', async () => {
      prisma.utilisateur.findUnique.mockResolvedValue({ ...user, statutCode: 'suspendu' });

      await expect(service.confirmReset(dto, '1.2.3.4', 'jest')).rejects.toThrow(UnauthorizedException);
      expect(audit.createEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'PASSWORD_RESET_ECHEC',
          nouvelleValeur: expect.objectContaining({ reason: 'user_non_actif' }),
        }),
      );
    });
  });
});
