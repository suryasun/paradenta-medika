import { AttachmentAnnotation } from '@prisma/client';

export interface CreateAttachmentAnnotationInput {
  attachmentId: string;
  shape: string;
  positionX: number;
  positionY: number;
  width?: number;
  height?: number;
  text?: string;
  createdBy: string;
}

export interface IAttachmentAnnotationRepository {
  create(input: CreateAttachmentAnnotationInput): Promise<AttachmentAnnotation>;
  findByAttachmentId(attachmentId: string): Promise<AttachmentAnnotation[]>;
}
