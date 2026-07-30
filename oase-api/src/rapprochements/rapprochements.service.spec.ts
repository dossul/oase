import { RapprochementsService } from './rapprochements.service';
import { PrismaService } from '../prisma/prisma.service';

describe('RapprochementsService', () => {
  let service: RapprochementsService;
  let prisma: any;

  const demande = (over: any = {}) => ({
    id: 'd1',
    reference: 'DEM-2026-001',
    montantFcfa: BigInt(10_000_000),
    contribuables: { raisonSociale: 'TEXLOME SA', nif: '100000001' },
    actes: [],
    decisions: [],
    ...over,
  });

  beforeEach(() => {
    prisma = { demande: { findMany: jest.fn() } };
    service = new RapprochementsService(prisma as PrismaService);
  });

  it('demande approuvée sans acte → a_justifier (documentaire)', async () => {
    prisma.demande.findMany.mockResolvedValue([demande()]);
    const { data, kpis } = await service.lister();
    expect(data[0].statut).toBe('a_justifier');
    expect(data[0].impact).toBe('Documentaire');
    expect(data[0].montantAtteste).toBe(0);
    expect(kpis.aJustifier).toBe(1);
  });

  it('acte concordant → reconcile', async () => {
    prisma.demande.findMany.mockResolvedValue([
      demande({ actes: [{ id: 'a1', montantFcfa: BigInt(10_000_000), estRevoke: false }] }),
    ]);
    const { data, kpis } = await service.lister();
    expect(data[0].statut).toBe('reconcile');
    expect(data[0].ecart).toBe(0);
    expect(kpis.reconciles).toBe(1);
    expect(kpis.montantEcarts).toBe(0);
  });

  it('montant divergent → en_ecart (budgétaire) avec écart signé', async () => {
    prisma.demande.findMany.mockResolvedValue([
      demande({ actes: [{ id: 'a1', montantFcfa: BigInt(8_000_000), estRevoke: false }] }),
    ]);
    const { data, kpis } = await service.lister();
    expect(data[0].statut).toBe('en_ecart');
    expect(data[0].impact).toBe('Budgetaire');
    expect(data[0].ecart).toBe(-2_000_000);
    expect(kpis.montantEcarts).toBe(2_000_000);
  });

  it('acte révoqué ignoré du calcul (comme absent)', async () => {
    prisma.demande.findMany.mockResolvedValue([
      demande({ actes: [{ id: 'a1', montantFcfa: BigInt(10_000_000), estRevoke: true }] }),
    ]);
    const { data } = await service.lister();
    expect(data[0].statut).toBe('a_justifier');
  });

  it('plusieurs actes valides → somme comparée au montant demandé', async () => {
    prisma.demande.findMany.mockResolvedValue([
      demande({
        actes: [
          { id: 'a1', montantFcfa: BigInt(6_000_000), estRevoke: false },
          { id: 'a2', montantFcfa: BigInt(4_000_000), estRevoke: false },
        ],
      }),
    ]);
    const { data } = await service.lister();
    expect(data[0].montantAtteste).toBe(10_000_000);
    expect(data[0].statut).toBe('reconcile');
  });

  it('requête limitée aux demandes approuvées avec relations nécessaires', async () => {
    prisma.demande.findMany.mockResolvedValue([]);
    await service.lister();
    expect(prisma.demande.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { statutCode: 'approuve' } }),
    );
  });
});
