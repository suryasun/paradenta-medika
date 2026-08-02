export interface AttachmentVersionResponseDto {
  id: string;
  versionNumber: number;
  fileName: string;
  extension: string;
  mimeType: string;
  fileSize: number;
  checksum: string;
  createdAt: string;
  createdBy: string | null;
}

export interface AttachmentResponseDto {
  id: string;
  visitId: string;
  patientId: string;
  category: string;
  attachmentType: string | null;
  currentVersion: AttachmentVersionResponseDto | null;
  archivedAt: string | null;
  createdAt: string;
  createdBy: string | null;
}

export interface AttachmentAnnotationResponseDto {
  id: string;
  attachmentId: string;
  shape: string;
  positionX: number;
  positionY: number;
  width: number | null;
  height: number | null;
  text: string | null;
  createdAt: string;
  createdBy: string | null;
}

export interface AttachmentDetailResponseDto extends AttachmentResponseDto {
  annotations: AttachmentAnnotationResponseDto[];
}

export interface DownloadAttachmentResponseDto {
  url: string;
  expiresInSeconds: number;
}
