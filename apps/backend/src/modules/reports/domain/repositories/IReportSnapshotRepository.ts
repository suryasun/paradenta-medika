import { ReportSnapshot } from '@prisma/client';

export interface CreateReportSnapshotInput {
  reportJobId?: string;
  snapshotDate: Date;
  module: string;
  definitionVersion: string;
  sourceWatermark: string;
  scopeHash: string;
  payload: unknown;
  payloadHash: string;
  rowCount?: number;
  schemaVersion: string;
  retentionUntil?: Date;
}

export interface IReportSnapshotRepository {
  create(input: CreateReportSnapshotInput): Promise<ReportSnapshot>;
  findById(id: string): Promise<ReportSnapshot | null>;
}
