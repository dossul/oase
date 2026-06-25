import { Test, TestingModule } from '@nestjs/testing';
import { WorkflowService } from './workflow.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuthService } from '../auth/auth.service';
import { Role } from '../common/enums/generated';

const mockPrisma = {
  workflowTemplate: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
  },
  demande: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  demandeWorkflowInstance: {
    create: jest.fn(),
    findUnique: jest.fn(),
  },
  demandeWorkflowEtape: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
} as any;

const mockAudit = { createEntry: jest.fn() } as any;
const mockAuth = { verifyPin: jest.fn() } as any;

describe('WorkflowService', () => {
  let service: WorkflowService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkflowService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditService, useValue: mockAudit },
        { provide: AuthService, useValue: mockAuth },
      ],
    }).compile();

    service = module.get<WorkflowService>(WorkflowService);
    jest.clearAllMocks();
  });

  const user = (role: Role) => ({ id: 'u-1', email: 'test@oase.tg', nom: 'T', prenom: 'U', role, institutionId: 'i-1', institution: 'OTR', mfaActive: true } as any);

  it('devrait creer un template de workflow', async () => {
    mockPrisma.workflowTemplate.findUnique.mockResolvedValue(null);
    mockPrisma.workflowTemplate.create.mockResolvedValue({ id: 'wt-1', code: 'STANDARD', nom: 'Workflow standard' });

    const result = await service.creerTemplate(user(Role.ADMIN_SI), {
      code: 'STANDARD',
      nom: 'Workflow standard',
      typeTexte1: 'Zone Franche',
      etapes: [{ nomEtape: 'Validation CI', ordre: 1, acteurRole: 'agent_ci' }],
    } as any);

    expect(result.code).toBe('STANDARD');
    expect(mockAudit.createEntry).toHaveBeenCalled();
  });

  it('devrait demarrer une instance de workflow', async () => {
    mockPrisma.workflowTemplate.findUnique.mockResolvedValue({
      id: 'wt-1',
      workflowTemplateEtapes: [{ id: 'e-1', nomEtape: 'Validation', ordre: 1, acteurRole: 'agent_ci', delaiCibleJours: 5 }],
    });
    mockPrisma.demande.findUnique.mockResolvedValue({ id: 'd-1' });
    mockPrisma.demandeWorkflowInstance.create.mockResolvedValue({ id: 'wi-1', demandeId: 'd-1' });

    const result = await service.demarrerInstance(user(Role.AGENT_CI), 'd-1', 'wt-1');
    expect(result.demandeId).toBe('d-1');
  });
});
