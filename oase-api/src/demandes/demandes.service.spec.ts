import { Test, TestingModule } from '@nestjs/testing';
import { DemandesService } from './demandes.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ScopeService } from '../common/services/scope.service';
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
      ],
    }).compile();

    service = module.get<DemandesService>(DemandesService);
    jest.clearAllMocks();
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
});
