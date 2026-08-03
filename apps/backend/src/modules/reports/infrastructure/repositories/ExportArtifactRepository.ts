import { ExportArtifact } from '@prisma/client';
import { prisma } from '../../../../shared/infrastructure/prisma';
import { CreateExportArtifactInput, IExportArtifactRepository } from '../../domain/repositories/IExportArtifactRepository';

export class ExportArtifactRepository implements IExportArtifactRepository {
  async create(input: CreateExportArtifactInput): Promise<ExportArtifact> {
    return prisma.exportArtifact.create({
      data: {
        reportSnapshotId: input.reportSnapshotId,
        format: input.format,
        filename: input.filename,
        content: input.content,
        contentHash: input.contentHash,
        retentionUntil: input.retentionUntil,
        createdBy: input.createdBy,
      },
    });
  }

  async findById(id: string): Promise<ExportArtifact | null> {
    return prisma.exportArtifact.findUnique({ where: { id } });
  }

  async markDownloaded(id: string, downloadedAt: Date): Promise<ExportArtifact> {
    return prisma.exportArtifact.update({
      where: { id },
      data: { downloadedAt, downloadCount: { increment: 1 } },
    });
  }
}
