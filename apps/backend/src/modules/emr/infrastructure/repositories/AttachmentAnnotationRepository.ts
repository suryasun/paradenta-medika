import { AttachmentAnnotation } from '@prisma/client';
import { prisma } from '../../../../shared/infrastructure/prisma';
import {
  CreateAttachmentAnnotationInput,
  IAttachmentAnnotationRepository,
} from '../../domain/repositories/IAttachmentAnnotationRepository';

export class AttachmentAnnotationRepository implements IAttachmentAnnotationRepository {
  async create(input: CreateAttachmentAnnotationInput): Promise<AttachmentAnnotation> {
    return prisma.attachmentAnnotation.create({
      data: {
        attachmentId: input.attachmentId,
        shape: input.shape,
        positionX: input.positionX,
        positionY: input.positionY,
        width: input.width,
        height: input.height,
        text: input.text,
        createdBy: input.createdBy,
      },
    });
  }

  async findByAttachmentId(attachmentId: string): Promise<AttachmentAnnotation[]> {
    return prisma.attachmentAnnotation.findMany({ where: { attachmentId }, orderBy: { createdAt: 'asc' } });
  }
}
