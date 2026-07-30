import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { AccordsSiegeService } from './accords-siege.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

describe('AccordsSiegeService', () => {
  let service: AccordsSiegeService;
  let prisma: any;
  let audit: any;

  const accord = {
    id: 'acc-1',
    institution: 'PNUD Togo',
    typeInstitutionCode: 'onu',
    texteFondateur: 'Accord de base ONU-Togo',
    dateSignature: new Date('1968-05-25'),
    estActif: true,
  };

  beforeEach(() => {
    prisma = {
      accordSiege: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      refTypeAccordSiege: {
        findUnique: jest.fn(),
      },
    };
    audit = { createEntry: jest.fn().mockResolvedValue({}) };
    service = new AccordsSiegeService(prisma as PrismaService, audit as AuditService);
  });

  describe('lister', () => {
    it('sans filtre → findMany sans where, tri par institution', async () => {
      prisma.accordSiege.findMany.mockResolvedValue([accord]);
      const res = await service.lister();
      expect(res).toEqual([accord]);
      expect(prisma.accordSiege.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {}, orderBy: { institution: 'asc' } }),
      );
    });

    it('avec filtre typeInstitutionCode', async () => {
      prisma.accordSiege.findMany.mockResolvedValue([]);
      await service.lister('ambassade');
      expect(prisma.accordSiege.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { typeInstitutionCode: 'ambassade' } }),
      );
    });
  });

  describe('trouverParId', () => {
    it('accord existant → retourné avec relations', async () => {
      prisma.accordSiege.findUnique.mockResolvedValue(accord);
      expect(await service.trouverParId('acc-1')).toEqual(accord);
    });

    it('inconnu → 404 ACCORD_SIEGE_INTROUVABLE', async () => {
      prisma.accordSiege.findUnique.mockResolvedValue(null);
      await expect(service.trouverParId('xxx')).rejects.toThrow(NotFoundException);
    });
  });

  describe('creer', () => {
    const dto = { institution: 'Ambassade d’Allemagne', typeInstitutionCode: 'ambassade', dateSignature: '1975-03-12' };

    it('type valide + pas de doublon → création + audit', async () => {
      prisma.refTypeAccordSiege.findUnique.mockResolvedValue({ code: 'ambassade', estActif: true });
      prisma.accordSiege.findFirst.mockResolvedValue(null);
      prisma.accordSiege.create.mockResolvedValue({ ...accord, institution: dto.institution });

      const res = await service.creer(dto, 'user-1');
      expect(res.institution).toBe(dto.institution);
      expect(prisma.accordSiege.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ institution: dto.institution, typeInstitutionCode: 'ambassade' }),
        }),
      );
      expect(audit.createEntry).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'ACCORD_SIEGE_CREER', utilisateurId: 'user-1' }),
      );
    });

    it('type inconnu → 400 TYPE_INSTITUTION_INCONNU', async () => {
      prisma.refTypeAccordSiege.findUnique.mockResolvedValue(null);
      await expect(service.creer(dto, 'user-1')).rejects.toThrow(BadRequestException);
      expect(prisma.accordSiege.create).not.toHaveBeenCalled();
    });

    it('doublon actif → 409 ACCORD_SIEGE_DOUBLON', async () => {
      prisma.refTypeAccordSiege.findUnique.mockResolvedValue({ code: 'ambassade', estActif: true });
      prisma.accordSiege.findFirst.mockResolvedValue(accord);
      await expect(service.creer(dto, 'user-1')).rejects.toThrow(ConflictException);
      expect(prisma.accordSiege.create).not.toHaveBeenCalled();
    });
  });

  describe('modifier', () => {
    it('accord existant → mise à jour partielle + audit avec ancienne valeur', async () => {
      prisma.accordSiege.findUnique.mockResolvedValue(accord);
      prisma.accordSiege.update.mockResolvedValue({ ...accord, estActif: false });

      const res = await service.modifier('acc-1', { estActif: false }, 'user-1');
      expect(res.estActif).toBe(false);
      expect(prisma.accordSiege.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'acc-1' }, data: { estActif: false } }),
      );
      expect(audit.createEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'ACCORD_SIEGE_MODIFIER',
          ancienneValeur: expect.objectContaining({ estActif: true }),
        }),
      );
    });

    it('inconnu → 404', async () => {
      prisma.accordSiege.findUnique.mockResolvedValue(null);
      await expect(service.modifier('xxx', { estActif: false }, 'user-1')).rejects.toThrow(NotFoundException);
    });
  });
});
