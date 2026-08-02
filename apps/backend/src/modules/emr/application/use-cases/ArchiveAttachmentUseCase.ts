import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import { AttachmentNotFoundException } from '../../domain/exceptions/EmrExceptions';
import { IAttachmentRepository } from '../../domain/repositories/IAttachmentRepository';
import { AttachmentResponseDto } from '../dtos/AttachmentResponseDto';
import { toAttachmentResponseDto } from '../mappers/AttachmentMapper';

export interface ArchiveAttachmentInput {
  attachmentId: string;
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

/** docs/06-tasks/task-083.md: soft-flag only, never a hard delete. */
export class ArchiveAttachmentUseCase {
  constructor(
    private readonly attachmentRepository: IAttachmentRepository,
    private readonly auditService: IAuditService,
  ) {}

  async execute(input: ArchiveAttachmentInput): Promise<AttachmentResponseDto> {
    const existing = await this.attachmentRepository.findById(input.attachmentId);
    if (!existing) {
      throw new AttachmentNotFoundException();
    }

    await this.attachmentRepository.archive(input.attachmentId, input.actorUserId);
    const archived = await this.attachmentRepository.findById(input.attachmentId);
    if (!archived) {
      throw new AttachmentNotFoundException();
    }

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record('Attachment', input.attachmentId, 'UPDATE', { archivedAt: null }, { archivedAt: 'now' }, auditContext);

    return toAttachmentResponseDto(archived);
  }
}
