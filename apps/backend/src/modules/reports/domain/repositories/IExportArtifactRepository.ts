import { ExportArtifact } from '@prisma/client';

export interface CreateExportArtifactInput {
  reportSnapshotId: string;
  format: string;
  filename: string;
  content: string;
  contentHash: string;
  retentionUntil: Date;
  createdBy?: string;
}

export interface IExportArtifactRepository {
  create(input: CreateExportArtifactInput): Promise<ExportArtifact>;
  findById(id: string): Promise<ExportArtifact | null>;
  markDownloaded(id: string, downloadedAt: Date): Promise<ExportArtifact>;
}
