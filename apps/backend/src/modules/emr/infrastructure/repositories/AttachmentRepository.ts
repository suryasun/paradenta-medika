import { Attachment, AttachmentVersion } from '@prisma/client';
import { prisma } from '../../../../shared/infrastructure/prisma';
import {
  AddAttachmentVersionInput,
  AttachmentWithCurrentVersion,
  CreateAttachmentInput,
  IAttachmentRepository,
} from '../../domain/repositories/IAttachmentRepository';

export class AttachmentRepository implements IAttachmentRepository {
  async createWithFirstVersion(input: CreateAttachmentInput): Promise<AttachmentWithCurrentVersion> {
    return prisma.$transaction(async (tx) => {
      const attachment = await tx.attachment.create({
        data: {
          visitId: input.visitId,
          patientId: input.patientId,
          category: input.category,
          attachmentType: input.attachmentType,
          createdBy: input.createdBy,
        },
      });
      const version = await tx.attachmentVersion.create({
        data: {
          attachmentId: attachment.id,
          versionNumber: 1,
          fileName: input.file.fileName,
          storedName: input.file.storedName,
          extension: input.file.extension,
          mimeType: input.file.mimeType,
          fileSize: input.file.fileSize,
          bucket: input.file.bucket,
          objectKey: input.file.objectKey,
          checksum: input.file.checksum,
          createdBy: input.createdBy,
        },
      });
      const updated = await tx.attachment.update({
        where: { id: attachment.id },
        data: { currentVersionId: version.id },
      });
      return { ...updated, currentVersion: version };
    });
  }

  async addVersion(input: AddAttachmentVersionInput): Promise<AttachmentWithCurrentVersion> {
    return prisma.$transaction(async (tx) => {
      const latest = await tx.attachmentVersion.findFirst({
        where: { attachmentId: input.attachmentId },
        orderBy: { versionNumber: 'desc' },
      });
      const nextVersionNumber = (latest?.versionNumber ?? 0) + 1;
      const version = await tx.attachmentVersion.create({
        data: {
          attachmentId: input.attachmentId,
          versionNumber: nextVersionNumber,
          fileName: input.file.fileName,
          storedName: input.file.storedName,
          extension: input.file.extension,
          mimeType: input.file.mimeType,
          fileSize: input.file.fileSize,
          bucket: input.file.bucket,
          objectKey: input.file.objectKey,
          checksum: input.file.checksum,
          createdBy: input.createdBy,
        },
      });
      const updated = await tx.attachment.update({
        where: { id: input.attachmentId },
        data: { currentVersionId: version.id },
      });
      return { ...updated, currentVersion: version };
    });
  }

  async findById(id: string): Promise<AttachmentWithCurrentVersion | null> {
    return prisma.attachment.findUnique({ where: { id }, include: { currentVersion: true } });
  }

  async findByVisitId(visitId: string, includeArchived: boolean): Promise<AttachmentWithCurrentVersion[]> {
    return prisma.attachment.findMany({
      where: { visitId, ...(includeArchived ? {} : { archivedAt: null }) },
      include: { currentVersion: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findByPatientId(patientId: string, includeArchived: boolean): Promise<AttachmentWithCurrentVersion[]> {
    return prisma.attachment.findMany({
      where: { patientId, ...(includeArchived ? {} : { archivedAt: null }) },
      include: { currentVersion: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async archive(id: string, archivedBy: string): Promise<Attachment> {
    return prisma.attachment.update({ where: { id }, data: { archivedAt: new Date(), archivedBy } });
  }

  async findVersions(attachmentId: string): Promise<AttachmentVersion[]> {
    return prisma.attachmentVersion.findMany({ where: { attachmentId }, orderBy: { versionNumber: 'asc' } });
  }

  async findVersionByNumber(attachmentId: string, versionNumber: number): Promise<AttachmentVersion | null> {
    return prisma.attachmentVersion.findUnique({ where: { attachmentId_versionNumber: { attachmentId, versionNumber } } });
  }

  async setCurrentVersion(attachmentId: string, versionId: string): Promise<AttachmentWithCurrentVersion> {
    const updated = await prisma.attachment.update({
      where: { id: attachmentId },
      data: { currentVersionId: versionId },
      include: { currentVersion: true },
    });
    return updated;
  }
}
