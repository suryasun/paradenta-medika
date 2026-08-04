# Epic AG: Advanced Reporting — Dashboards — Documentation (task-178–184)

---

## Documentation Reviewed

- `docs/06-tasks/task-178.md`–`task-184.md`
- `docs/03-sad/20-module-report.md` Sections 2.4, 2.5, 3.3, 4.2–4.7, 6.1, 7.2, 8.2
- `docs/06-tasks/phase-3-plan.md` Ambiguity #5 (Reporting module's literal source-event names not enumerated with field-level schema anywhere reviewed)

## Task List

| Task | Endpoint | Permission | Status |
|---|---|---|---|
| task-178 | (infrastructure, no endpoint) — projection/checkpoint scaffold | — | Done |
| task-179 | `GET /reports/dashboards/executive` | `report.dashboard.executive.read` | Done |
| task-180 | `GET /reports/dashboards/operations` | `report.dashboard.operations.read` | Done |
| task-181 | `GET /reports/dashboards/clinical` | `report.dashboard.clinical.read` | Done |
| task-182 | `GET /reports/dashboards/finance` | `report.dashboard.finance.read` | Done |
| task-183 | `GET /reports/dashboards/warehouse` | `report.dashboard.warehouse.read` | Done |
| task-184 | `GET /reports/dashboards/hr` | `report.dashboard.hr.read` | **Not implemented** |

## task-184 (HR Dashboard) is not implemented — confirmed, not silently marked done

- `apps/backend/src/modules/reports/presentation/routes/reports.routes.ts` (lines 61–71) carries an explicit doc comment: *"task-184 (HR Dashboard) is deferred: no HR module or HR domain events exist anywhere in this codebase yet, the same 'genuinely blocked, skip and defer' resolution already applied to task-136/task-162."*
- `apps/backend/openapi.yaml` (lines 2778–2780) repeats the same deferral note; no `/reports/dashboards/hr` path exists in the spec.
- No `report.dashboard.hr.read` permission string exists anywhere in `apps/backend/prisma/seed.ts`.
- No `GetHrDashboardUseCase.ts` file exists.
- `GetExecutiveDashboardUseCase.ts`'s own doc comment states payroll cost is omitted from the Executive dashboard for the same reason ("no HR module/events exist in this codebase").

## Implementation Plan

`registerDashboardProjections.ts` (task-178) subscribes the read-model to 8 cross-module events; each of the five implemented dashboards (task-179–183) reads pre-aggregated `DashboardSummary` rows through a shared `DashboardMetricAssembler` service rather than querying source-module tables live.

## Files Created

- `apps/backend/src/modules/reports/domain/repositories/IDashboardSummaryRepository.ts`, `IProjectionCheckpointRepository.ts`
- `apps/backend/src/modules/reports/application/services/MetricDefinitions.ts` (metric-definition/version registry, `DEFINITION_VERSION = '1.0.0'`, per-dashboard metric-code lists), `DashboardMetricAssembler.ts`
- `apps/backend/src/modules/reports/application/projections/registerDashboardProjections.ts`
- `apps/backend/src/modules/reports/application/dtos/DashboardQueryDto.ts`, `DashboardResponseDto.ts`
- `apps/backend/src/modules/reports/application/use-cases/GetExecutiveDashboardUseCase.ts`, `GetOperationsDashboardUseCase.ts`, `GetClinicalDashboardUseCase.ts`, `GetFinanceDashboardUseCase.ts`, `GetWarehouseDashboardUseCase.ts`
- `apps/backend/src/modules/reports/application/projections/DashboardProjections.test.ts`, `application/use-cases/Dashboards.test.ts`
- `apps/backend/src/modules/reports/infrastructure/repositories/DashboardSummaryRepository.ts`, `ProjectionCheckpointRepository.ts`
- `apps/backend/src/modules/reports/presentation/controllers/DashboardController.ts`

## Files Modified

- `apps/backend/src/modules/reports/presentation/routes/reports.routes.ts` (composition root for all of Epic AG + AH)
- `apps/backend/prisma/schema.prisma` (`DashboardSummary` → `dashboard_summaries`, `ReportProjectionCheckpoint` → `report_projection_checkpoints`)
- `apps/backend/openapi.yaml`, `apps/backend/prisma/seed.ts`

## Database Changes

- `DashboardSummary`: `metricCode`, `branchId?`, `dimensionKey` (default `""`), `value Decimal(18,2)`, `currency?`, `dataAsOf`, `freshness` (string, default `"fresh"`), `definitionVersion`; unique on `(metricCode, branchId, dimensionKey)`.
- `ReportProjectionCheckpoint`: `consumerName`, `sourceKey`, `processedAt`; unique on `(consumerName, sourceKey)` — this doubles as the idempotency/dedup mechanism (see below).
- Schema comment explicitly notes `metric_definitions` (a SAD §5.1 "recommended supporting" table) was **deliberately not built** — kept as the in-code `MetricDefinitions.ts` registry instead, to keep this epic's scope bounded.

## API Changes

| Method | Path | Permission |
|---|---|---|
| GET | `/reports/dashboards/executive` | `report.dashboard.executive.read` |
| GET | `/reports/dashboards/operations` | `report.dashboard.operations.read` |
| GET | `/reports/dashboards/clinical` | `report.dashboard.clinical.read` |
| GET | `/reports/dashboards/finance` | `report.dashboard.finance.read` |
| GET | `/reports/dashboards/warehouse` | `report.dashboard.warehouse.read` |

No `/reports/dashboards/hr` route exists. All 5 confirmed identically in `reports.routes.ts` and `openapi.yaml` (lines 2782–2845).

## Frontend Changes

None — `grep -rn "task-1[789][0-9]"` across `apps/frontend` returns zero matches. Matches every task's own Frontend Scope text ("No dedicated page in this task; backend-only").

## Security Validation

- `DashboardMetricAssembler.ts`'s own doc comment flags that the Security Impact text ("cross-branch access intersected with the requester's assigned branch scope") is **not enforced** in this epic — per-user branch assignment doesn't exist until Phase 4 (task-210+). `branchId` is applied as a direct query filter, not intersected against an authorized scope, "the exact same documented gap already accepted for task-059's `OperationsDashboardUseCase`" (Phase 1).
- Every response carries `scope`, `dataAsOf`, `freshness`, `definitionVersion`, `metrics` (per `DashboardResponseDto.ts`). **Discrepancy found:** task-179–184's Acceptance Criteria literally require freshness values `fresh`/`stale`/`partial` (TC-RPT-004), but the actual implemented `DashboardFreshness` type is only `'fresh' | 'partial'` — `'stale'` is never produced or typed anywhere in code. This is not flagged as an accepted gap in any code comment; it is a silently narrower implementation than the AC text, recorded here for visibility.

## Architecture Validation

- TC-RPT-001/002/003 (never double-count on duplicate/out-of-order event delivery) is satisfied via a **unique-constraint claim**, not an event-id/outbox table: `IProjectionCheckpointRepository.claim(consumerName, sourceKey): Promise<boolean>` atomically records the pair and returns `false` if already processed; `ProjectionCheckpointRepository`'s Prisma implementation catches the `P2002` unique-violation error and returns `false` on duplicate. The schema doc-comment explains this consolidates the SAD's separate "inbox idempotency record" (§2.4) and "checkpoint" (§5.4) concepts into one table, because the in-process `EventBus.ts` has no `eventId` on payloads (no durable outbox exists yet — documented future work). `sourceKey` is instead a natural per-event domain identifier (e.g. `journalId`, `visitId`, or composites like `${invoiceId}:${occurredAt}`). Verified by `DashboardProjections.test.ts`'s explicit "duplicate republish does not double count" test.
- Ambiguity #5 (literal source-event names) is **not formally closed with a cross-check registry** — `registerDashboardProjections.ts` subscribes to 5 imported published event constants (`PATIENT_REGISTERED_EVENT`, `RESERVATION_CREATED_EVENT`/`RESERVATION_CANCELLED_EVENT`, `QUEUE_CREATED_EVENT`/`QUEUE_CALLED_EVENT`/`QUEUE_COMPLETED_EVENT`, `EMR_FINISHED_EVENT`, `PAYMENT_COMPLETED_EVENT`) plus 5 unimported string-literal event names for Finance/Warehouse (`'finance.journal.posted.v1'`, `'finance.journal.reversed.v1'`, `'warehouse.goods-receipt.posted.v1'`, `'warehouse.stock-adjusted.v1'`, `'warehouse.stock-opname-approved.v1'`), with no explicit comment confirming those five unimported literals were cross-checked against Finance/Warehouse's actual published constants. Task-178's own Definition of Done leaves this as an ongoing flag rather than a resolved item.
