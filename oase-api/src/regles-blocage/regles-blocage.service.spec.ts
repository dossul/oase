import { Test, TestingModule } from '@nestjs/testing';
import { ReglesBlocageService } from './regles-blocage.service';
import { PrismaService } from '../prisma/prisma.service';
import { EtaxAdapter } from '../connecteurs/adapters/etax.adapter';

const mockPrisma = {
  demande: {
    findUnique: jest.fn(),
  },
  anomalie: {
    count: jest.fn(),
  },
} as any;

const mockEtax = { getStatutFiscal: jest.fn() } as any;

describe('ReglesBlocageService', () => {
  let service: ReglesBlocageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReglesBlocageService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EtaxAdapter, useValue: mockEtax },
      ],
    }).compile();

    service = module.get<ReglesBlocageService>(ReglesBlocageService);
    jest.clearAllMocks();
  });

  it('devrait detecter une dette fiscale active', async () => {
    mockPrisma.demande.findUnique.mockResolvedValue({
      id: 'd-1',
      beneficiaires: { nif: 'NIF001' },
      piecesJointes: [
        { rangCode: 'premier', estValide: true },
        { rangCode: 'second', estValide: true },
      ],
      anomalies: [],
      quotaConsomme: BigInt(0),
      quotaTotal: BigInt(1000000),
      dateEcheance: new Date('2030-01-01'),
    });
    mockEtax.getStatutFiscal.mockResolvedValue({ nif: 'NIF001', statut: 'dette_active', solde_dette_fcfa: 1_250_000 });
    mockPrisma.anomalie.count.mockResolvedValue(0);

    const result = await service.evaluer('d-1');
    const bloc01 = result.find((b) => b.code === 'bloc-01');
    expect(bloc01?.bloque).toBe(true);
    expect(bloc01?.gravite).toBe('critique');
  });

  it('devrait detecter des pieces manquantes', async () => {
    mockPrisma.demande.findUnique.mockResolvedValue({
      id: 'd-1',
      beneficiaires: { nif: 'NIF001' },
      piecesJointes: [],
      anomalies: [],
      quotaConsomme: BigInt(0),
      quotaTotal: BigInt(1000000),
      dateEcheance: new Date('2030-01-01'),
    });
    mockEtax.getStatutFiscal.mockResolvedValue({ nif: 'NIF001', statut: 'conforme' });
    mockPrisma.anomalie.count.mockResolvedValue(0);

    const result = await service.evaluer('d-1');
    const bloc05 = result.find((b) => b.code === 'bloc-05');
    expect(bloc05?.bloque).toBe(true);
  });
});
