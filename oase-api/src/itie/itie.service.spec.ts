import { Test, TestingModule } from '@nestjs/testing';
import { ItieService } from './itie.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ItieService', () => {
  let service: ItieService;

  const convention = { findMany: jest.fn() };
  const permisMinier = { findMany: jest.fn() };
  const productionExtractive = { findMany: jest.fn() };
  const exportationExtractive = { findMany: jest.fn() };
  const redevanceMiniere = { findMany: jest.fn() };
  const transfertCommuneCfldr = { findMany: jest.fn() };

  const prisma: Record<string, unknown> = {
    convention,
    permisMinier,
    productionExtractive,
    exportationExtractive,
    redevanceMiniere,
    transfertCommuneCfldr,
  };

  const snpt = { id: 'c-1', nif: '1000160416', raisonSociale: 'SNPT' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ItieService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<ItieService>(ItieService);
    jest.clearAllMocks();

    convention.findMany.mockResolvedValue([{ contribuableId: 'c-1', contribuables: snpt }]);
    permisMinier.findMany.mockResolvedValue([{ id: 'p-1' }]);
    productionExtractive.findMany.mockResolvedValue([
      { contribuableId: 'c-1', substance: 'Phosphates', volumeProduitT: 95000, valeurMarchandeFcfa: 1250000000n, contribuables: snpt },
    ]);
    exportationExtractive.findMany.mockResolvedValue([
      { contribuableId: 'c-1', substance: 'Phosphates', volumeT: 85000, valeurFcfa: 1150000000n, contribuables: snpt },
    ]);
    redevanceMiniere.findMany.mockResolvedValue([
      {
        contribuableId: 'c-1',
        trimestre: 1,
        substance: 'Phosphates',
        taux: 3.5,
        montantDuFcfa: 122500000n,
        montantPayeFcfa: 122500000n,
        referencePaiement: 'QTR-2024-T1-SNPT',
        contribuables: snpt,
      },
    ]);
    transfertCommuneCfldr.findMany.mockResolvedValue([
      {
        contribuableId: 'c-1',
        commune: 'Lacs 1',
        montantDuFcfa: 93750000n,
        montantEncaisseFcfa: 93750000n,
        contribuables: snpt,
      },
    ]);
  });

  it('devrait calculer les statistiques depuis les données réelles', async () => {
    const stats = await service.statistiques(2024);

    expect(stats.annee).toBe(2024);
    expect(stats.calculees.societesPerimetre).toBe(1);
    expect(stats.calculees.conventionsActives).toBe(1);
    expect(stats.calculees.permisActifs).toBe(1);
    expect(stats.calculees.productionParSubstance).toEqual([
      { substance: 'Phosphates', volumeT: 95000, valeurFcfa: 1250000000 },
    ]);
    expect(stats.calculees.redevances).toEqual({
      montantDuFcfa: 122500000,
      montantPayeFcfa: 122500000,
      tauxRecouvrement: 100,
    });
    expect(stats.calculees.transfertsCfldr.tauxVersement).toBe(100);

    const snptLigne = stats.calculees.repartitionParEntite[0];
    expect(snptLigne.nif).toBe('1000160416');
    expect(snptLigne.ecartRedevanceFcfa).toBe(0);
  });

  it('devrait déclarer honnêtement les indicateurs non calculables', async () => {
    const stats = await service.statistiques(2024);

    expect(stats.nonCalculables.length).toBeGreaterThanOrEqual(4);
    const libelles = stats.nonCalculables.map((n) => n.indicateur).join(' ');
    expect(libelles).toContain('PIB');
    expect(libelles).toContain('Réconciliation');
    // Chaque non-calculable DOIT nommer sa source manquante
    for (const n of stats.nonCalculables) expect(n.sourceRequise.length).toBeGreaterThan(10);
  });

  it('devrait exporter un CSV au format Annexe 1.1 feuille 1', async () => {
    const csv = await service.exportDeclarationCsv(2024);
    const lignes = csv.split('\n');

    expect(lignes[0]).toBe('ref;nomenclature_flux;paye_a_recu_par;montant_fcfa;montant_devise;commentaires');
    expect(lignes.some((l) => l.includes('QTR-2024-T1-SNPT') && l.includes('122500000'))).toBe(true);
    expect(lignes.some((l) => l.includes('CFLDR-2024-Lacs 1') && l.includes('93750000'))).toBe(true);
  });

  it('devrait échapper les champs CSV contenant des séparateurs', async () => {
    transfertCommuneCfldr.findMany.mockResolvedValue([
      {
        contribuableId: 'c-1',
        commune: 'Lacs 1',
        montantDuFcfa: 100n,
        montantEncaisseFcfa: 100n,
        contribuables: { nif: '123', raisonSociale: 'Société "Test", SARL' },
      },
    ]);
    redevanceMiniere.findMany.mockResolvedValue([]);

    const csv = await service.exportDeclarationCsv(2024);
    expect(csv).toContain('"Société ""Test"", SARL (NIF 123) → Commune Lacs 1"');
  });
});
