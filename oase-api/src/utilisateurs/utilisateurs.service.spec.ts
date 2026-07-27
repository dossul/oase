import { Test, TestingModule } from '@nestjs/testing';
import { UtilisateursService } from './utilisateurs.service';
import { PrismaService } from '../prisma/prisma.service';
import { MfaService } from '../auth/mfa.service';
import { AuditService } from '../audit/audit.service';
import { Role } from '../common/enums/generated';
import { ConflictException } from '@nestjs/common';

const mockPrisma = {
  utilisateur: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
} as any;

const mockMfa = {
  generateSecret: jest.fn().mockReturnValue({ secret: 'MFASECRET', otpauthUrl: 'otpauth://test' }),
  encrypt: jest.fn().mockReturnValue('encrypted-secret'),
} as any;

const mockAudit = {
  createEntry: jest.fn(),
} as any;

describe('UtilisateursService', () => {
  let service: UtilisateursService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UtilisateursService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: MfaService, useValue: mockMfa },
        { provide: AuditService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get<UtilisateursService>(UtilisateursService);
    jest.clearAllMocks();
  });

  it('devrait creer un utilisateur', async () => {
    mockPrisma.utilisateur.findUnique.mockResolvedValue(null);
    mockPrisma.utilisateur.create.mockResolvedValue({
      id: 'u-1',
      email: 'test@oase.tg',
      nom: 'Test',
      prenom: 'User',
      role: Role.AGENT_CI,
      institutionId: 'i-1',
      statutCode: 'actif',
      mfaActive: true,
      institutions: { id: 'i-1', nom: 'OTR', code: 'OTR' },
    });

    const result = await service.creer('admin-1', {
      email: 'test@oase.tg',
      nom: 'Test',
      prenom: 'User',
      role: Role.AGENT_CI,
      institutionId: 'i-1',
    } as any);

    expect(result.email).toBe('test@oase.tg');
    expect(result.role).toBe(Role.AGENT_CI);
    expect(result.tempPassword).toBeDefined();
    expect(mockAudit.createEntry).toHaveBeenCalled();
  });

  it('devrait rejeter un email existant', async () => {
    mockPrisma.utilisateur.findUnique.mockResolvedValue({ id: 'u-1' });
    await expect(
      service.creer('admin-1', {
        email: 'test@oase.tg',
        nom: 'Test',
        prenom: 'User',
        role: Role.AGENT_CI,
        institutionId: 'i-1',
      } as any),
    ).rejects.toThrow(ConflictException);
  });

  it('devrait lister les utilisateurs avec pagination', async () => {
    mockPrisma.utilisateur.findMany.mockResolvedValue([]);
    mockPrisma.utilisateur.count.mockResolvedValue(0);

    const result = await service.lister({ page: 1, limit: 10 } as any);
    expect(result.meta.page).toBe(1);
    expect(result.meta.limit).toBe(10);
  });

  describe('garde-fou DERNIER_ADMIN', () => {
    const dernierAdmin = {
      id: 'u-admin',
      email: 'admin@oase.tg',
      role: 'admin_si',
      statutCode: 'actif',
      institutions: { id: 'i-1', nom: 'DSI', code: 'DSI' },
    };

    it('rejette la désactivation du dernier admin actif (409 DERNIER_ADMIN)', async () => {
      mockPrisma.utilisateur.findUnique.mockResolvedValue(dernierAdmin);
      mockPrisma.utilisateur.count.mockResolvedValue(0);

      await expect(
        service.modifier('admin-1', 'u-admin', { statutCode: 'inactif' } as any),
      ).rejects.toThrow(ConflictException);
      expect(mockPrisma.utilisateur.update).not.toHaveBeenCalled();
    });

    it('rejette la rétrogradation du dernier admin actif (409 DERNIER_ADMIN)', async () => {
      mockPrisma.utilisateur.findUnique.mockResolvedValue(dernierAdmin);
      mockPrisma.utilisateur.count.mockResolvedValue(0);

      await expect(
        service.modifier('admin-1', 'u-admin', { role: Role.AUDITEUR } as any),
      ).rejects.toThrow(ConflictException);
      expect(mockPrisma.utilisateur.update).not.toHaveBeenCalled();
    });

    it('autorise la désactivation si un autre admin actif existe', async () => {
      mockPrisma.utilisateur.findUnique.mockResolvedValue(dernierAdmin);
      mockPrisma.utilisateur.count.mockResolvedValue(1);
      mockPrisma.utilisateur.update.mockResolvedValue({
        ...dernierAdmin,
        statutCode: 'inactif',
      });

      const result = await service.modifier('admin-1', 'u-admin', { statutCode: 'inactif' } as any);
      expect(result.statutCode).toBe('inactif');
    });

    it('ne bloque pas la modification d\'un non-admin', async () => {
      mockPrisma.utilisateur.findUnique.mockResolvedValue({
        ...dernierAdmin,
        id: 'u-agent',
        role: 'agent_ci',
      });
      mockPrisma.utilisateur.update.mockResolvedValue({
        ...dernierAdmin,
        id: 'u-agent',
        role: 'agent_ci',
        statutCode: 'inactif',
      });

      await service.modifier('admin-1', 'u-agent', { statutCode: 'inactif' } as any);
      expect(mockPrisma.utilisateur.count).not.toHaveBeenCalled();
    });
  });
});
