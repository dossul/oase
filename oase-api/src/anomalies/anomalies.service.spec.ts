import { Test, TestingModule } from '@nestjs/testing';
import { AnomaliesService } from './anomalies.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotFoundException } from '@nestjs/common';

describe('AnomaliesService', () => {
  let service: AnomaliesService;

  const anomalie = {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };
  const demande = {
    findMany: jest.fn(),
  };
  const quota = {
    findFirst: jest.fn(),
  };

  const prisma: Record<string, unknown> = {
    anomalie,
    demande,
    quota,
  };
  const audit = { createEntry: jest.fn() };
  const notifications = { envoyer: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnomaliesService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: audit },
        { provide: NotificationsService, useValue: notifications },
      ],
    }).compile();

    service = module.get<AnomaliesService>(AnomaliesService);
    jest.clearAllMocks();
  });

  it('devrait créer une anomalie', async () => {
    anomalie.create.mockResolvedValue({ id: 'a-1', statutCode: 'nouvelle' });

    const result = await service.creer(
      {
        categorieCode: 'quota',
        graviteCode: 'elevee',
        description: 'Quota épuisé',
      },
      'u-1',
    );

    expect(result.id).toBe('a-1');
    expect(audit.createEntry).toHaveBeenCalled();
  });

  it('devrait traiter une anomalie', async () => {
    anomalie.findUnique.mockResolvedValue({ id: 'a-1', statutCode: 'nouvelle' });
    anomalie.update.mockResolvedValue({ id: 'a-1', statutCode: 'resolue' });

    const result = await service.traiter('a-1', { statut: 'resolue', commentaire: 'Traité' }, 'u-1');

    expect(result.statutCode).toBe('resolue');
  });

  it('devrait détecter un quota dépassé', async () => {
    demande.findMany.mockResolvedValue([
      {
        id: 'd-1',
        statutCode: 'en_instruction',
        baseJuridiqueVersionId: 'bjv-1',
        contribuableId: 'b-1',
      },
    ]);
    quota.findFirst.mockResolvedValue({
      consomme: 1000n,
      total: 1000n,
    });
    anomalie.create.mockResolvedValue({ id: 'a-1' });

    const result = await service.detecterAutomatiquement('quota_depasse', 'u-1');

    expect(result.detectees).toBe(1);
  });

  it('devrait échouer si anomalie introuvable', async () => {
    anomalie.findUnique.mockResolvedValue(null);

    await expect(service.traiter('a-inconnu', { statut: 'resolue' }, 'u-1')).rejects.toThrow(NotFoundException);
  });
});
