import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import { MasterDataNotFoundException } from '../../../master-data/domain/exceptions/MasterDataExceptions';
import { ConsentTemplateNotActiveException, VisitNotFoundException } from '../../domain/exceptions/EmrExceptions';
import { IVisitRepository } from '../../domain/repositories/IVisitRepository';
import { IConsentTemplateRepository } from '../../domain/repositories/IConsentTemplateRepository';
import { IConsentRepository } from '../../domain/repositories/IConsentRepository';
import { assertVisitOpen } from '../services/assertVisitOpen';
import { ConsentResponseDto } from '../dtos/ConsentResponseDto';
import { toConsentResponseDto } from '../mappers/ConsentMapper';

export interface CreateConsentInput {
  visitId: string;
  templateId: string;
  procedure: string;
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

/** docs/06-tasks/task-086.md: "instantiate a consent from a template for a specific patient/visit/procedure." */
export class CreateConsentUseCase {
  constructor(
    private readonly visitRepository: IVisitRepository,
    private readonly consentTemplateRepository: IConsentTemplateRepository,
    private readonly consentRepository: IConsentRepository,
    private readonly auditService: IAuditService,
  ) {}

  async execute(input: CreateConsentInput): Promise<ConsentResponseDto> {
    const visit = await this.visitRepository.findById(input.visitId);
    if (!visit) {
      throw new VisitNotFoundException();
    }
    assertVisitOpen(visit);

    const template = await this.consentTemplateRepository.findById(input.templateId);
    if (!template) {
      throw new MasterDataNotFoundException('ConsentTemplate');
    }
    if (!template.isActive) {
      throw new ConsentTemplateNotActiveException();
    }

    const consent = await this.consentRepository.create({
      templateId: input.templateId,
      patientId: visit.patientId,
      visitId: input.visitId,
      doctorId: visit.doctorId,
      procedure: input.procedure,
      createdBy: input.actorUserId,
    });

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record(
      'Consent',
      consent.id,
      'CREATE',
      null,
      { visitId: input.visitId, templateId: input.templateId, procedure: input.procedure },
      auditContext,
    );

    return toConsentResponseDto(consent);
  }
}
