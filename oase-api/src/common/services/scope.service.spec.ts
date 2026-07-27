import { Test, TestingModule } from '@nestjs/testing';
import { ScopeService } from './scope.service';
import { PrismaService } from '../../prisma/prisma.service';
import { Role } from '../enums/generated';

const mockPrisma = {
  demande: { findUnique: jest.fn() },
  contribuable: { findUnique: jest.fn() },
  demandeWorkflowEtape: { findFirst: jest.fn() },
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
        baseJuridiqueVersions: { organeGestionCode: 'CI' },
        statutCode: { not: 'brouillon' },
      });
    });

    it('agent_cddi filtre par organe CDDI ou CDDI_CI', async () => {
      const where = await service.buildWhereClause(user(Role.AGENT_CDDI), 'demande');
      expect(where.baseJuridiqueVersions.organeGestionCode).toEqual({ in: ['CDDI', 'CDDI_CI'] });
      expect(where.statutCode).toEqual({ not: 'brouillon' });
    });

    it('agent_dgbf filtre par etapes de workflow actives pour son role', async () => {
      const where = await service.buildWhereClause(user(Role.AGENT_DGBF), 'demande');
      expect(where).toEqual({
        demandeWorkflowInstances: {
          demandeWorkflowEtapes: {
            some: { acteurRole: 'agent_dgbf', statutCode: { in: ['en_attente', 'en_cours'] } },
          },
        },
      });
    });

    it('agent_agence filtre par type de texte zone franche / code des investissements', async () => {
      const where = await service.buildWhereClause(user(Role.AGENT_AGENCE), 'demande');
      expect(where.baseJuridiqueVersions.typeTexte1.in).toContain('Code des Investissements');
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

    it('autorise un agent_ci sur une demande de son organe (hors brouillon)', async () => {
      mockPrisma.demande.findUnique.mockResolvedValue({
        id: 'dem-3',
        contribuables: { userId: 'user-9' },
        statutCode: 'en_instruction',
        baseJuridiqueVersions: { organeGestionCode: 'CI', typeTexte1: 'CGI' },
      });
      const allowed = await service.isAllowed(user(Role.AGENT_CI), 'demande', 'dem-3');
      expect(allowed).toBe(true);
    });

    it('interdit un agent_dgbf de lire une demande de l\'organe CI (fuite RLS)', async () => {
      mockPrisma.demande.findUnique.mockResolvedValue({
        id: 'dem-4',
        contribuables: { userId: 'user-9' },
        statutCode: 'en_instruction',
        baseJuridiqueVersions: { organeGestionCode: 'CI', typeTexte1: 'CGI' },
      });
      mockPrisma.demandeWorkflowEtape.findFirst.mockResolvedValue(null);
      const allowed = await service.isAllowed(user(Role.AGENT_DGBF), 'demande', 'dem-4');
      expect(allowed).toBe(false);
    });

    it('autorise un agent_dgbf si une etape DGBF est en attente/en cours', async () => {
      mockPrisma.demande.findUnique.mockResolvedValue({
        id: 'dem-5',
        contribuables: { userId: 'user-9' },
        statutCode: 'en_instruction',
        baseJuridiqueVersions: { organeGestionCode: 'CI', typeTexte1: 'CGI' },
      });
      mockPrisma.demandeWorkflowEtape.findFirst.mockResolvedValue({ id: 'dwe-1' });
      const allowed = await service.isAllowed(user(Role.AGENT_DGBF), 'demande', 'dem-5');
      expect(allowed).toBe(true);
    });

    it('interdit un agent_agence de prendre en charge une demande hors perimetre', async () => {
      mockPrisma.demande.findUnique.mockResolvedValue({
        id: 'dem-6',
        contribuables: { userId: 'user-9' },
        statutCode: 'soumis',
        baseJuridiqueVersions: { organeGestionCode: 'CI', typeTexte1: 'CGI' },
      });
      const allowed = await service.isAllowed(user(Role.AGENT_AGENCE), 'demande', 'dem-6');
      expect(allowed).toBe(false);
    });

    it('autorise un agent_agence sur une demande Code des Investissements', async () => {
      mockPrisma.demande.findUnique.mockResolvedValue({
        id: 'dem-7',
        contribuables: { userId: 'user-9' },
        statutCode: 'en_instruction',
        baseJuridiqueVersions: { organeGestionCode: 'CI', typeTexte1: 'Code Investissements' },
      });
      const allowed = await service.isAllowed(user(Role.AGENT_AGENCE), 'demande', 'dem-7');
      expect(allowed).toBe(true);
    });
  });
});
