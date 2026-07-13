import { Test, TestingModule } from '@nestjs/testing';
import { PiecesJointesService } from './pieces-jointes.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { Role } from '../common/enums/generated';
import { BadRequestException } from '@nestjs/common';

const mockPrisma = {
  demande: { findUnique: jest.fn() },
  pieceJointe: { create: jest.fn(), findMany: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
} as any;

const mockAudit = { createEntry: jest.fn() } as any;

describe('PiecesJointesService', () => {
  let service: PiecesJointesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PiecesJointesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get<PiecesJointesService>(PiecesJointesService);
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

  it('devrait rejeter un type MIME non autorise', async () => {
    mockPrisma.demande.findUnique.mockResolvedValue({ id: 'd-1' });
    await expect(
      service.upload(
        user(Role.CONTRIBUABLE),
        'd-1',
        {
          fieldname: 'file',
          originalname: 'test.exe',
          encoding: '7bit',
          mimetype: 'application/x-msdownload',
          size: 1000,
          buffer: Buffer.from('test'),
        },
        { rangCode: 'premier' } as any,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('devrait calculer le hash SHA-256', async () => {
    mockPrisma.demande.findUnique.mockResolvedValue({ id: 'd-1' });
    mockPrisma.pieceJointe.create.mockImplementation((args: any) => ({
      id: 'p-1',
      nomFichier: args.data.nomFichier,
      tailleOctets: args.data.tailleOctets,
      hashSha256: args.data.hashSha256,
      typeMime: args.data.typeMime,
      urlStockage: args.data.urlStockage,
      rangCode: args.data.rangCode,
      categorie: args.data.categorie,
      createdAt: new Date(),
    }));

    const result = await service.upload(
      user(Role.CONTRIBUABLE),
      'd-1',
      {
        fieldname: 'file',
        originalname: 'test.pdf',
        encoding: '7bit',
        mimetype: 'application/pdf',
        size: 1000,
        buffer: Buffer.from('test'),
      },
      { rangCode: 'premier' } as any,
    );

    expect(result.hashSha256).toHaveLength(64);
    expect(result.nomFichier).toBe('test.pdf');
  });
});
