import { Test, TestingModule } from '@nestjs/testing';
import { DemandesService } from './demandes.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ScopeService } from '../common/services/scope.service';
import { AuthService } from '../auth/auth.service';
import { StateMachineService } from './state-machine.service';
import { Role } from '../common/enums/generated';

const mockPrisma = {
  demande: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    groupBy: jest.fn(),
  },
  contribuable: {
    findFirst: jest.fn(),
  },
} as any;

const mockAudit = { createEntry: jest.fn() } as any;
const mockScope = {
  buildWhereClause: jest.fn().mockResolvedValue({}),
  isAllowed: jest.fn().mockResolvedValue(true),
} as any;
const mockAuth = { verifyPin: jest.fn() } as any;

describe('DemandesService', () => {
  let service: DemandesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DemandesService,
        StateMachineService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditService, useValue: mockAudit },
        { provide: ScopeService, useValue: mockScope },
        { provide: AuthService, useValue: mockAuth },
      ],
    }).compile();

    service = module.get<DemandesService>(DemandesService);
    jest.clearAllMocks();
    mockScope.isAllowed.mockResolvedValue(true);
    mockAuth.verifyPin.mockResolvedValue(true);
  });

  const user = (role: Role) =>
    ({
      id: 'u-1',
      email: 'test@oase.tg',
      nom: 'T',
      prenom: 'U',
      role,
      institutionId: 'i-1',
      institution: 'OTR',
      mfaActive: true,
    }) as any;

  it('devrait creer une demande en brouillon', async () => {
    mockPrisma.contribuable.findFirst.mockResolvedValue({ id: 'b-1', userId: 'u-1' });
    mockPrisma.demande.count.mockResolvedValue(0);
    mockPrisma.demande.create.mockResolvedValue({
      id: 'd-1',
      reference: 'DEM-2026-00001',
      statutCode: 'brouillon',
      baseJuridiqueVersionId: 'bjv-1',
      contribuableId: 'b-1',
      montantFcfa: BigInt(1000000),
      contribuables: null,
      baseJuridiqueVersions: null,
      utilisateurs: null,
    });

    const result = await service.creer(user(Role.CONTRIBUABLE), {
      baseJuridiqueVersionId: 'bjv-1',
      contribuableId: 'b-1',
      montantFcfa: 1000000,
    } as any);

    expect(result.statutCode).toBe('brouillon');
    expect(mockAudit.createEntry).toHaveBeenCalled();
  });

  it('devrait soumettre une demande brouillon', async () => {
    mockPrisma.demande.findUnique.mockResolvedValue({
      id: 'd-1',
      statutCode: 'brouillon',
      montantFcfa: BigInt(1000000),
      contribuables: null,
      baseJuridiqueVersions: null,
      utilisateurs: null,
    });
    mockPrisma.demande.update.mockResolvedValue({
      id: 'd-1',
      statutCode: 'soumis',
      dateDepot: new Date(),
      montantFcfa: BigInt(1000000),
      contribuables: null,
      baseJuridiqueVersions: null,
      utilisateurs: null,
    });

    const result = await service.transition(user(Role.CONTRIBUABLE), 'd-1', 'soumettre');
    expect(result.statutCode).toBe('soumis');
  });

  it('devrait interdire une transition invalide', async () => {
    await expect(service.transition(user(Role.CONTRIBUABLE), 'd-1', 'approuver' as any)).rejects.toThrow();
  });

  it('SÉCURITÉ : la transition directe approuver est bloquée (PIN + contrôles requis via decisions)', async () => {
    await expect(service.transition(user(Role.DECIDEUR), 'd-1', 'approuver' as any)).rejects.toMatchObject({
      response: { code: 'APPROBATION_VIA_DECISIONS' },
    });
    // Aucune écriture en base ne doit avoir lieu.
    expect(mockPrisma.demande.update).not.toHaveBeenCalled();
  });

  describe('rejeter — vérification PIN côté serveur', () => {
    const demandeEnInstruction = {
      id: 'd-1',
      statutCode: 'en_instruction',
      montantFcfa: BigInt(1000000),
      contribuables: null,
      baseJuridiqueVersions: null,
      utilisateurs: null,
    };
    const agent = () => user(Role.AGENT_CI);

    beforeEach(() => {
      mockPrisma.demande.findUnique.mockResolvedValue(demandeEnInstruction);
      mockPrisma.demande.update.mockResolvedValue({ ...demandeEnInstruction, statutCode: 'rejete' });
    });

    it('PIN absent → 400 PIN_REQUIS (pas de rejet)', async () => {
      await expect(
        service.transition(agent(), 'd-1', 'rejeter', { motifRejet: 'Motif de rejet suffisamment long' } as any),
      ).rejects.toMatchObject({ response: { code: 'PIN_REQUIS' } });
      expect(mockAuth.verifyPin).not.toHaveBeenCalled();
      expect(mockPrisma.demande.update).not.toHaveBeenCalled();
    });

    it('PIN incorrect → 401 PIN_INVALIDE (pas de rejet)', async () => {
      mockAuth.verifyPin.mockResolvedValue(false);
      await expect(
        service.transition(agent(), 'd-1', 'rejeter', { pin: '000000', motifRejet: 'Motif de rejet suffisamment long' } as any),
      ).rejects.toMatchObject({ response: { code: 'PIN_INVALIDE' } });
      expect(mockPrisma.demande.update).not.toHaveBeenCalled();
    });

    it('PIN valide → rejet effectué', async () => {
      const result = await service.transition(agent(), 'd-1', 'rejeter', {
        pin: '123456',
        motifRejet: 'Motif de rejet suffisamment long',
      } as any);
      expect(mockAuth.verifyPin).toHaveBeenCalledWith('u-1', '123456');
      expect(result.statutCode).toBe('rejete');
    });
  });
});
