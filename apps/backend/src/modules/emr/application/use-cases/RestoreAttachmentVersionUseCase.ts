import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import { AttachmentNotFoundException, AttachmentVersionNotFoundException } from '../../domain/exceptions/EmrExceptions';
import { IAttachmentRepository } from '../../domain/repositories/IAttachmentRepository';
import { AttachmentResponseDto } from '../dtos/AttachmentResponseDto';
import { toAttachmentResponseDto } from '../mappers/AttachmentMapper';

export interface RestoreAttachmentVersionInput {
  attachmentId: string;
  versionNumber: number;
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

/**
 * docs/06-tasks/task-084.md: "make a specified prior version the current/
 * active version, without deleting any version history" -- repoints
 * currentVersionId only; no row is deleted or mutated.
 */
export class RestoreAttachmentVersionUseCase {
  constructor(
    private readonly attachmentRepository: IAttachmentRepository,
    private readonly auditService: IAuditService,
  ) {}

  async execute(input: RestoreAttachmentVersionInput): Promise<AttachmentResponseDto> {
    const attachment = await this.attachmentRepository.findById(input.attachmentId);
    if (!attachment) {
      throw new AttachmentNotFoundException();
    }

    const version = await this.attachmentRepository.findVersionByNumber(input.attachmentId, input.versionNumber);
    if (!version) {
      throw new AttachmentVersionNotFoundException();
    }

    const updated = await this.attachmentRepository.setCurrentVersion(input.attachmentId, version.id);

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record(
      'Attachment',
      input.attachmentId,
      'UPDATE',
      { currentVersionNumber: attachment.currentVersion?.versionNumber ?? null },
      { currentVersionNumber: input.versionNumber },
      auditContext,
    );

    return toAttachmentResponseDto(updated);
  }
}
