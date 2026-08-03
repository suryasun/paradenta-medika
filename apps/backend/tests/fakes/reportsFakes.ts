import { ExportArtifact, ReportJob, ReportJobStatus, ReportSnapshot } from '@prisma/client';
import {
  DashboardMetricRow,
  IDashboardSummaryRepository,
  UpsertMetricInput,
} from '../../src/modules/reports/domain/repositories/IDashboardSummaryRepository';
import { IProjectionCheckpointRepository } from '../../src/modules/reports/domain/repositories/IProjectionCheckpointRepository';
import { CreateReportJobInput, IReportJobRepository } from '../../src/modules/reports/domain/repositories/IReportJobRepository';
import { CreateReportSnapshotInput, IReportSnapshotRepository } from '../../src/modules/reports/domain/repositories/IReportSnapshotRepository';
import { CreateExportArtifactInput, IExportArtifactRepository } from '../../src/modules/reports/domain/repositories/IExportArtifactRepository';
import { nextFakeUuid } from './uuid';

export class FakeDashboardSummaryRepository implements IDashboardSummaryRepository {
  rows: DashboardMetricRow[] = [];

  private find(metricCode: string, branchId: string | null, dimensionKey: string) {
    return this.rows.find((r) => r.metricCode === metricCode && r.branchId === branchId && r.dimensionKey === dimensionKey);
  }

  async upsertIncrement(input: UpsertMetricInput): Promise<void> {
    const dimensionKey = input.dimensionKey ?? '';
    const existing = this.find(input.metricCode, input.branchId, dimensionKey);
    if (existing) {
      existing.value += input.value;
      existing.dataAsOf = input.dataAsOf;
      existing.definitionVersion = input.definitionVersion;
      if (input.currency) existing.currency = input.currency;
      return;
    }
    this.rows.push({
      metricCode: input.metricCode,
      branchId: input.branchId,
      dimensionKey,
      value: input.value,
      currency: input.currency ?? null,
      dataAsOf: input.dataAsOf,
      definitionVersion: input.definitionVersion,
    });
  }

  async upsertSet(input: UpsertMetricInput): Promise<void> {
    const dimensionKey = input.dimensionKey ?? '';
    const existing = this.find(input.metricCode, input.branchId, dimensionKey);
    if (existing) {
      existing.value = input.value;
      existing.dataAsOf = input.dataAsOf;
      existing.definitionVersion = input.definitionVersion;
      if (input.currency) existing.currency = input.currency;
      return;
    }
    this.rows.push({
      metricCode: input.metricCode,
      branchId: input.branchId,
      dimensionKey,
      value: input.value,
      currency: input.currency ?? null,
      dataAsOf: input.dataAsOf,
      definitionVersion: input.definitionVersion,
    });
  }

  async listByCodes(metricCodes: string[], branchId?: string | null): Promise<DashboardMetricRow[]> {
    return this.rows.filter((r) => metricCodes.includes(r.metricCode) && (branchId === undefined || r.branchId === branchId));
  }
}

export class FakeProjectionCheckpointRepository implements IProjectionCheckpointRepository {
  claimed = new Set<string>();

  async claim(consumerName: string, sourceKey: string): Promise<boolean> {
    const key = `${consumerName}::${sourceKey}`;
    if (this.claimed.has(key)) return false;
    this.claimed.add(key);
    return true;
  }
}

export class FakeReportJobRepository implements IReportJobRepository {
  jobs = new Map<string, ReportJob>();

  async create(input: CreateReportJobInput): Promise<ReportJob> {
    const job: ReportJob = {
      id: nextFakeUuid(),
      reportName: input.reportName,
      requestedBy: input.requestedBy,
      generatedBy: null,
      branchScope: input.branchScope as never,
      parameters: input.parameters as never,
      status: 'RUNNING',
      startedAt: new Date(),
      finishedAt: null,
      idempotencyKey: input.idempotencyKey,
      errorCode: null,
      errorMessage: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as ReportJob;
    this.jobs.set(job.id, job);
    return job;
  }

  async findById(id: string): Promise<ReportJob | null> {
    return this.jobs.get(id) ?? null;
  }

  async findByIdempotencyKey(idempotencyKey: string): Promise<ReportJob | null> {
    return [...this.jobs.values()].find((j) => j.idempotencyKey === idempotencyKey) ?? null;
  }

  async markStatus(
    id: string,
    status: ReportJobStatus,
    fields?: { startedAt?: Date; finishedAt?: Date; errorCode?: string; errorMessage?: string },
  ): Promise<ReportJob> {
    const job = this.jobs.get(id);
    if (!job) throw new Error('not found');
    job.status = status;
    if (fields?.startedAt) job.startedAt = fields.startedAt;
    if (fields?.finishedAt) job.finishedAt = fields.finishedAt;
    if (fields?.errorCode) job.errorCode = fields.errorCode;
    if (fields?.errorMessage) job.errorMessage = fields.errorMessage;
    return job;
  }
}

export class FakeReportSnapshotRepository implements IReportSnapshotRepository {
  snapshots = new Map<string, ReportSnapshot>();

  async create(input: CreateReportSnapshotInput): Promise<ReportSnapshot> {
    const snapshot: ReportSnapshot = {
      id: nextFakeUuid(),
      reportJobId: input.reportJobId ?? null,
      snapshotDate: input.snapshotDate,
      module: input.module,
      definitionVersion: input.definitionVersion,
      sourceWatermark: input.sourceWatermark,
      scopeHash: input.scopeHash,
      payload: input.payload as never,
      payloadUri: null,
      payloadHash: input.payloadHash,
      rowCount: input.rowCount ?? null,
      schemaVersion: input.schemaVersion,
      retentionUntil: input.retentionUntil ?? null,
      createdAt: new Date(),
    } as ReportSnapshot;
    this.snapshots.set(snapshot.id, snapshot);
    return snapshot;
  }

  async findById(id: string): Promise<ReportSnapshot | null> {
    return this.snapshots.get(id) ?? null;
  }
}

export class FakeExportArtifactRepository implements IExportArtifactRepository {
  artifacts = new Map<string, ExportArtifact>();

  async create(input: CreateExportArtifactInput): Promise<ExportArtifact> {
    const artifact: ExportArtifact = {
      id: nextFakeUuid(),
      reportSnapshotId: input.reportSnapshotId,
      format: input.format,
      filename: input.filename,
      content: input.content,
      contentHash: input.contentHash,
      retentionUntil: input.retentionUntil,
      createdAt: new Date(),
      createdBy: input.createdBy ?? null,
      downloadedAt: null,
      downloadCount: 0,
    } as ExportArtifact;
    this.artifacts.set(artifact.id, artifact);
    return artifact;
  }

  async findById(id: string): Promise<ExportArtifact | null> {
    return this.artifacts.get(id) ?? null;
  }

  async markDownloaded(id: string, downloadedAt: Date): Promise<ExportArtifact> {
    const artifact = this.artifacts.get(id);
    if (!artifact) throw new Error('not found');
    artifact.downloadedAt = downloadedAt;
    artifact.downloadCount += 1;
    return artifact;
  }
}
