import { Test, TestingModule } from '@nestjs/testing';
import { BeneficiairesService } from './beneficiaires.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { EtaxAdapter } from '../connecteurs/adapters/etax.adapter';
import { Role } from '../common/enums/generated';
import { ConflictException } from '@nestjs/common';

const mockPrisma = {
  beneficiaire: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
} as any;

const mockAudit = { createEntry: jest.fn() } as any;
const mockEtax = { getStatutFiscal: jest.fn() } as any;

describe('BeneficiairesService', () => {
  let service: BeneficiairesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BeneficiairesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditService, useValue: mockAudit },
        { provide: EtaxAdapter, useValue: mockEtax },
      ],
    }).compile();

    service = module.get<BeneficiairesService>(BeneficiairesService);
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

  it('devrait creer un beneficiaire', async () => {
    mockPrisma.beneficiaire.findUnique.mockResolvedValue(null);
    mockPrisma.beneficiaire.create.mockResolvedValue({
      id: 'b-1',
      raisonSociale: 'SARL Test',
      nif: 'NIF001',
      typeBeneficiaireCode: 'entreprise_privee',
      userId: 'u-1',
    });

    const result = await service.creer(user(Role.BENEFICIAIRE), {
      raisonSociale: 'SARL Test',
      nif: 'NIF001',
      typeBeneficiaireCode: 'entreprise_privee' as any,
    } as any);

    expect(result.nif).toBe('NIF001');
    expect(mockAudit.createEntry).toHaveBeenCalled();
  });

  it('devrait rejeter un NIF existant', async () => {
    mockPrisma.beneficiaire.findUnique.mockResolvedValue({ id: 'b-1' });
    await expect(
      service.creer(user(Role.BENEFICIAIRE), {
        raisonSociale: 'SARL Test',
        nif: 'NIF001',
        typeBeneficiaireCode: 'entreprise_privee' as any,
      } as any),
    ).rejects.toThrow(ConflictException);
  });

  it('devrait recuperer le statut fiscal mock', async () => {
    mockPrisma.beneficiaire.findFirst.mockResolvedValue({ id: 'b-1', nif: 'NIF001', userId: 'u-1' });
    mockEtax.getStatutFiscal.mockResolvedValue({ nif: 'NIF001', statut: 'conforme', source: 'mock' });

    const result = await service.statutFiscal(user(Role.BENEFICIAIRE), 'b-1');
    expect(result.statutFiscal.statut).toBe('conforme');
  });
});
