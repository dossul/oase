import { Test, TestingModule } from '@nestjs/testing';
import { QuotasService } from './quotas.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ConflictException } from '@nestjs/common';

describe('QuotasService', () => {
  let service: QuotasService;

  const quota = {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };
  const quotaMouvement = {
    create: jest.fn(),
  };

  const prisma: Record<string, unknown> = {
    quota,
    quotaMouvement,
    $transaction: jest.fn((fn: (tx: Record<string, unknown>) => Promise<unknown>) => fn(prisma)),
  };
  const audit = { createEntry: jest.fn() };
  const notifications = { envoyer: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuotasService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: audit },
        { provide: NotificationsService, useValue: notifications },
      ],
    }).compile();

    service = module.get<QuotasService>(QuotasService);
    jest.clearAllMocks();
  });

  it('devrait créer un quota', async () => {
    quota.findFirst.mockResolvedValue(null);
    quota.create.mockResolvedValue({ id: 'q-1', total: 1000000n });

    const result = await service.creer(
      {
        baseJuridiqueVersionId: 'bjv-1',
        typeQuotaCode: 'plafond_annuel',
        uniteCode: 'fcfa',
        total: '1000000',
      },
      'u-1',
    );

    expect(result.id).toBe('q-1');
    expect(audit.createEntry).toHaveBeenCalled();
  });

  it('devrait rejeter un mouvement dépassant le quota', async () => {
    quota.findUnique.mockResolvedValue({
      id: 'q-1',
      total: 1000000n,
      consomme: 900000n,
      alerteSeuilPct: 80,
      alerte80Envoyee: false,
      alerte100Envoyee: false,
      contribuableId: null,
    });

    await expect(
      service.ajouterMouvement({ quotaId: 'q-1', typeMouvementCode: 'consommation', montant: '200000' }, 'u-1'),
    ).rejects.toThrow(ConflictException);
  });

  it('devrait envoyer une alerte à 80%', async () => {
    quota.findUnique.mockResolvedValue({
      id: 'q-1',
      total: 1000000n,
      consomme: 700000n,
      alerteSeuilPct: 80,
      alerte80Envoyee: false,
      alerte100Envoyee: false,
      contribuableId: null,
    });
    quota.update.mockResolvedValue({});
    quotaMouvement.create.mockResolvedValue({ id: 'm-1' });

    await service.ajouterMouvement({ quotaId: 'q-1', typeMouvementCode: 'consommation', montant: '100000' }, 'u-1');

    expect(notifications.envoyer).toHaveBeenCalled();
  });
});
