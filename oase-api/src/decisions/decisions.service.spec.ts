import { Test, TestingModule } from '@nestjs/testing';
import { DecisionsService } from './decisions.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuthService } from '../auth/auth.service';
import { ReglesBlocageService } from '../regles-blocage/regles-blocage.service';
import { Role } from '../common/enums/generated';

const mockPrisma = {
  demande: { findUnique: jest.fn(), update: jest.fn() },
  decision: { create: jest.fn() },
  acte: { create: jest.fn() },
} as any;

const mockAudit = { createEntry: jest.fn() } as any;
const mockAuth = { verifyPin: jest.fn() } as any;
const mockRegles = { estBloque: jest.fn() } as any;

describe('DecisionsService', () => {
  let service: DecisionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DecisionsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditService, useValue: mockAudit },
        { provide: AuthService, useValue: mockAuth },
        { provide: ReglesBlocageService, useValue: mockRegles },
      ],
    }).compile();

    service = module.get<DecisionsService>(DecisionsService);
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

  it('devrait approuver une demande avec PIN', async () => {
    mockPrisma.demande.findUnique.mockResolvedValue({
      id: 'd-1',
      statutCode: 'en_instruction',
      reference: 'D-1',
      contribuableId: 'b-1',
      contribuables: { id: 'b-1' },
      montantFcfa: BigInt(1000),
    });
    mockRegles.estBloque.mockResolvedValue({ bloque: false, blocages: [] });
    mockAuth.verifyPin.mockResolvedValue(true);
    mockPrisma.decision.create.mockResolvedValue({ id: 'dec-1', demandeId: 'd-1', typeCode: 'approbation' });
    mockPrisma.acte.create.mockResolvedValue({ id: 'a-1', reference: 'ACTE-1' });

    const result = await service.approuver(user(Role.DECIDEUR), 'd-1', '1234');
    expect(result.decision.typeCode).toBe('approbation');
    expect(mockAudit.createEntry).toHaveBeenCalled();
  });

  it('devrait rejeter une demande avec PIN', async () => {
    mockPrisma.demande.findUnique.mockResolvedValue({
      id: 'd-1',
      statutCode: 'en_instruction',
      reference: 'D-1',
      contribuableId: 'b-1',
      contribuables: { id: 'b-1' },
      montantFcfa: BigInt(1000),
    });
    mockAuth.verifyPin.mockResolvedValue(true);
    mockPrisma.decision.create.mockResolvedValue({ id: 'dec-1', demandeId: 'd-1', typeCode: 'rejet' });
    mockPrisma.acte.create.mockResolvedValue({ id: 'a-1', reference: 'ACTE-1' });

    const result = await service.rejeter(user(Role.DECIDEUR), 'd-1', '1234', 'Motif de rejet');
    expect(result.decision.typeCode).toBe('rejet');
  });
});
