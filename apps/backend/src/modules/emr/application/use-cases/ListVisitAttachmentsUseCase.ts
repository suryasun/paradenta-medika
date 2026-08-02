import { IAttachmentRepository } from '../../domain/repositories/IAttachmentRepository';
import { AttachmentResponseDto } from '../dtos/AttachmentResponseDto';
import { toAttachmentResponseDto } from '../mappers/AttachmentMapper';

/** docs/06-tasks/task-082.md: excludes archived attachments by default. */
export class ListVisitAttachmentsUseCase {
  constructor(private readonly attachmentRepository: IAttachmentRepository) {}

  async execute(visitId: string, includeArchived = false): Promise<AttachmentResponseDto[]> {
    const attachments = await this.attachmentRepository.findByVisitId(visitId, includeArchived);
    return attachments.map(toAttachmentResponseDto);
  }
}
