import { Test, TestingModule } from '@nestjs/testing';
import { UnprocessableEntityException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { DecisionsService } from './decisions.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuthService } from '../auth/auth.service';
import { ReglesBlocageService } from '../regles-blocage/regles-blocage.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AttestationsService } from '../attestations/attestations.service';
import { Role } from '../common/enums/generated';

const mockPrisma = {
  demande: { findUnique: jest.fn(), update: jest.fn() },
  decision: { create: jest.fn() },
  acte: { create: jest.fn() },
} as any;

const mockAudit = { createEntry: jest.fn() } as any;
const mockAuth = { verifyPin: jest.fn() } as any;
const mockRegles = { estBloque: jest.fn() } as any;
const mockNotifications = { envoyer: jest.fn() } as any;
const mockAttestations = { generer: jest.fn() } as any;

const demandeEnInstruction = {
  id: 'd-1',
  statutCode: 'en_instruction',
  reference: 'DEM-2026-0001',
  contribuableId: 'b-1',
  contribuables: { id: 'b-1', userId: 'u-contribuable', nif: 'NIF001' },
  montantFcfa: BigInt(1000),
};

describe('DecisionsService', () => {
  let service: DecisionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DecisionsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditService, useValue: mockAudit },
        { provide: AuthService, useValue: mockAuth },
        { provide: ReglesBlocageService, useValue: mockRegles },
        { provide: NotificationsService, useValue: mockNotifications },
        { provide: AttestationsService, useValue: mockAttestations },
      ],
    }).compile();

    service = module.get<DecisionsService>(DecisionsService);
    jest.clearAllMocks();

    // Défauts : demande en instruction, aucun blocage, PIN valide, génération OK.
    mockPrisma.demande.findUnique.mockResolvedValue(demandeEnInstruction);
    mockRegles.estBloque.mockResolvedValue({ bloque: false, blocages: [] });
    mockAuth.verifyPin.mockResolvedValue(true);
    mockPrisma.decision.create.mockResolvedValue({ id: 'dec-1', demandeId: 'd-1', typeCode: 'approbation' });
    mockPrisma.acte.create.mockResolvedValue({ id: 'a-1', reference: 'ACTE-1', documentUrl: '', qrCodeHash: 'qr-init' });
    mockAttestations.generer.mockResolvedValue({
      acteId: 'a-1',
      documentUrl: 'attestations/ATTEST-ACTE-1.pdf',
      qrHash: 'qr-final',
      hashSha256: 'hash-final',
    });
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

  it('devrait approuver une demande avec PIN : décision + acte PDF + notification contribuable', async () => {
    const result = await service.approuver(user(Role.DECIDEUR), 'd-1', '123456', 'OK');

    expect(result.decision.typeCode).toBe('approbation');
    expect(mockPrisma.demande.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ statutCode: 'approuve' }) }),
    );
    // Document d'attestation généré et reflété dans la réponse.
    expect(mockAttestations.generer).toHaveBeenCalledWith('a-1');
    expect(result.acte.documentUrl).toBe('attestations/ATTEST-ACTE-1.pdf');
    expect(result.acte.qrCodeHash).toBe('qr-final');
    // Notification du contribuable propriétaire.
    expect(mockNotifications.envoyer).toHaveBeenCalledWith(
      expect.objectContaining({
        utilisateurId: 'u-contribuable',
        demandeId: 'd-1',
        typeNotificationCode: 'APPROBATION',
      }),
    );
    expect(mockAudit.createEntry).toHaveBeenCalled();
  });

  it('quota épuisé → 422 QUOTA_EPUISE (même sans PIN dans le corps)', async () => {
    mockRegles.estBloque.mockResolvedValue({
      bloque: true,
      blocages: [{ code: 'bloc-03', bloque: true, libelle: 'Quota epuise', gravite: 'critique' }],
    });

    const err = await service.approuver(user(Role.DECIDEUR), 'd-1', undefined).catch((e) => e);
    expect(err).toBeInstanceOf(UnprocessableEntityException);
    expect(err.getStatus()).toBe(422);
    expect(err.response.code).toBe('QUOTA_EPUISE');
    expect(mockPrisma.demande.update).not.toHaveBeenCalled();
  });

  it('autre blocage critique → 400 DEMANDE_BLOQUEE', async () => {
    mockRegles.estBloque.mockResolvedValue({
      bloque: true,
      blocages: [{ code: 'bloc-01', bloque: true, libelle: 'Dette fiscale active', gravite: 'critique' }],
    });

    await expect(service.approuver(user(Role.DECIDEUR), 'd-1', '123456')).rejects.toMatchObject({
      response: { code: 'DEMANDE_BLOQUEE' },
    });
  });

  it('PIN absent (demande non bloquée) → 400 PIN_REQUIS, pas de crash 500', async () => {
    const err = await service.approuver(user(Role.DECIDEUR), 'd-1', undefined).catch((e) => e);
    expect(err).toBeInstanceOf(BadRequestException);
    expect(err.response.code).toBe('PIN_REQUIS');
    expect(mockAuth.verifyPin).not.toHaveBeenCalled();
  });

  it('PIN incorrect → 401 PIN_INVALIDE', async () => {
    mockAuth.verifyPin.mockResolvedValue(false);

    const err = await service.approuver(user(Role.DECIDEUR), 'd-1', '000000').catch((e) => e);
    expect(err).toBeInstanceOf(UnauthorizedException);
    expect(err.getStatus()).toBe(401);
    expect(err.response.code).toBe('PIN_INVALIDE');
  });

  it('devrait rejeter une demande avec PIN', async () => {
    mockPrisma.decision.create.mockResolvedValue({ id: 'dec-1', demandeId: 'd-1', typeCode: 'rejet' });

    const result = await service.rejeter(user(Role.DECIDEUR), 'd-1', '123456', 'Motif de rejet suffisamment long');
    expect(result.decision.typeCode).toBe('rejet');
  });

  it('rejet avec PIN incorrect → 401 PIN_INVALIDE', async () => {
    mockAuth.verifyPin.mockResolvedValue(false);
    await expect(service.rejeter(user(Role.DECIDEUR), 'd-1', '000000', 'Motif de rejet')).rejects.toMatchObject({
      response: { code: 'PIN_INVALIDE' },
    });
  });
});
