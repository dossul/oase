import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from './audit.service';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Mock stateful : findFirst lit le « dernier » hash d'un tableau partagé,
 * create y pousse la nouvelle entrée. Sans le mutex applicatif, deux
 * createEntry parallèles liraient le même hash initial → rupture de chaîne.
 */
function makeStatefulPrisma() {
  const rows: { hashPrecedent: string | null; empreinteSha256: string }[] = [
    { hashPrecedent: null, empreinteSha256: 'hash-initial' },
  ];
  const prisma = {
    auditLog: {
      findFirst: jest.fn(async () => {
        // Simule la latence DB pour ouvrir la fenêtre de concurrence.
        await new Promise((r) => setTimeout(r, 5));
        const last = rows[rows.length - 1];
        return { empreinteSha256: last.empreinteSha256 };
      }),
      create: jest.fn(async ({ data }: any) => {
        await new Promise((r) => setTimeout(r, 5));
        rows.push({ hashPrecedent: data.hashPrecedent, empreinteSha256: data.empreinteSha256 });
        return data;
      }),
    },
  } as any;
  return { prisma, rows };
}

describe('AuditService — chaînage SHA-256 concurrent', () => {
  let service: AuditService;

  it('N createEntry parallèles produisent une chaîne cohérente (pas de rupture)', async () => {
    const { prisma, rows } = makeStatefulPrisma();
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuditService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get<AuditService>(AuditService);

    const N = 10;
    await Promise.all(
      Array.from({ length: N }, (_, i) =>
        service.createEntry({ action: `ACTION_${i}`, entite: 'test', entiteId: `e-${i}` }),
      ),
    );

    // Vérification de la chaîne (même logique que verifyChain)
    let prev: string | null = null;
    const breaks: number[] = [];
    rows.forEach((row, idx) => {
      if (row.hashPrecedent !== prev) breaks.push(idx);
      prev = row.empreinteSha256;
    });

    expect(rows).toHaveLength(N + 1);
    expect(breaks).toEqual([]);
    // Chaque nouvelle entrée est chaînée sur l'empreinte de la précédente.
    for (let i = 1; i < rows.length; i++) {
      expect(rows[i].hashPrecedent).toBe(rows[i - 1].empreinteSha256);
    }
  });

  it('une entrée en échec ne bloque pas les suivantes', async () => {
    const { prisma } = makeStatefulPrisma();
    prisma.auditLog.create
      .mockRejectedValueOnce(new Error('DB down'));
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuditService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get<AuditService>(AuditService);

    await expect(
      service.createEntry({ action: 'KO', entite: 'test', entiteId: 'e-1' }),
    ).rejects.toThrow('DB down');
    // L'entrée suivante doit passer normalement.
    await expect(
      service.createEntry({ action: 'OK', entite: 'test', entiteId: 'e-2' }),
    ).resolves.toBeUndefined();
  });
});
