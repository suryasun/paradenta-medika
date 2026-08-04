# Epic AH: Report Catalog & Scheduled Reports — Documentation (task-185–191)

---

## Documentation Reviewed

- `docs/06-tasks/task-185.md`–`task-191.md`
- `docs/03-sad/20-module-report.md` Sections 5.1, 5.3, 5.5, 6.2, 6.3, 6.4, 8.1, 8.3, 9, 10.3, 10.5

## Task List

| Task | Endpoint | Use Case | Permission |
|---|---|---|---|
| task-185 | `GET /reports/definitions` | `ListReportDefinitionsUseCase` | `report.catalog.read` |
| task-186 | `GET /reports/{reportCode}` | `GetReportUseCase` | `report.catalog.read` |
| task-187 | `POST /reports/{reportCode}/jobs` | `CreateReportJobUseCase` | `report.job.create` |
| task-188 | `GET /reports/jobs/{jobId}` | `GetReportJobUseCase` | `report.job.create` (reused) |
| task-189 | `POST /reports/jobs/{jobId}/cancel` | `CancelReportJobUseCase` | `report.job.cancel` |
| task-190 | `GET /reports/snapshots/{snapshotId}` | `GetReportSnapshotUseCase` | `report.job.create` (reused) |
| task-191 | `GET /reports/exports/{artifactId}/download` | `DownloadReportExportUseCase` | `report.export.download` |

**Permission-reuse deviation, documented in code**: `reports.routes.ts` (lines 144–149) — *"no dedicated 'read' permission exists for job-status/snapshot GETs in the catalog, so they reuse `report.job.create` (the same 'the permission that lets you start it lets you check on it' convention used elsewhere in this codebase, e.g. PO/Expense Update reusing their own Create permission)."*

## Implementation Plan

A 10-row report catalog (`ReportCatalog.ts`, per SAD §6.3) drives `ListReportDefinitionsUseCase`/`GetReportUseCase`; `CreateReportJobUseCase` executes the report **synchronously in-process**, producing a `ReportSnapshot` (with a recomputed integrity hash on every read) and, for exports, a CSV `ExportArtifact` with time-limited download and formula-injection sanitisation.

## Files Created

- `apps/backend/src/modules/reports/application/services/ReportCatalog.ts` (the literal 10-row catalog), `ReportChecksum.ts` (`computePayloadHash()`, canonical-JSON SHA-256), `ReportCsvFormatter.ts` (`toSanitizedCsv()`, TC-RPT-014)
- `apps/backend/src/modules/reports/application/dtos/ReportCatalogQueryDto.ts`, `CreateReportJobRequestDto.ts`
- `apps/backend/src/modules/reports/application/use-cases/ListReportDefinitionsUseCase.ts`, `GetReportUseCase.ts`, `CreateReportJobUseCase.ts`, `GetReportJobUseCase.ts`, `CancelReportJobUseCase.ts`, `GetReportSnapshotUseCase.ts`, `DownloadReportExportUseCase.ts`
- `apps/backend/src/modules/reports/application/use-cases/ReportCatalog.test.ts`, `ReportJobLifecycle.test.ts`
- `apps/backend/src/modules/reports/application/services/ReportChecksum.test.ts`
- `apps/backend/src/modules/reports/domain/repositories/IReportJobRepository.ts`, `IReportSnapshotRepository.ts`, `IExportArtifactRepository.ts`
- `apps/backend/src/modules/reports/domain/exceptions/ReportExceptions.ts`
- `apps/backend/src/modules/reports/infrastructure/repositories/ReportJobRepository.ts`, `ReportSnapshotRepository.ts`, `ExportArtifactRepository.ts`
- `apps/backend/src/modules/reports/presentation/controllers/ReportCatalogController.ts`, `ReportJobController.ts`

## Files Modified

- `reports.routes.ts` (lines 144–164; explicit ordering note — Phase 4's literal `/reports/branch-comparison` and `/reports/branch-performance` paths must register **before** the generic `/reports/:reportCode` catch-all)
- `schema.prisma` (`ReportJob`, `ReportSnapshot`, `ExportArtifact`), `openapi.yaml`

## Database Changes

- `ReportJob` → `report_jobs`: `id`, `reportName`, `requestedBy`, `generatedBy?`, `branchScope` (Json), `parameters` (Json, mapped `parameters_json`), `status` (`ReportJobStatus` enum, default `QUEUED`), `startedAt?`, `finishedAt?`, `idempotencyKey?` (unique), `errorCode?`, `errorMessage?`; index on `status`.
- `ReportSnapshot` → `report_snapshots`: `id`, `reportJobId?`, `snapshotDate`, `module`, `definitionVersion`, `sourceWatermark`, `scopeHash`, `payload` (Json), `payloadUri?`, `payloadHash`, `rowCount?`, `schemaVersion`, `retentionUntil?`. Doc comment: *"Epic AH executes jobs synchronously in-process (no job-queue worker exists in this codebase)... `payload` stores the computed report result directly as relational JSON rather than a pointer into external object storage — Section 5.3's own text explicitly permits this."*
- `ExportArtifact` → `export_artifacts`: `id`, `reportSnapshotId`, `format`, `filename`, `content` (LongText), `contentHash`, `retentionUntil`, `createdBy?`, `downloadedAt?`, `downloadCount` (default 0). Doc comment: only CSV is generated — no XLSX/PDF library exists as a project dependency, and introducing one is out of scope per `CLAUDE.md`'s "never introduce a new library without explicit approval."

## API Changes

| Method | Path | Permission | Status codes |
|---|---|---|---|
| GET | `/reports/definitions` | `report.catalog.read` | 200 |
| GET | `/reports/{reportCode}` | `report.catalog.read` | 200, 400, 403 (`RPT_SCOPE_FORBIDDEN`), 404 (`RPT_DEFINITION_NOT_FOUND`), 422 (`RPT_FILTER_INVALID`/`RPT_RANGE_TOO_LARGE`), 503 (`RPT_DATASET_UNAVAILABLE`) |
| POST | `/reports/{reportCode}/jobs` | `report.job.create` | 201, 400, 403, 404, 409 (`RPT_JOB_DUPLICATE`), 422 |
| GET | `/reports/jobs/{jobId}` | `report.job.create` | 200, 404 |
| POST | `/reports/jobs/{jobId}/cancel` | `report.job.cancel` | 200, 404 |
| GET | `/reports/snapshots/{snapshotId}` | `report.job.create` | 200, 404, 409 (`RPT_SNAPSHOT_TAMPERED`) |
| GET | `/reports/exports/{artifactId}/download` | `report.export.download` | 200 (text/csv), 404, 410 (`RPT_EXPORT_EXPIRED`) |

All 7 confirmed identically in `reports.routes.ts` and `openapi.yaml` (lines 2854–3007).

## Frontend Changes

None — `grep -rn "task-18[5-9]|task-19[01]"` across `apps/frontend` returns zero matches. Matches every task's own Frontend Scope text.

## Security Validation

- **Report catalog contents** (`ReportCatalog.ts`, 10 rows): `operations.queue-performance`, `clinical.visit-summary`, `billing.daily-summary`, `finance.trial-balance`, `finance.income-statement`, `inventory.stock-card`, `inventory.expiry` are all implemented; `hr.attendance`, `hr.payroll-register`, `system.activity-audit` are **not implemented** ("no HR module/events exist anywhere in this codebase, and the audit-log query capability is Epic AI's own scope, not yet built" at the time this catalog was written). Unimplemented codes still appear in `/reports/definitions` (permission-filtered only) but `GetReportUseCase` returns `RPT_DATASET_UNAVAILABLE` (503) for them at query time — an honest runtime signal, not a silent omission.
- **Error catalog** (`ReportExceptions.ts`) matches SAD §6.4 literally: `ReportDefinitionNotFoundException`, `ReportScopeForbiddenException` (`RPT_SCOPE_FORBIDDEN`), `ReportFilterInvalidException` (`RPT_FILTER_INVALID`), `ReportRangeTooLargeException` (`RPT_RANGE_TOO_LARGE`), `ReportJobDuplicateException` (`RPT_JOB_DUPLICATE`, 409), `ReportJobNotFoundException`, `ReportJobNotReadyException` (`RPT_JOB_NOT_READY`, 409 — **defined but never thrown anywhere in the use cases reviewed**; since jobs execute synchronously and complete before the POST returns, this AC-listed status is unreachable dead code, not a missing enforcement), `ReportExportExpiredException` (`RPT_EXPORT_EXPIRED`, 410), `ReportDatasetUnavailableException` (`RPT_DATASET_UNAVAILABLE`, 503), `ReportSnapshotNotFoundException`, `ReportSnapshotTamperedException` (`RPT_SNAPSHOT_TAMPERED`, 409), `ReportExportArtifactNotFoundException`.
- **Idempotency (TC-RPT-012)**: `CreateReportJobUseCase.buildIdempotencyKey()` — SHA-256 hash of `reportCode|branchId|dateFrom|dateTo|periodId|warehouseId|itemId|status|format`. Doc comment notes a caught bug where an earlier version omitted `status`/`warehouseId`/`itemId`/`periodId`, causing two genuinely different requests to collide. On retry: `RUNNING`/`QUEUED` existing job → `RPT_JOB_DUPLICATE`; `COMPLETED` → returns the existing job (idempotent); `FAILED`/`CANCELLED` → allowed a fresh retry under a derived key.
- **Snapshot integrity (TC-RPT-015)**: `ReportChecksum.computePayloadHash()` — SHA-256 over a recursively key-sorted, Date-normalized canonical JSON form, necessary because a plain `JSON.stringify` is not stable across a MySQL JSON column round-trip (a real bug caught during live verification). `GetReportSnapshotUseCase.execute()` recomputes the hash on every read and throws `ReportSnapshotTamperedException` on mismatch.
- **Export sanitisation (TC-RPT-014) and audit (TC-RPT-018)**: sanitisation happens at artifact-**creation** time (`CreateReportJobUseCase` via `ReportCsvFormatter.toSanitizedCsv()`), not at download time. `DownloadReportExportUseCase.execute()` records an audit entry on both the expired-artifact path (`outcome: EXPIRED`) and the successful-download path (`outcome: DOWNLOADED`, includes format/filename) — satisfying TC-RPT-018's "actor/scope/artifact/outcome" requirement.

## Architecture Validation

**Architectural deviation from SAD §5.5 (async architecture), documented in code**: `CreateReportJobUseCase.ts`'s doc comment (lines 51–63) states jobs execute **synchronously in-process**, not asynchronously via a job-queue worker, because "this codebase has no job-queue worker (no message broker/background-processing dependency exists anywhere yet)." A job lands directly in `COMPLETED` or `FAILED` within the same request. Explicitly flagged as "a documented simplification, not the literal async architecture Section 5.5 describes; a real worker can replace this method body later without changing the job/snapshot schema or the public contract" — the same note is repeated in `openapi.yaml` and `schema.prisma`. The public contract (schema, endpoints, status values) matches the spec even though the actual execution model differs materially.
