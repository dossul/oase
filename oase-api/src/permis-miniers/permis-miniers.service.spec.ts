import { Test, TestingModule } from '@nestjs/testing';
import { PermisMiniersService } from './permis-miniers.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('PermisMiniersService', () => {
  let service: PermisMiniersService;

  const permisMinier = {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };

  const prisma: Record<string, unknown> = { permisMinier };
  const audit = { createEntry: jest.fn() };

  const dtoBase = {
    reference: 'PE-2024-001',
    contribuableId: 'c-1',
    typePermis: 'exploitation',
    substance: 'Phosphates',
    dateDemande: '2023-06-01',
    dateOctroi: '2024-01-15',
    dureeAnnees: 25,
    modeOctroi: 'gre_a_gre',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermisMiniersService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: audit },
      ],
    }).compile();

    service = module.get<PermisMiniersService>(PermisMiniersService);
    jest.clearAllMocks();
  });

  it('devrait créer un permis minier et auditer', async () => {
    permisMinier.findUnique.mockResolvedValue(null);
    permisMinier.create.mockResolvedValue({ id: 'p-1', reference: 'PE-2024-001' });

    const result = await service.creer(dtoBase, 'u-1');

    expect(result.reference).toBe('PE-2024-001');
    expect(permisMinier.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          reference: 'PE-2024-001',
          typePermis: 'exploitation',
          rapportEiePublic: false,
        }),
      }),
    );
    expect(audit.createEntry).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'PERMIS_MINIER_CREER', entite: 'PermisMinier' }),
    );
  });

  it('devrait rejeter une référence dupliquée', async () => {
    permisMinier.findUnique.mockResolvedValue({ id: 'p-1' });

    await expect(service.creer(dtoBase, 'u-1')).rejects.toThrow(ConflictException);
  });

  it('devrait lister avec filtres type et statut', async () => {
    permisMinier.findMany.mockResolvedValue([{ id: 'p-1' }]);

    const result = await service.lister({ typePermis: 'exploitation', statut: 'actif' });

    expect(result).toHaveLength(1);
    expect(permisMinier.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { typePermis: 'exploitation', statut: 'actif' },
      }),
    );
  });

  it('devrait lever NotFoundException sur un permis inconnu', async () => {
    permisMinier.findUnique.mockResolvedValue(null);

    await expect(service.trouverParId('inconnu')).rejects.toThrow(NotFoundException);
  });

  it('devrait mettre à jour le statut et auditer', async () => {
    permisMinier.findUnique.mockResolvedValue({ id: 'p-1', statut: 'actif' });
    permisMinier.update.mockResolvedValue({ id: 'p-1', statut: 'suspendu' });

    const result = await service.majStatut('p-1', { statut: 'suspendu' }, 'u-1');

    expect(result.statut).toBe('suspendu');
    expect(audit.createEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'PERMIS_MINIER_STATUT',
        ancienneValeur: { statut: 'actif' },
        nouvelleValeur: { statut: 'suspendu' },
      }),
    );
  });

  it('devrait refuser la maj de statut sur un permis inconnu', async () => {
    permisMinier.findUnique.mockResolvedValue(null);

    await expect(service.majStatut('inconnu', { statut: 'expire' }, 'u-1')).rejects.toThrow(
      NotFoundException,
    );
  });
});
