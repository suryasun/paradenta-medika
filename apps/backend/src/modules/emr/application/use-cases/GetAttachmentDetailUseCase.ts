import { AttachmentNotFoundException } from '../../domain/exceptions/EmrExceptions';
import { IAttachmentRepository } from '../../domain/repositories/IAttachmentRepository';
import { IAttachmentAnnotationRepository } from '../../domain/repositories/IAttachmentAnnotationRepository';
import { AttachmentDetailResponseDto } from '../dtos/AttachmentResponseDto';
import { toAttachmentAnnotationResponseDto, toAttachmentResponseDto } from '../mappers/AttachmentMapper';

/** docs/06-tasks/task-079.md: metadata (category, upload date, uploader, version) plus its annotations. */
export class GetAttachmentDetailUseCase {
  constructor(
    private readonly attachmentRepository: IAttachmentRepository,
    private readonly annotationRepository: IAttachmentAnnotationRepository,
  ) {}

  async execute(id: string): Promise<AttachmentDetailResponseDto> {
    const attachment = await this.attachmentRepository.findById(id);
    if (!attachment) {
      throw new AttachmentNotFoundException();
    }

    const annotations = await this.annotationRepository.findByAttachmentId(id);

    return {
      ...toAttachmentResponseDto(attachment),
      annotations: annotations.map(toAttachmentAnnotationResponseDto),
    };
  }
}
