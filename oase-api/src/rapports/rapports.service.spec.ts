import { Test, TestingModule } from '@nestjs/testing';
import { RapportsService } from './rapports.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

describe('RapportsService', () => {
  let service: RapportsService;

  const reportingExecution = {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };
  const demande = {
    findMany: jest.fn(),
  };
  const baseJuridique = {
    findMany: jest.fn(),
  };
  const baseJuridiqueVersion = {
    findMany: jest.fn(),
  };

  const prisma: Record<string, unknown> = {
    reportingExecution,
    demande,
    baseJuridique,
    baseJuridiqueVersion,
  };
  const audit = { createEntry: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RapportsService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: audit },
      ],
    }).compile();

    service = module.get<RapportsService>(RapportsService);
    jest.clearAllMocks();
  });

  it('devrait générer un rapport CSV', async () => {
    reportingExecution.create.mockResolvedValue({ id: 'r-1', statutCode: 'en_cours' });
    demande.findMany.mockResolvedValue([
      { id: 'd-1', reference: 'REF-1', statutCode: 'accordee', montantFcfa: 1000n, dateDepot: new Date() },
    ]);
    reportingExecution.update.mockResolvedValue({ id: 'r-1', statutCode: 'termine' });

    const result = await service.generer({ typeRapportCode: 'executif', periodeAnnee: 2024, format: 'csv' }, 'u-1');

    expect(result.statutCode).toBe('termine');
    expect(audit.createEntry).toHaveBeenCalled();
  });

  it('devrait retourner les données open data', async () => {
    baseJuridique.findMany.mockResolvedValue([{ id: 'bj-1', codeMesure: 'MRD-001' }]);
    baseJuridiqueVersion.findMany.mockResolvedValue([
      { baseJuridiqueId: 'bj-1', libelle: 'Test', impotConcerne: 'DD' },
    ]);

    const result = await service.openData();

    expect(result).toHaveLength(1);
    expect(result[0].codeMesure).toBe('MRD-001');
  });
});
