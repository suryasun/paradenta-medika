import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import { AnnotationNotSupportedException, AttachmentNotFoundException } from '../../domain/exceptions/EmrExceptions';
import { IAttachmentRepository } from '../../domain/repositories/IAttachmentRepository';
import { IAttachmentAnnotationRepository } from '../../domain/repositories/IAttachmentAnnotationRepository';
import { AttachmentAnnotationResponseDto } from '../dtos/AttachmentResponseDto';
import { toAttachmentAnnotationResponseDto } from '../mappers/AttachmentMapper';

export interface AnnotateAttachmentInput {
  attachmentId: string;
  shape: string;
  positionX: number;
  positionY: number;
  width?: number;
  height?: number;
  text?: string;
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

/**
 * docs/03-sad/15-module-emr.md Part 3.3A Section 5 "Attachment Matrix":
 * only Photo/X-Ray/CBCT/STL support annotation (PDF/Video/Audio do not).
 * The original file's bytes/metadata are never touched -- annotation is a
 * separate overlay row, per task-081.
 */
const ANNOTATABLE_CATEGORIES = ['CLINICAL_PHOTOGRAPHY', 'X_RAY', 'CBCT'];

export class AnnotateAttachmentUseCase {
  constructor(
    private readonly attachmentRepository: IAttachmentRepository,
    private readonly annotationRepository: IAttachmentAnnotationRepository,
    private readonly auditService: IAuditService,
  ) {}

  async execute(input: AnnotateAttachmentInput): Promise<AttachmentAnnotationResponseDto> {
    const attachment = await this.attachmentRepository.findById(input.attachmentId);
    if (!attachment) {
      throw new AttachmentNotFoundException();
    }
    if (!ANNOTATABLE_CATEGORIES.includes(attachment.category)) {
      throw new AnnotationNotSupportedException();
    }

    const annotation = await this.annotationRepository.create({
      attachmentId: input.attachmentId,
      shape: input.shape,
      positionX: input.positionX,
      positionY: input.positionY,
      width: input.width,
      height: input.height,
      text: input.text,
      createdBy: input.actorUserId,
    });

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record('AttachmentAnnotation', annotation.id, 'CREATE', null, { shape: input.shape }, auditContext);

    return toAttachmentAnnotationResponseDto(annotation);
  }
}
