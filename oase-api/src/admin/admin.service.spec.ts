import { Test, TestingModule } from '@nestjs/testing';
import { AdminService } from './admin.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  systemConfig: {
    findMany: jest.fn(),
    createMany: jest.fn(),
    upsert: jest.fn(),
  },
  auditLog: { findMany: jest.fn() },
  systemLog: { count: jest.fn() },
  jobQueue: { count: jest.fn() },
} as any;

describe('AdminService', () => {
  let service: AdminService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AdminService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<AdminService>(AdminService);
    jest.clearAllMocks();
  });

  it('parametres() crée les clés par défaut si absentes et retourne un objet clé/valeur', async () => {
    mockPrisma.systemConfig.findMany
      .mockResolvedValueOnce([]) // ensureDefaults : aucune clé présente
      .mockResolvedValueOnce([{ key: 'smtp.port', value: '587' }]); // lecture finale

    const result = await service.parametres();

    expect(mockPrisma.systemConfig.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.arrayContaining([
          expect.objectContaining({ key: 'securite.mdp.longueur_min' }),
          expect.objectContaining({ key: 'smtp.host' }),
        ]),
      }),
    );
    expect(result).toEqual({ 'smtp.port': '587' });
  });

  it('parametres() ne recrée rien si les clés existent déjà', async () => {
    const cles = [
      'securite.session.duree_minutes', 'securite.session.refresh_jours',
      'securite.verrouillage.tentatives_max', 'securite.verrouillage.duree_minutes',
      'securite.mdp.longueur_min', 'securite.mdp.expiration_jours',
      'smtp.host', 'smtp.port', 'smtp.user', 'smtp.from',
      'sms.provider', 'sms.api_key', 'whatsapp.enabled', 'whatsapp.template',
      'notifications.regles_globales',
    ].map((key) => ({ key, value: 'x' }));
    mockPrisma.systemConfig.findMany.mockResolvedValue(cles);

    await service.parametres();

    expect(mockPrisma.systemConfig.createMany).not.toHaveBeenCalled();
  });

  it('majParametres() upserte chaque clé fournie', async () => {
    mockPrisma.systemConfig.findMany.mockResolvedValue([{ key: 'smtp.port', value: '2525' }]);

    await service.majParametres({ 'smtp.port': '2525' });

    expect(mockPrisma.systemConfig.upsert).toHaveBeenCalledWith({
      where: { key: 'smtp.port' },
      create: { key: 'smtp.port', value: '2525' },
      update: { value: '2525' },
    });
  });

  it('majInseed() ignore les clés hors préfixe inseed.', async () => {
    mockPrisma.systemConfig.findMany.mockResolvedValue([]);

    await service.majInseed({ 'inseed.pib_milliards_fcfa': '5000', 'smtp.host': 'pirate' });

    expect(mockPrisma.systemConfig.upsert).toHaveBeenCalledTimes(1);
    expect(mockPrisma.systemConfig.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { key: 'inseed.pib_milliards_fcfa' } }),
    );
  });

  it('monitoring() retourne les agrégats santé', async () => {
    mockPrisma.auditLog.findMany.mockResolvedValue([{ utilisateurId: 'u-1' }, { utilisateurId: 'u-2' }]);
    mockPrisma.systemLog.count.mockResolvedValue(3);
    mockPrisma.jobQueue.count.mockResolvedValueOnce(2).mockResolvedValueOnce(1);

    const result = await service.monitoring();

    expect(result.utilisateursActifs24h).toBe(2);
    expect(result.erreurs500_24h).toBe(3);
    expect(result.jobs).toEqual({ actifs: 2, echoues24h: 1 });
    expect(result.uptimeSecondes).toBeGreaterThanOrEqual(0);
  });
});
