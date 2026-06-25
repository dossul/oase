import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '../common/enums/generated';

const mockPrisma = {
  notification: { create: jest.fn(), findMany: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
  demande: { findUnique: jest.fn() },
  beneficiaire: { findUnique: jest.fn() },
} as any;

describe('NotificationsService', () => {
  let service: NotificationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NotificationsService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    jest.clearAllMocks();
  });

  const user = (role: Role) =>
    ({
      id: 'u-1',
      email: 'test@oase.tg',
      nom: 'T',
      prenom: 'U',
      role,
      institutionId: 'i-1',
      institution: 'OTR',
      mfaActive: true,
    }) as any;

  it('devrait envoyer une notification in-app', async () => {
    mockPrisma.notification.create.mockResolvedValue({ id: 'n-1' });
    const result = await service.envoyer({
      utilisateurId: 'u-1',
      typeNotificationCode: 'transition_demande',
      canalCode: 'inapp',
      titre: 'Test',
      corps: 'Message',
    });
    expect(result.envoye).toBe(true);
  });

  it('devrait notifier les destinataires d une transition', async () => {
    mockPrisma.demande.findUnique.mockResolvedValue({ id: 'd-1', beneficiaireId: 'b-1', instructeurId: 'u-2' });
    mockPrisma.beneficiaire.findUnique.mockResolvedValue({ id: 'b-1', userId: 'u-1' });
    mockPrisma.notification.create.mockResolvedValue({ id: 'n-1' });

    const result = await service.notifierTransition(user(Role.AGENT_CI), 'd-1', 'soumettre', 'soumis');
    expect(result).toHaveLength(2);
  });
});
