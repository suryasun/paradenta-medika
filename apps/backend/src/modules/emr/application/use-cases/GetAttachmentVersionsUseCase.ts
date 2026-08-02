import { AttachmentNotFoundException } from '../../domain/exceptions/EmrExceptions';
import { IAttachmentRepository } from '../../domain/repositories/IAttachmentRepository';
import { AttachmentVersionResponseDto } from '../dtos/AttachmentResponseDto';
import { toAttachmentVersionResponseDto } from '../mappers/AttachmentMapper';

/**
 * docs/06-tasks/task-084.md Frontend Scope: "Version history list with a
 * 'Restore' action per version" -- no literal GET endpoint for this exists
 * in docs/03-sad/15-module-emr.md Section 60's OpenAPI spec (only Upload/
 * Get/Download/Annotate/Timeline/Archive/Restore are listed), so this is a
 * convention-derived addition, flagged, since the frontend requirement
 * cannot be met otherwise.
 */
export class GetAttachmentVersionsUseCase {
  constructor(private readonly attachmentRepository: IAttachmentRepository) {}

  async execute(attachmentId: string): Promise<AttachmentVersionResponseDto[]> {
    const attachment = await this.attachmentRepository.findById(attachmentId);
    if (!attachment) {
      throw new AttachmentNotFoundException();
    }

    const versions = await this.attachmentRepository.findVersions(attachmentId);
    return versions.map(toAttachmentVersionResponseDto);
  }
}
