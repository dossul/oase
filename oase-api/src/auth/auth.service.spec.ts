import { UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { MfaService } from './mfa.service';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';

// Mock bcrypt entierement pour contourner la propriete non-redefinissable de bcrypt 6.x
jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

const bcryptMock = bcrypt as jest.Mocked<typeof bcrypt>;

describe('AuthService', () => {
  let service: AuthService;
  let prisma: jest.Mocked<PrismaService>;
  let jwt: jest.Mocked<JwtService>;
  let cfg: jest.Mocked<ConfigService>;
  let mfa: jest.Mocked<MfaService>;
  let audit: jest.Mocked<AuditService>;

  const mockUser = (overrides: Partial<any> = {}) => ({
    id: 'user-1',
    email: 'k.agbodjan@otr.tg',
    nom: 'AGBODJAN',
    prenom: 'Kossigan',
    role: 'agent_instructeur',
    institutionId: 'inst-1',
    institutions: { nom: 'OTR-CI' },
    statutCode: 'actif',
    passwordHash: '$2b$12$dummy.hash.value.for.testing.only',
    pinHash: null,
    mfaActive: false,
    mfaSecretEnc: 'encrypted-secret',
    secteurAffecte: null,
    ...overrides,
  });

  beforeEach(async () => {
    prisma = {
      utilisateur: {
        findUnique: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        update: jest.fn(),
      },
      refreshToken: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
    } as any;

    jwt = {
      sign: jest.fn().mockReturnValue('signed-jwt-token'),
      verify: jest.fn(),
    } as any;

    cfg = {
      get: jest.fn((key: string, def?: any) => {
        const map: Record<string, string> = {
          JWT_SECRET: 'test-secret',
          JWT_ACCESS_EXPIRATION: '15m',
          JWT_REFRESH_EXPIRATION: '7d',
        };
        return map[key] ?? def;
      }),
      getOrThrow: jest.fn((key: string) => {
        const map: Record<string, string> = {
          JWT_SECRET: 'test-secret',
          ENCRYPTION_KEY: 'a'.repeat(32),
        };
        if (!map[key]) throw new Error(`Missing config: ${key}`);
        return map[key];
      }),
    } as any;

    mfa = {
      verifyTotp: jest.fn().mockResolvedValue(true),
      generateSecret: jest.fn(),
      encrypt: jest.fn(),
      decrypt: jest.fn(),
    } as any;

    audit = {
      createEntry: jest.fn().mockResolvedValue(undefined),
    } as any;

    service = new AuthService(prisma, jwt, cfg, mfa, audit);
  });

  describe('validateCredentials', () => {
    it('rejette si utilisateur introuvable', async () => {
      (prisma.utilisateur.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(
        service.validateCredentials('nobody@oase.tg', 'pwd12345'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('rejette si statut != actif', async () => {
      (prisma.utilisateur.findUnique as jest.Mock).mockResolvedValue(
        mockUser({ statutCode: 'suspendu' }),
      );
      await expect(
        service.validateCredentials('k.agbodjan@otr.tg', 'pwd12345'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('rejette si mot de passe incorrect et journalise LOGIN_ECHEC', async () => {
      (prisma.utilisateur.findUnique as jest.Mock).mockResolvedValue(mockUser());
      // bcrypt.compare retourne false si le hash ne matche pas un mdp arbitraire
      await expect(
        service.validateCredentials('k.agbodjan@otr.tg', 'wrong-password'),
      ).rejects.toThrow(UnauthorizedException);
      expect(audit.createEntry).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'LOGIN_ECHEC' }),
      );
    });

    it('retourne utilisateur si credentials valides', async () => {
      const user = mockUser();
      bcryptMock.compare.mockResolvedValue(true as never);
      (prisma.utilisateur.findUnique as jest.Mock).mockResolvedValue(user);
      const result = await service.validateCredentials('k.agbodjan@otr.tg', 'good');
      expect(result.id).toBe('user-1');
    });
  });

  describe('login', () => {
    it('retourne mfa_required si MFA actif', async () => {
      bcryptMock.compare.mockResolvedValue(true as never);
      (prisma.utilisateur.findUnique as jest.Mock).mockResolvedValue(
        mockUser({ mfaActive: true }),
      );
      const result = await service.login(
        { email: 'k.agbodjan@otr.tg', password: 'good' },
        '127.0.0.1',
        'jest',
      );
      expect(result).toEqual(
        expect.objectContaining({ mfa_required: true, mfa_token: 'signed-jwt-token' }),
      );
      expect(result.expires_in).toBe(300);
    });

    it('retourne token pair si pas de MFA', async () => {
      bcryptMock.compare.mockResolvedValue(true as never);
      (prisma.utilisateur.findUnique as jest.Mock).mockResolvedValue(mockUser());
      (prisma.refreshToken.create as jest.Mock).mockResolvedValue({});
      (prisma.utilisateur.update as jest.Mock).mockResolvedValue({});

      const result = await service.login(
        { email: 'k.agbodjan@otr.tg', password: 'good' },
        '127.0.0.1',
        'jest',
      );
      const pair = result as { access_token: string; refresh_token: string; expires_in: number };
      expect(pair.access_token).toBe('signed-jwt-token');
      expect(pair.refresh_token).toMatch(/^[a-f0-9]{96}$/);
      expect(pair.expires_in).toBe(900);
      expect(audit.createEntry).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'LOGIN_SUCCES' }),
      );
    });

    // OASE [BUG #6] fix : le code legacy 'beneficiaire' doit être normalisé
    // en 'contribuable' dans le payload retourné, le JWT et l'audit, même si
    // la DB n'a pas encore reçu la migration 002. Ce test bloque la régression.
    it('normalise le rôle legacy "beneficiaire" → "contribuable" (BUG #6)', async () => {
      bcryptMock.compare.mockResolvedValue(true as never);
      (prisma.utilisateur.findUnique as jest.Mock).mockResolvedValue(
        mockUser({ email: 'contribuable@gouv.tg', role: 'beneficiaire' }),
      );
      (prisma.refreshToken.create as jest.Mock).mockResolvedValue({});
      (prisma.utilisateur.update as jest.Mock).mockResolvedValue({});

      const result = await service.login(
        { email: 'contribuable@gouv.tg', password: 'good' },
        '127.0.0.1',
        'jest',
      );
      const pair = result as { user: { role: string } };
      expect(pair.user.role).toBe('contribuable');

      // L'audit log doit aussi avoir la valeur normalisée
      expect(audit.createEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'LOGIN_SUCCES',
          roleAuMoment: 'contribuable',
        }),
      );

      // Le JWT doit aussi être signé avec la valeur normalisée
      expect(jwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({ role: 'contribuable' }),
        expect.any(Object),
      );
    });

    it('laisse les rôles canoniques inchangés (admin, agent_otr, ...)', async () => {
      bcryptMock.compare.mockResolvedValue(true as never);
      (prisma.utilisateur.findUnique as jest.Mock).mockResolvedValue(
        mockUser({ role: 'admin' }),
      );
      (prisma.refreshToken.create as jest.Mock).mockResolvedValue({});
      (prisma.utilisateur.update as jest.Mock).mockResolvedValue({});

      const result = await service.login(
        { email: 'admin@gouv.tg', password: 'good' },
        '127.0.0.1',
        'jest',
      );
      const pair = result as { user: { role: string } };
      expect(pair.user.role).toBe('admin');
    });
  });

  describe('verifyMfa', () => {
    it('rejette si mfaToken invalide ou expiré', async () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('expired');
      });
      await expect(
        service.verifyMfa('bad-token', '123456', '127.0.0.1', 'jest'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('rejette si step != mfa_pending', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ sub: 'user-1', step: 'other' });
      await expect(
        service.verifyMfa('token', '123456', '127.0.0.1', 'jest'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('rejette si code TOTP invalide', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ sub: 'user-1', step: 'mfa_pending' });
      (prisma.utilisateur.findUniqueOrThrow as jest.Mock).mockResolvedValue(mockUser());
      (mfa.verifyTotp as jest.Mock).mockResolvedValue(false);
      await expect(
        service.verifyMfa('token', '000000', '127.0.0.1', 'jest'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('retourne token pair si TOTP valide', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ sub: 'user-1', step: 'mfa_pending' });
      (prisma.utilisateur.findUniqueOrThrow as jest.Mock).mockResolvedValue(mockUser());
      (mfa.verifyTotp as jest.Mock).mockResolvedValue(true);
      (prisma.refreshToken.create as jest.Mock).mockResolvedValue({});
      (prisma.utilisateur.update as jest.Mock).mockResolvedValue({});

      const result = await service.verifyMfa('token', '123456', '127.0.0.1', 'jest');
      const pair = result as { access_token: string };
      expect(pair.access_token).toBe('signed-jwt-token');
    });
  });

  describe('refreshToken', () => {
    it('rejette si token introuvable', async () => {
      (prisma.refreshToken.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(
        service.refreshToken('raw', '127.0.0.1', 'jest'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('rejette si token révoqué', async () => {
      (prisma.refreshToken.findUnique as jest.Mock).mockResolvedValue({
        id: 'rt-1',
        estRevoque: true,
        expiresAt: new Date(Date.now() + 86_400_000),
        utilisateurId: 'user-1',
      });
      await expect(
        service.refreshToken('raw', '127.0.0.1', 'jest'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('rejette si token expiré', async () => {
      (prisma.refreshToken.findUnique as jest.Mock).mockResolvedValue({
        id: 'rt-1',
        estRevoque: false,
        expiresAt: new Date(Date.now() - 1000),
        utilisateurId: 'user-1',
      });
      await expect(
        service.refreshToken('raw', '127.0.0.1', 'jest'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('révoque ancien token et émet nouveau pair', async () => {
      (prisma.refreshToken.findUnique as jest.Mock).mockResolvedValue({
        id: 'rt-1',
        estRevoque: false,
        expiresAt: new Date(Date.now() + 86_400_000),
        utilisateurId: 'user-1',
      });
      (prisma.refreshToken.update as jest.Mock).mockResolvedValue({});
      (prisma.utilisateur.findUniqueOrThrow as jest.Mock).mockResolvedValue(mockUser());
      (prisma.refreshToken.create as jest.Mock).mockResolvedValue({});
      (prisma.utilisateur.update as jest.Mock).mockResolvedValue({});

      const result = await service.refreshToken('raw', '127.0.0.1', 'jest');
      expect(prisma.refreshToken.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'rt-1' },
          data: { estRevoque: true },
        }),
      );
      const pair = result as { access_token: string };
      expect(pair.access_token).toBe('signed-jwt-token');
    });
  });

  describe('logout', () => {
    it('révoque le refresh token correspondant au hash', async () => {
      (prisma.refreshToken.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
      await service.logout('raw');
      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { estRevoque: true },
        }),
      );
    });
  });

  describe('setPin', () => {
    it('PIN initial sans current_pin : enregistre et journalise PIN_MODIFIE', async () => {
      (prisma.utilisateur.findUniqueOrThrow as jest.Mock).mockResolvedValue(
        mockUser({ pinHash: null }),
      );
      bcryptMock.hash.mockResolvedValue('new-hash' as never);
      (prisma.utilisateur.update as jest.Mock).mockResolvedValue({});

      await service.setPin('user-1', {
        pin: '1234',
        pin_confirm: '1234',
      });
      expect(prisma.utilisateur.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { pinHash: 'new-hash' } }),
      );
      expect(audit.createEntry).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'PIN_MODIFIE' }),
      );
    });

    it('rejette si pin != pin_confirm', async () => {
      (prisma.utilisateur.findUniqueOrThrow as jest.Mock).mockResolvedValue(
        mockUser({ pinHash: null }),
      );
      await expect(
        service.setPin('user-1', { pin: '1234', pin_confirm: '5678' }),
      ).rejects.toThrow(ConflictException);
    });

    it('rejette si current_pin incorrect (changement de PIN)', async () => {
      (prisma.utilisateur.findUniqueOrThrow as jest.Mock).mockResolvedValue(
        mockUser({ pinHash: 'existing-hash' }),
      );
      bcryptMock.compare.mockResolvedValue(false as never);
      await expect(
        service.setPin('user-1', {
          pin: '1234',
          pin_confirm: '1234',
          current_pin: 'wrong',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('verifyPin', () => {
    it('retourne false si aucun PIN défini', async () => {
      (prisma.utilisateur.findUniqueOrThrow as jest.Mock).mockResolvedValue({
        pinHash: null,
      });
      const result = await service.verifyPin('user-1', '1234');
      expect(result).toBe(false);
    });

    it('retourne true si PIN correct', async () => {
      (prisma.utilisateur.findUniqueOrThrow as jest.Mock).mockResolvedValue({
        pinHash: 'stored-hash',
      });
      bcryptMock.compare.mockResolvedValue(true as never);
      const result = await service.verifyPin('user-1', '1234');
      expect(result).toBe(true);
    });

    it('retourne false si PIN incorrect', async () => {
      (prisma.utilisateur.findUniqueOrThrow as jest.Mock).mockResolvedValue({
        pinHash: 'stored-hash',
      });
      bcryptMock.compare.mockResolvedValue(false as never);
      const result = await service.verifyPin('user-1', '9999');
      expect(result).toBe(false);
    });
  });
});
