import { Attachment, AttachmentAnnotation, AttachmentVersion } from '@prisma/client';
import { AttachmentAnnotationResponseDto, AttachmentResponseDto, AttachmentVersionResponseDto } from '../dtos/AttachmentResponseDto';

export function toAttachmentVersionResponseDto(version: AttachmentVersion): AttachmentVersionResponseDto {
  return {
    id: version.id,
    versionNumber: version.versionNumber,
    fileName: version.fileName,
    extension: version.extension,
    mimeType: version.mimeType,
    fileSize: version.fileSize,
    checksum: version.checksum,
    createdAt: version.createdAt.toISOString(),
    createdBy: version.createdBy,
  };
}

export function toAttachmentResponseDto(attachment: Attachment & { currentVersion: AttachmentVersion | null }): AttachmentResponseDto {
  return {
    id: attachment.id,
    visitId: attachment.visitId,
    patientId: attachment.patientId,
    category: attachment.category,
    attachmentType: attachment.attachmentType,
    currentVersion: attachment.currentVersion ? toAttachmentVersionResponseDto(attachment.currentVersion) : null,
    archivedAt: attachment.archivedAt ? attachment.archivedAt.toISOString() : null,
    createdAt: attachment.createdAt.toISOString(),
    createdBy: attachment.createdBy,
  };
}

export function toAttachmentAnnotationResponseDto(annotation: AttachmentAnnotation): AttachmentAnnotationResponseDto {
  return {
    id: annotation.id,
    attachmentId: annotation.attachmentId,
    shape: annotation.shape,
    positionX: annotation.positionX,
    positionY: annotation.positionY,
    width: annotation.width,
    height: annotation.height,
    text: annotation.text,
    createdAt: annotation.createdAt.toISOString(),
    createdBy: annotation.createdBy,
  };
}
