import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import { VisitNotFoundException } from '../../domain/exceptions/EmrExceptions';
import { ISoapNoteRepository } from '../../domain/repositories/ISoapNoteRepository';
import { IVisitRepository } from '../../domain/repositories/IVisitRepository';
import { assertVisitOpen } from '../services/assertVisitOpen';
import { SoapNoteResponseDto } from '../dtos/VisitResponseDto';

export interface RecordSoapNoteInput {
  visitId: string;
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

/** docs/06-tasks/task-050.md. */
export class RecordSoapNoteUseCase {
  constructor(
    private readonly visitRepository: IVisitRepository,
    private readonly soapNoteRepository: ISoapNoteRepository,
    private readonly auditService: IAuditService,
  ) {}

  async execute(input: RecordSoapNoteInput): Promise<SoapNoteResponseDto> {
    const visit = await this.visitRepository.findById(input.visitId);
    if (!visit) {
      throw new VisitNotFoundException();
    }
    assertVisitOpen(visit);

    const existing = await this.soapNoteRepository.findByVisitId(input.visitId);
    const soapNote = await this.soapNoteRepository.upsert({
      visitId: input.visitId,
      subjective: input.subjective,
      objective: input.objective,
      assessment: input.assessment,
      plan: input.plan,
      updatedBy: input.actorUserId,
    });

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record(
      'SoapNote',
      soapNote.id,
      existing ? 'UPDATE' : 'CREATE',
      existing ? { subjective: existing.subjective, objective: existing.objective, assessment: existing.assessment, plan: existing.plan } : null,
      { subjective: soapNote.subjective, objective: soapNote.objective, assessment: soapNote.assessment, plan: soapNote.plan },
      auditContext,
    );

    return {
      subjective: soapNote.subjective,
      objective: soapNote.objective,
      assessment: soapNote.assessment,
      plan: soapNote.plan,
    };
  }
}
