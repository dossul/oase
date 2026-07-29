import { Test, TestingModule } from '@nestjs/testing';
import { FluxExtractifsService } from './flux-extractifs.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ConflictException } from '@nestjs/common';

describe('FluxExtractifsService', () => {
  let service: FluxExtractifsService;

  const productionExtractive = { findUnique: jest.fn(), findMany: jest.fn(), create: jest.fn() };
  const exportationExtractive = { findUnique: jest.fn(), findMany: jest.fn(), create: jest.fn() };
  const redevanceMiniere = { findUnique: jest.fn(), findMany: jest.fn(), create: jest.fn() };
  const transfertCommuneCfldr = { findUnique: jest.fn(), findMany: jest.fn(), create: jest.fn() };

  const prisma: Record<string, unknown> = {
    productionExtractive,
    exportationExtractive,
    redevanceMiniere,
    transfertCommuneCfldr,
  };
  const audit = { createEntry: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FluxExtractifsService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: audit },
      ],
    }).compile();

    service = module.get<FluxExtractifsService>(FluxExtractifsService);
    jest.clearAllMocks();
  });

  it('devrait créer une production et auditer', async () => {
    productionExtractive.findUnique.mockResolvedValue(null);
    productionExtractive.create.mockResolvedValue({ id: 'p-1' });

    const result = await service.creerProduction(
      {
        contribuableId: 'c-1',
        annee: 2024,
        mois: 6,
        substance: 'Phosphates',
        volumeProduitT: 95000,
        valeurMarchandeFcfa: 1250000000,
      },
      'u-1',
    );

    expect(result.id).toBe('p-1');
    expect(productionExtractive.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ valeurMarchandeFcfa: 1250000000n }),
      }),
    );
    expect(audit.createEntry).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'FLUX_PRODUCTION_CREER' }),
    );
  });

  it('devrait rejeter une production dupliquée sur la même période', async () => {
    productionExtractive.findUnique.mockResolvedValue({ id: 'p-1' });

    await expect(
      service.creerProduction({ contribuableId: 'c-1', annee: 2024, mois: 6, substance: 'Phosphates' }, 'u-1'),
    ).rejects.toThrow(ConflictException);
  });

  it('devrait créer une exportation avec destination', async () => {
    exportationExtractive.findUnique.mockResolvedValue(null);
    exportationExtractive.create.mockResolvedValue({ id: 'e-1', destination: 'Inde' });

    const result = await service.creerExportation(
      { contribuableId: 'c-1', annee: 2024, mois: 3, substance: 'Phosphates', volumeT: 80000, valeurUsd: 1900000, destination: 'Inde' },
      'u-1',
    );

    expect(result.destination).toBe('Inde');
    expect(audit.createEntry).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'FLUX_EXPORTATION_CREER' }),
    );
  });

  it('devrait rejeter une redevance dupliquée sur le même trimestre', async () => {
    redevanceMiniere.findUnique.mockResolvedValue({ id: 'r-1' });

    await expect(
      service.creerRedevance({ contribuableId: 'c-1', annee: 2024, trimestre: 2, substance: 'Phosphates' }, 'u-1'),
    ).rejects.toThrow(ConflictException);
  });

  it('devrait créer un transfert commune CFLDR et auditer', async () => {
    transfertCommuneCfldr.findUnique.mockResolvedValue(null);
    transfertCommuneCfldr.create.mockResolvedValue({ id: 't-1', montantDuFcfa: 93750000n });

    const result = await service.creerTransfert(
      {
        contribuableId: 'c-1',
        annee: 2024,
        commune: 'Lacs 1',
        chiffreAffairesAnnuelFcfa: 12500000000,
        montantDuFcfa: 93750000,
        montantEncaisseFcfa: 93750000,
        dateEncaissement: '2025-03-31',
      },
      'u-1',
    );

    expect(result.montantDuFcfa).toBe(93750000n);
    expect(audit.createEntry).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'FLUX_TRANSFERT_COMMUNE_CREER' }),
    );
  });

  it('devrait filtrer les listes par contribuable et année', async () => {
    redevanceMiniere.findMany.mockResolvedValue([{ id: 'r-1' }]);

    const result = await service.listerRedevances({ contribuableId: 'c-1', annee: 2024 });

    expect(result).toHaveLength(1);
    expect(redevanceMiniere.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { contribuableId: 'c-1', annee: 2024 } }),
    );
  });
});
