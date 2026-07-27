import { Test, TestingModule } from '@nestjs/testing';
import { AttestationsService } from './attestations.service';
import { PrismaService } from '../prisma/prisma.service';
import { ScopeService } from '../common/services/scope.service';

const mockPrisma = {
  acte: { findUnique: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
} as any;

const mockScope = {
  isAllowed: jest.fn(),
} as any;

describe('AttestationsService', () => {
  let service: AttestationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttestationsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ScopeService, useValue: mockScope },
      ],
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

  describe('telechargerParDemande', () => {
    const user: any = { id: 'user-1', role: 'contribuable' };

    it('rejette 403 si la demande est hors perimetre', async () => {
      mockScope.isAllowed.mockResolvedValue(false);
      await expect(service.telechargerParDemande(user, 'dem-1')).rejects.toMatchObject({
        response: { code: 'PERIMETRE_NON_AUTORISE' },
      });
    });

    it('rejette 404 si aucune attestation pour la demande', async () => {
      mockScope.isAllowed.mockResolvedValue(true);
      mockPrisma.acte.findFirst.mockResolvedValue(null);
      await expect(service.telechargerParDemande(user, 'dem-1')).rejects.toMatchObject({
        response: { code: 'ATTESTATION_NON_TROUVEE' },
      });
    });
  });
});
