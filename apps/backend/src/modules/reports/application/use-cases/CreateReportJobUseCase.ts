import { createHash } from 'crypto';
import { ReportJob } from '@prisma/client';
import { IReportJobRepository } from '../../domain/repositories/IReportJobRepository';
import { IReportSnapshotRepository } from '../../domain/repositories/IReportSnapshotRepository';
import { IExportArtifactRepository } from '../../domain/repositories/IExportArtifactRepository';
import { GetReportUseCase } from './GetReportUseCase';
import { computePayloadHash } from '../services/ReportChecksum';
import { toSanitizedCsv } from '../services/ReportCsvFormatter';
import { findReportDefinition } from '../services/ReportCatalog';
import { DEFINITION_VERSION } from '../services/MetricDefinitions';
import { ReportFilterInvalidException, ReportJobDuplicateException } from '../../domain/exceptions/ReportExceptions';

export interface CreateReportJobInput {
  reportCode: string;
  filters?: {
    branchIds?: string[];
    dateFrom?: string;
    dateTo?: string;
    periodId?: string;
    warehouseId?: string;
    itemId?: string;
    status?: string;
  };
  format?: 'csv' | 'json';
  actorUserId: string;
  requesterPermissions: string[];
}

const EXPORT_RETENTION_HOURS = 24;

export function buildIdempotencyKey(input: CreateReportJobInput, branchIds: string[] = []): string {
  // Every filter field that can change the report's result must be part of the
  // key -- an earlier version omitted status/warehouseId/itemId/periodId, which
  // caused two genuinely different requests to collide and the second one to
  // wrongly short-circuit to the first's stale result (caught during this
  // task's live verification).
  // Phase 4 hardening: `branchIds` replaces the old single `branchId?`
  // parameter so branch.comparison's multi-branch jobs get a stable,
  // order-independent key (sorted + joined) -- for every pre-existing
  // single-branch caller this produces the exact same string as before
  // (a one-element sorted array joins to that element; an empty array
  // joins to '', matching the old `branchId ?? ''`).
  const raw = [
    input.reportCode,
    branchIds.slice().sort().join(','),
    input.filters?.dateFrom ?? '',
    input.filters?.dateTo ?? '',
    input.filters?.periodId ?? '',
    input.filters?.warehouseId ?? '',
    input.filters?.itemId ?? '',
    input.filters?.status ?? '',
    input.format ?? 'json',
  ].join('|');
  return createHash('sha256').update(raw).digest('hex');
}

/**
 * docs/06-tasks/task-187.md: `CreateReportJobUseCase`. This codebase has
 * no job-queue worker (no message broker/background-processing
 * dependency exists anywhere yet -- see EventBus.ts's own "future
 * migration path" note), so the job is executed synchronously in-process
 * via `GetReportUseCase` -- reusing the exact same catalog/permission/
 * range validation and per-code dispatch as the on-demand endpoint
 * (task-186) rather than a second implementation -- and lands directly
 * in COMPLETED or FAILED. This is a documented simplification, not the
 * literal async architecture Section 5.5 describes; a real worker can
 * replace this method body later without changing the job/snapshot
 * schema or the public contract.
 */
export class CreateReportJobUseCase {
  constructor(
    private readonly reportJobRepository: IReportJobRepository,
    private readonly reportSnapshotRepository: IReportSnapshotRepository,
    private readonly exportArtifactRepository: IExportArtifactRepository,
    private readonly getReportUseCase: GetReportUseCase,
  ) {}

  async execute(input: CreateReportJobInput): Promise<{ job: ReportJob; snapshotId?: string; artifactId?: string }> {
    if (input.filters?.branchIds !== undefined && !Array.isArray(input.filters.branchIds)) {
      throw new ReportFilterInvalidException('filters.branchIds must be an array');
    }
    // Phase 4 hardening: `definition` is looked up before the branch-count
    // check (moved up from where it used to be looked up, further down,
    // for the snapshot's `module` field only) so branch.comparison's
    // `supportsMultiBranch` flag can lift the single-branch cap for that
    // report specifically, without loosening it for every other report code.
    const definition = findReportDefinition(input.reportCode);
    const branchIds = input.filters?.branchIds ?? [];
    if (branchIds.length > 1 && !definition?.supportsMultiBranch) {
      throw new ReportFilterInvalidException('Only a single branchId is supported per report job in this deployment');
    }
    const branchId = definition?.supportsMultiBranch ? undefined : branchIds[0];

    // Request-shape validation (unknown code / forbidden / oversized range) happens
    // BEFORE any report_jobs row is created, so it surfaces as a normal HTTP error on
    // this POST, not as a FAILED job -- see GetReportUseCase.validate's doc comment.
    this.getReportUseCase.validate(
      input.reportCode,
      { branchId, branchIds: definition?.supportsMultiBranch ? branchIds : undefined, dateFrom: input.filters?.dateFrom, dateTo: input.filters?.dateTo },
      input.requesterPermissions,
    );

    const idempotencyKey = buildIdempotencyKey(input, branchIds);

    const existing = await this.reportJobRepository.findByIdempotencyKey(idempotencyKey);
    if (existing) {
      if (existing.status === 'RUNNING' || existing.status === 'QUEUED') {
        throw new ReportJobDuplicateException();
      }
      if (existing.status === 'COMPLETED') {
        return { job: existing };
      }
      // FAILED/CANCELLED: allow a fresh retry under a derived key rather than being
      // permanently blocked by the unique constraint on a terminal, non-successful job.
    }

    const job = await this.reportJobRepository.create({
      reportName: input.reportCode,
      requestedBy: input.actorUserId,
      branchScope: branchIds,
      parameters: { filters: input.filters ?? {}, format: input.format ?? 'json' },
      idempotencyKey: existing ? `${idempotencyKey}:${Date.now()}` : idempotencyKey,
    });

    try {
      const result = await this.getReportUseCase.execute(
        input.reportCode,
        {
          branchId,
          branchIds: definition?.supportsMultiBranch ? branchIds : undefined,
          dateFrom: input.filters?.dateFrom,
          dateTo: input.filters?.dateTo,
          periodId: input.filters?.periodId,
          warehouseId: input.filters?.warehouseId,
          itemId: input.filters?.itemId,
          status: input.filters?.status,
        },
        input.requesterPermissions,
        input.actorUserId,
      );

      const payloadHash = computePayloadHash(result);
      const retentionUntil = new Date(Date.now() + EXPORT_RETENTION_HOURS * 60 * 60 * 1000);
      const snapshot = await this.reportSnapshotRepository.create({
        reportJobId: job.id,
        snapshotDate: new Date(),
        module: definition?.ownerModule ?? 'reporting',
        definitionVersion: DEFINITION_VERSION,
        sourceWatermark: new Date().toISOString(),
        scopeHash: idempotencyKey,
        payload: result,
        payloadHash,
        rowCount: Array.isArray(result) ? result.length : undefined,
        schemaVersion: DEFINITION_VERSION,
        retentionUntil,
      });

      let artifactId: string | undefined;
      if ((input.format ?? 'json') === 'csv') {
        const csv = toSanitizedCsv(result);
        const artifact = await this.exportArtifactRepository.create({
          reportSnapshotId: snapshot.id,
          format: 'csv',
          filename: `${input.reportCode}.csv`,
          content: csv,
          contentHash: computePayloadHash(csv),
          retentionUntil,
          createdBy: input.actorUserId,
        });
        artifactId = artifact.id;
      }

      const completed = await this.reportJobRepository.markStatus(job.id, 'COMPLETED', { finishedAt: new Date() });
      return { job: completed, snapshotId: snapshot.id, artifactId };
    } catch (error) {
      // docs/03-sad/20-module-report.md Section 9: "Required source unavailable ->
      // Job fails safely/no false complete output" -- the job resource was created
      // successfully, so its own execution failure is recorded on the job (FAILED,
      // errorCode/errorMessage) rather than propagated as an HTTP error from this
      // POST; the caller observes the failure via GET /reports/jobs/{jobId}.
      const message = error instanceof Error ? error.message : 'Unknown error';
      const code = (error as { code?: string })?.code ?? 'RPT_JOB_FAILED';
      const failed = await this.reportJobRepository.markStatus(job.id, 'FAILED', { finishedAt: new Date(), errorCode: code, errorMessage: message });
      return { job: failed };
    }
  }
}
