import { Test, TestingModule } from '@nestjs/testing';
import { JobsService } from './jobs.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ConventionsService } from '../conventions/conventions.service';

describe('JobsService', () => {
  let service: JobsService;

  const demande = {
    findMany: jest.fn(),
    update: jest.fn(),
  };
  const archivage = {
    create: jest.fn(),
  };
  const utilisateur = {
    findFirst: jest.fn(),
  };

  const prisma: Record<string, unknown> = { demande, archivage, utilisateur };
  const notifications = { envoyer: jest.fn() };
  const conventions = { verifierAlertesEcheance: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobsService,
        { provide: PrismaService, useValue: prisma },
        { provide: NotificationsService, useValue: notifications },
        { provide: ConventionsService, useValue: conventions },
      ],
    }).compile();

    service = module.get<JobsService>(JobsService);
    jest.clearAllMocks();
  });

  it('devrait archiver des demandes anciennes', async () => {
    demande.findMany.mockResolvedValue([{ id: 'd-1', updatedAt: new Date('2020-01-01') }]);
    archivage.create.mockResolvedValue({ id: 'a-1' });
    demande.update.mockResolvedValue({});
    utilisateur.findFirst.mockResolvedValue({ id: 'system' });

    const result = await service.archiverDemandesAncienne('u-1', 365);

    expect(result.archives).toBe(1);
    expect(notifications.envoyer).toHaveBeenCalled();
  });

  it('devrait retourner le heartbeat', async () => {
    const result = await service.getHeartbeat();
    expect(result.healthy).toBe(true);
  });
});
