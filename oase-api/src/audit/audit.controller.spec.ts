import { Test, TestingModule } from '@nestjs/testing';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';

const mockAudit = {
  lister: jest.fn(),
  verifyChain: jest.fn(),
  trouverParId: jest.fn(),
} as any;

describe('AuditController', () => {
  let controller: AuditController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuditController],
      providers: [{ provide: AuditService, useValue: mockAudit }],
    }).compile();

    controller = module.get<AuditController>(AuditController);
    jest.clearAllMocks();
  });

  it('GET verify-chain délègue au service', async () => {
    mockAudit.verifyChain.mockResolvedValue({ verified: 10, breaks: [] });
    const result = await controller.verifyChain();
    expect(mockAudit.verifyChain).toHaveBeenCalled();
    expect(result).toEqual({ verified: 10, breaks: [] });
  });

  it('POST verify-chain (alias exigé par le plan de recette) délègue au service', async () => {
    mockAudit.verifyChain.mockResolvedValue({ verified: 10, breaks: [] });
    const result = await controller.verifyChainPost();
    expect(mockAudit.verifyChain).toHaveBeenCalled();
    expect(result).toEqual({ verified: 10, breaks: [] });
  });
});
