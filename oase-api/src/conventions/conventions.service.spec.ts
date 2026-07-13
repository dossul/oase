import { Test, TestingModule } from '@nestjs/testing';
import { ConventionsService } from './conventions.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ConflictException } from '@nestjs/common';

describe('ConventionsService', () => {
  let service: ConventionsService;

  const convention = {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };

  const prisma: Record<string, unknown> = { convention };
  const audit = { createEntry: jest.fn() };
  const notifications = { envoyer: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConventionsService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: audit },
        { provide: NotificationsService, useValue: notifications },
      ],
    }).compile();

    service = module.get<ConventionsService>(ConventionsService);
    jest.clearAllMocks();
  });

  it('devrait créer une convention', async () => {
    convention.findUnique.mockResolvedValue(null);
    convention.create.mockResolvedValue({ id: 'c-1', reference: 'CONV-2024-001' });

    const result = await service.creer(
      {
        reference: 'CONV-2024-001',
        contribuableId: 'b-1',
        regimeCode: 'zfi',
        dateDebut: '2024-01-01',
        dateFin: '2025-01-01',
      },
      'u-1',
    );

    expect(result.reference).toBe('CONV-2024-001');
    expect(audit.createEntry).toHaveBeenCalled();
  });

  it('devrait rejeter une référence dupliquée', async () => {
    convention.findUnique.mockResolvedValue({ id: 'c-1' });

    await expect(
      service.creer(
        {
          reference: 'CONV-2024-001',
          contribuableId: 'b-1',
          regimeCode: 'zfi',
          dateDebut: '2024-01-01',
          dateFin: '2025-01-01',
        },
        'u-1',
      ),
    ).rejects.toThrow(ConflictException);
  });

  it('devrait renouveler une convention', async () => {
    const fin = new Date('2025-01-01');
    const nouvelleFin = '2025-12-31';
    convention.findUnique.mockResolvedValue({ id: 'c-1', dateFin: fin });
    convention.update.mockResolvedValue({ id: 'c-1', dateFin: new Date(nouvelleFin) });

    const result = await service.renouveler('c-1', { dateFin: nouvelleFin }, 'u-1');

    expect(result.dateFin).toBeDefined();
  });

  it('devrait détecter les conventions à échéance J-30', async () => {
    const fin = new Date();
    fin.setDate(fin.getDate() + 15);
    convention.findMany.mockResolvedValue([{ id: 'c-1', reference: 'CONV-001', dateFin: fin }]);

    const result = await service.verifierAlertesEcheance('u-1');

    expect(result.alertes).toBe(1);
    expect(notifications.envoyer).toHaveBeenCalled();
  });
});
