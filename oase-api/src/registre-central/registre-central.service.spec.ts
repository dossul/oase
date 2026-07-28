import { Test, TestingModule } from '@nestjs/testing';
import { RegistreCentralService } from './registre-central.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  baseJuridique: { findMany: jest.fn() },
  baseJuridiqueVersion: { findMany: jest.fn() },
  demande: { findMany: jest.fn() },
  decision: { findMany: jest.fn() },
} as any;

describe('RegistreCentralService', () => {
  let service: RegistreCentralService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RegistreCentralService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<RegistreCentralService>(RegistreCentralService);
    jest.clearAllMocks();

    mockPrisma.baseJuridique.findMany.mockResolvedValue([
      { id: 'bj-1', codeMesure: 'EXO_GEN' },
      { id: 'bj-2', codeMesure: 'ZFI' },
    ]);
    mockPrisma.baseJuridiqueVersion.findMany.mockResolvedValue([
      { id: 'bjv-1', baseJuridiqueId: 'bj-1', libelle: 'Exonération générale', impotConcerne: 'IS', typeTexte1: 'CGI', organeGestionCode: 'CI', estActive: true },
      { id: 'bjv-2', baseJuridiqueId: 'bj-2', libelle: 'Zone franche', impotConcerne: 'IS', typeTexte1: 'Zone Franche', organeGestionCode: null, estActive: true },
    ]);
    mockPrisma.demande.findMany.mockResolvedValue([
      { id: 'd-1', baseJuridiqueVersionId: 'bjv-1', statutCode: 'approuve', montantFcfa: 1000000n },
      { id: 'd-2', baseJuridiqueVersionId: 'bjv-1', statutCode: 'approuve', montantFcfa: 500000n },
      { id: 'd-3', baseJuridiqueVersionId: 'bjv-1', statutCode: 'en_instruction', montantFcfa: 700000n },
      { id: 'd-4', baseJuridiqueVersionId: 'bjv-2', statutCode: 'rejete', montantFcfa: 200000n },
    ]);
    mockPrisma.decision.findMany.mockResolvedValue([
      { demandeId: 'd-2', typeCode: 'approbation', createdAt: new Date('2026-07-20') },
      { demandeId: 'd-1', typeCode: 'approbation', createdAt: new Date('2026-07-10') },
    ]);
  });

  it('agrège demandes, approbations et montants par base juridique', async () => {
    const mesures = await service.mesures();

    expect(mesures).toHaveLength(2);
    const exo = mesures.find((m) => m.codeMesure === 'EXO_GEN')!;
    expect(exo.nombreDemandes).toBe(3);
    expect(exo.nombreApprouvees).toBe(2);
    expect(exo.montantTotalAccorde).toBe('1500000');
    expect(exo.libelle).toBe('Exonération générale');

    const zfi = mesures.find((m) => m.codeMesure === 'ZFI')!;
    expect(zfi.nombreDemandes).toBe(1);
    expect(zfi.nombreApprouvees).toBe(0);
    expect(zfi.montantTotalAccorde).toBe('0');
  });

  it('remonte la dernière décision par base (la plus récente)', async () => {
    const mesures = await service.mesures();
    const exo = mesures.find((m) => m.codeMesure === 'EXO_GEN')!;
    expect(exo.derniereDecision).toEqual({ typeCode: 'approbation', date: new Date('2026-07-20') });

    const zfi = mesures.find((m) => m.codeMesure === 'ZFI')!;
    expect(zfi.derniereDecision).toBeNull();
  });

  it('retourne des agrégats à zéro pour une base sans demande', async () => {
    mockPrisma.demande.findMany.mockResolvedValue([]);
    mockPrisma.decision.findMany.mockResolvedValue([]);
    const mesures = await service.mesures();
    expect(mesures.every((m) => m.nombreDemandes === 0 && m.montantTotalAccorde === '0')).toBe(true);
  });
});
