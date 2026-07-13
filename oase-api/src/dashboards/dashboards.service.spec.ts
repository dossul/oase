import { Test, TestingModule } from '@nestjs/testing';
import { DashboardsService } from './dashboards.service';
import { PrismaService } from '../prisma/prisma.service';

describe('DashboardsService', () => {
  let service: DashboardsService;

  const demande = {
    count: jest.fn(),
    groupBy: jest.fn(),
    findMany: jest.fn(),
  };
  const contribuable = {
    count: jest.fn(),
  };

  const prisma: Record<string, unknown> = { demande, contribuable };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DashboardsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<DashboardsService>(DashboardsService);
    jest.clearAllMocks();
  });

  it('devrait retourner les KPIs P4', async () => {
    demande.count.mockResolvedValue(10);
    demande.groupBy.mockResolvedValue([]);

    const result = await service.kpisP4();

    expect(result.totalDemandes).toBe(10);
  });

  it('devrait retourner les KPIs P5', async () => {
    demande.findMany.mockResolvedValue([
      {
        montantFcfa: 500000n,
        baseJuridiqueVersions: { impotConcerne: 'DD' },
        decisions: [{ typeCode: 'accord' }],
      },
      {
        montantFcfa: 300000n,
        baseJuridiqueVersions: { impotConcerne: 'DD' },
        decisions: [{ typeCode: 'accord' }],
      },
    ]);
    contribuable.count.mockResolvedValue(5);

    const result = await service.kpisP5();

    expect(result.montantTotalAccorde).toBe('800000');
    expect(result.montantParImpot).toHaveLength(1);
    expect(result.nombreContribuables).toBe(5);
  });
});
