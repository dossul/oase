import { Test, TestingModule } from '@nestjs/testing';
import { ConnecteursService } from './connecteurs.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  connecteur: { findMany: jest.fn() },
  connecteurLog: { findMany: jest.fn(), groupBy: jest.fn() },
  jobQueue: { count: jest.fn() },
} as any;

describe('ConnecteursService', () => {
  let service: ConnecteursService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConnecteursService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<ConnecteursService>(ConnecteursService);
    jest.clearAllMocks();
  });

  it('status() agrège heartbeat et erreurs 24h par connecteur', async () => {
    mockPrisma.connecteur.findMany.mockResolvedValue([
      {
        id: 'c-1', nom: 'E-TAX', codeSysteme: 'etax', statutCode: 'actif',
        dernierSync: new Date('2026-07-27T01:00:00Z'), latenceMs: 120, tauxErreur: 0,
        fallbackManuel: false, institutions: { id: 'i-1', nom: 'OTR', code: 'OTR' },
      },
      {
        id: 'c-2', nom: 'SYDONIA', codeSysteme: 'sydonia', statutCode: 'erreur',
        dernierSync: null, latenceMs: 0, tauxErreur: 12.5,
        fallbackManuel: true, institutions: null,
      },
    ]);
    mockPrisma.connecteurLog.groupBy.mockResolvedValue([{ connecteurId: 'c-2', _count: { id: 7 } }]);
    mockPrisma.jobQueue.count.mockResolvedValue(3);

    const result = await service.status();

    expect(result.jobsActifs).toBe(3);
    expect(result.connecteurs).toHaveLength(2);
    const etax = result.connecteurs.find((c) => c.id === 'c-1')!;
    expect(etax.erreurs24h).toBe(0);
    expect(etax.dernierHeartbeat).toEqual(new Date('2026-07-27T01:00:00Z'));
    const sydonia = result.connecteurs.find((c) => c.id === 'c-2')!;
    expect(sydonia.erreurs24h).toBe(7);
    expect(sydonia.fallbackManuel).toBe(true);
  });

  it('logs() retourne les journaux les plus récents', async () => {
    mockPrisma.connecteurLog.findMany.mockResolvedValue([{ id: 'l-1' }]);
    const result = await service.logs('c-1', 10);
    expect(mockPrisma.connecteurLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { connecteurId: 'c-1' }, take: 10 }),
    );
    expect(result).toHaveLength(1);
  });
});
