import { Test, TestingModule } from '@nestjs/testing';
import { BasesJuridiquesService } from './bases-juridiques.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ConflictException } from '@nestjs/common';

describe('BasesJuridiquesService', () => {
  let service: BasesJuridiquesService;

  const baseJuridique = {
    findUnique: jest.fn(),
    create: jest.fn(),
    upsert: jest.fn(),
  };
  const baseJuridiqueVersion = {
    findMany: jest.fn(),
    count: jest.fn(),
    findUnique: jest.fn(),
    updateMany: jest.fn(),
    create: jest.fn(),
  };

  const prisma: Record<string, unknown> = {
    baseJuridique,
    baseJuridiqueVersion,
    $transaction: jest.fn((fn: (tx: Record<string, unknown>) => Promise<unknown>) => fn(prisma)),
  };

  const audit = { createEntry: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BasesJuridiquesService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: audit },
      ],
    }).compile();

    service = module.get<BasesJuridiquesService>(BasesJuridiquesService);
    jest.clearAllMocks();
  });

  it('devrait créer une base juridique', async () => {
    baseJuridique.findUnique.mockResolvedValue(null);
    baseJuridique.create.mockResolvedValue({
      id: 'b-1',
      codeMesure: 'MRD-2024-0042',
    });

    const result = await service.creer({ codeMesure: 'MRD-2024-0042' }, 'u-1');

    expect(result.codeMesure).toBe('MRD-2024-0042');
    expect(audit.createEntry).toHaveBeenCalled();
  });

  it('devrait rejeter un code mesure dupliqué', async () => {
    baseJuridique.findUnique.mockResolvedValue({ id: 'b-1' });

    await expect(service.creer({ codeMesure: 'MRD-2024-0042' }, 'u-1')).rejects.toThrow(ConflictException);
  });

  it('devrait importer depuis JSON', async () => {
    baseJuridique.upsert.mockResolvedValue({ id: 'b-1' });
    baseJuridique.findUnique.mockResolvedValue({
      id: 'b-1',
      baseJuridiqueVersions: [],
    });
    baseJuridiqueVersion.updateMany.mockResolvedValue({ count: 0 });
    baseJuridiqueVersion.create.mockResolvedValue({ id: 'v-1' });

    const result = await service.importer(
      {
        format: 'json',
        contenu: JSON.stringify([
          {
            codeMesure: 'MRD-2024-0042',
            libelle: 'Exonération équipements',
            impotConcerne: 'DD',
            natureMesureCode: 'Exoneration',
          },
        ]),
      },
      'u-1',
    );

    expect(result.creees).toBe(1);
    expect(result.erreurs).toBe(0);
  });
});
