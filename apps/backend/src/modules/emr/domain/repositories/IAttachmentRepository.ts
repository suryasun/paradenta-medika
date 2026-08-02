import { Attachment, AttachmentCategory, AttachmentVersion } from '@prisma/client';

export type AttachmentWithCurrentVersion = Attachment & { currentVersion: AttachmentVersion | null };

export interface UploadedFileInput {
  fileName: string;
  storedName: string;
  extension: string;
  mimeType: string;
  fileSize: number;
  bucket: string;
  objectKey: string;
  checksum: string;
}

export interface CreateAttachmentInput {
  visitId: string;
  patientId: string;
  category: AttachmentCategory;
  attachmentType?: string;
  file: UploadedFileInput;
  createdBy: string;
}

export interface AddAttachmentVersionInput {
  attachmentId: string;
  file: UploadedFileInput;
  createdBy: string;
}

export interface IAttachmentRepository {
  createWithFirstVersion(input: CreateAttachmentInput): Promise<AttachmentWithCurrentVersion>;
  addVersion(input: AddAttachmentVersionInput): Promise<AttachmentWithCurrentVersion>;
  findById(id: string): Promise<AttachmentWithCurrentVersion | null>;
  findByVisitId(visitId: string, includeArchived: boolean): Promise<AttachmentWithCurrentVersion[]>;
  findByPatientId(patientId: string, includeArchived: boolean): Promise<AttachmentWithCurrentVersion[]>;
  archive(id: string, archivedBy: string): Promise<Attachment>;
  findVersions(attachmentId: string): Promise<AttachmentVersion[]>;
  findVersionByNumber(attachmentId: string, versionNumber: number): Promise<AttachmentVersion | null>;
  setCurrentVersion(attachmentId: string, versionId: string): Promise<AttachmentWithCurrentVersion>;
}
