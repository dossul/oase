import { Test, TestingModule } from '@nestjs/testing';
import { ScopeService } from './scope.service';
import { PrismaService } from '../../prisma/prisma.service';
import { Role } from '../enums/generated';

const mockPrisma = {
  demande: { findUnique: jest.fn() },
  contribuable: { findUnique: jest.fn() },
} as any;

describe('ScopeService', () => {
  let service: ScopeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ScopeService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<ScopeService>(ScopeService);
    jest.clearAllMocks();
  });

  const user = (role: Role, overrides: any = {}) => ({
    id: 'user-1',
    email: 'test@oase.tg',
    nom: 'Test',
    prenom: 'User',
    role,
    institutionId: 'inst-1',
    institution: 'OTR',
    mfaActive: true,
    secteurAffecte: 'agriculture',
    ...overrides,
  });

  describe('buildWhereClause', () => {
    it('contribuable ne voit que ses propres demandes', async () => {
      const where = await service.buildWhereClause(user(Role.CONTRIBUABLE), 'demande');
      expect(where).toEqual({ contribuables: { userId: 'user-1' } });
    });

    it('admin_si a acces a toutes les demandes', async () => {
      const where = await service.buildWhereClause(user(Role.ADMIN_SI), 'demande');
      expect(where).toEqual({});
    });

    it('agent_ci filtre par organe CI et exclut les brouillons', async () => {
      const where = await service.buildWhereClause(user(Role.AGENT_CI), 'demande');
      expect(where).toEqual({
        baseJuridiqueVersion: { baseJuridique: { organeGestionCode: 'CI' } },
        statutCode: { not: 'brouillon' },
      });
    });

    it('agent_cddi filtre par organe CDDI ou CDDI_CI', async () => {
      const where = await service.buildWhereClause(user(Role.AGENT_CDDI), 'demande');
      expect(where.baseJuridiqueVersion.baseJuridique.organeGestionCode).toEqual({ in: ['CDDI', 'CDDI_CI'] });
      expect(where.statutCode).toEqual({ not: 'brouillon' });
    });

    it('contribuable ne voit que son propre profil', async () => {
      const where = await service.buildWhereClause(user(Role.CONTRIBUABLE), 'contribuable');
      expect(where).toEqual({ userId: 'user-1' });
    });
  });

  describe('isAllowed', () => {
    it('autorise un contribuable a voir sa propre demande', async () => {
      mockPrisma.demande.findUnique.mockResolvedValue({
        id: 'dem-1',
        contribuables: { userId: 'user-1' },
        statutCode: 'soumis',
      });
      const allowed = await service.isAllowed(user(Role.CONTRIBUABLE), 'demande', 'dem-1');
      expect(allowed).toBe(true);
    });

    it('interdit un contribuable de voir une demande tierce', async () => {
      mockPrisma.demande.findUnique.mockResolvedValue({
        id: 'dem-2',
        contribuables: { userId: 'user-2' },
        statutCode: 'soumis',
      });
      const allowed = await service.isAllowed(user(Role.CONTRIBUABLE), 'demande', 'dem-2');
      expect(allowed).toBe(false);
    });
  });
});
