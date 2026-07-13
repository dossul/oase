import { Test, TestingModule } from '@nestjs/testing';
import { AttestationsService } from './attestations.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  acte: { findUnique: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
} as any;

describe('AttestationsService', () => {
  let service: AttestationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AttestationsService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<AttestationsService>(AttestationsService);
    jest.clearAllMocks();
  });

  it('devrait generer une attestation avec QR hash', async () => {
    mockPrisma.acte.findUnique.mockResolvedValue({
      id: 'a-1',
      reference: 'ACTE-1',
      hashDocument: 'hash-doc',
      dateEffet: new Date(),
      demandes: { reference: 'D-1', contribuables: { nif: 'NIF001' } },
      decisions: { id: 'd-1' },
    });
    mockPrisma.acte.update.mockResolvedValue({ id: 'a-1', qrCodeHash: 'updated-hash' });

    const result = await service.generer('a-1');
    expect(result.reference).toContain('ATTEST-ACTE-1');
    expect(result.qrHash).toHaveLength(64);
    expect(result.hashSha256).toHaveLength(64);
  });

  it('devrait verifier une attestation par QR hash', async () => {
    mockPrisma.acte.findFirst.mockResolvedValue({
      id: 'a-1',
      reference: 'ACTE-1',
      hashDocument: 'hash-doc',
      qrCodeHash: 'qr-hash',
    });
    const result = await service.verifier('qr-hash');
    expect(result.valide).toBe(true);
  });
});
