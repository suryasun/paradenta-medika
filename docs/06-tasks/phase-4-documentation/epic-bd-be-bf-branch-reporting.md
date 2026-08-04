# Epics BD/BE/BF: Branch Dashboard, Cross Branch Reporting, Branch Performance Monitoring — Documentation (task-218–220)

> Documented together: all three are single-task epics in the Reporting module sharing the same new `BranchAuthorizationService` and `DashboardMetricAssembler` infrastructure.

---

## Documentation Reviewed

- `docs/06-tasks/task-218.md`, `task-219.md`, `task-220.md`
- `docs/03-sad/20-module-report.md` Section 6.1 Dashboard pattern, Section 4.1 Actor Matrix (Owner: branch comparison), Section 11 TC-RPT-008 (Cross-branch dashboard request: "Scope di-intersect/ditolak sesuai user assignment")
- `docs/03-sad/14-module-queue.md` 'Manager Dashboard' (Total Queue, Average Waiting, Doctor Performance, Branch Performance)
- `docs/03-sad/16-module-billing.md` 'Reporting & Analytics' Branch Performance report item
- `phase-4-plan.md` Ambiguity #4 (no literal endpoint/schema exists for these reports)

## Task List

| Task | Name |
|---|---|
| task-218 | Branch Dashboard (`GET /reports/dashboards/branch`) |
| task-219 | Branch Comparison Report (`GET /reports/branch-comparison`) |
| task-220 | Branch Performance Report (`GET /reports/branch-performance`) |

## Implementation Plan

A new `BranchAuthorizationService` (`assertBranchInScope` / `assertBranchesInScope`) is the shared TC-RPT-008 enforcement point for all three endpoints, reading System's `IUserRoleRepository`/`IUserBranchRepository` directly (cross-module Repository Interface channel). Per the literal reading of each task's own Security Impact section, a multi-branch request (`task-219`) **rejects the whole request** (`RPT_SCOPE_FORBIDDEN`) if *any* requested branch is outside a non-cross-branch requester's authority — not a silent narrowing to the authorized subset.

- **task-218** combines `QueueDashboardUseCase.execute(branchId)` (Total Queue, Average Waiting, Doctor Performance — already built in Phase 1) with `DashboardMetricAssembler`'s existing `billing.daily-summary` metric set (moved from a local const in `GetReportUseCase.ts` to shared exports in `MetricDefinitions.ts`).
- **task-219** assembles a new curated `BRANCH_COMPARISON_METRICS` set (queue + billing + finance) once per requested branch via `Promise.all`, returning an array with the branch name resolved from `IBranchRepository`.
- **task-220** is genuinely **trended** (distinct from task-218/219's point-in-time snapshots): it calls `QueueDashboardUseCase.execute(branchId, dateStr)` and `IPaymentRepository.sumAmountForDate(date, branchId)` once per day in the requested range (max 90 days), using already-existing per-date-capable read paths rather than a `report_snapshots` time-series query capability this codebase doesn't actually have (no periodic snapshot job populates that table for this report — a real gap this task openly documents rather than papering over with a fake time-series read).

## Files Created

- `apps/backend/src/modules/reports/application/services/BranchAuthorizationService.ts` + `.test.ts`
- `apps/backend/src/modules/reports/application/use-cases/GetBranchDashboardUseCase.ts` + `.test.ts`
- `apps/backend/src/modules/reports/application/use-cases/GetBranchComparisonReportUseCase.ts` + `.test.ts`
- `apps/backend/src/modules/reports/application/use-cases/GetBranchPerformanceReportUseCase.ts` + `.test.ts`
- `apps/backend/src/modules/reports/application/dtos/BranchDashboardQueryDto.ts`, `BranchComparisonQueryDto.ts`, `BranchPerformanceQueryDto.ts`
- `apps/backend/src/modules/reports/presentation/controllers/BranchReportsController.ts`

## Files Modified

- `apps/backend/src/modules/reports/application/services/MetricDefinitions.ts` (`BILLING_REPORT_METRICS`/`BILLING_GLOBAL_METRICS` moved here from `GetReportUseCase.ts`; new `BRANCH_COMPARISON_METRICS`/`BRANCH_COMPARISON_GLOBAL_METRICS`)
- `apps/backend/src/modules/reports/application/use-cases/GetReportUseCase.ts` (imports the relocated constants instead of redeclaring them)
- `apps/backend/src/modules/reports/presentation/routes/reports.routes.ts` (three new routes; `/reports/branch-comparison`/`/reports/branch-performance` registered **before** the generic `/reports/:reportCode` catch-all, or Express would treat "branch-comparison"/"branch-performance" as a `:reportCode` value)
- `apps/backend/prisma/seed.ts` (`report.dashboard.branch.read`, `report.branch-comparison.read`, `report.branch-performance.read`)

## Database Changes

None — read-only against `dashboard_summaries` (existing) and per-date Queue/Payment queries.

## API Changes

| Endpoint | Permission |
|---|---|
| `GET /reports/dashboards/branch` | `report.dashboard.branch.read` |
| `GET /reports/branch-comparison` | `report.branch-comparison.read` |
| `GET /reports/branch-performance` | `report.branch-performance.read` |

All three return `403 RPT_SCOPE_FORBIDDEN` on an out-of-scope branch. task-220 also returns `422 RPT_FILTER_INVALID`/`RPT_RANGE_TOO_LARGE` for invalid or oversized date ranges (reusing the existing exception classes from `GetReportUseCase.ts`'s own range-limit convention).

## Frontend Changes

None — backend-only.

## Security Validation

- This is the **first time** per-user branch-assignment scope is actually enforced on any Reporting endpoint — `DashboardMetricAssembler`'s own doc comment previously documented this as an accepted Phase-4 gap ("per-user branch assignment does not exist until Phase 4"); that gap is now closed for these three new endpoints specifically. The five pre-existing Epic AG dashboards (`/reports/dashboards/executive` etc.) are unchanged and still apply `branchId` as a direct filter without scope intersection — a deliberate, narrower fix (touching only the new Phase 4 surface) rather than a broader retrofit of Phase 3's dashboards.
- `assertBranchesInScope` rejects the whole request on any single out-of-scope branch rather than silently dropping it — verified this reading against the task's own Security Impact wording, not just TC-RPT-008's more ambiguous Indonesian phrasing ("di-intersect/ditolak").

## Architecture Validation

- `BranchAuthorizationService` is Reporting's own service (not a shared cross-module utility) because it composes System's repositories the same way `BranchScopeGuard` (Epic BC) does, but as a use-case-level check rather than route middleware — required since these endpoints validate a *set* of requested branchIds, a shape `BranchScopeGuard`'s single-branchId extractor doesn't fit.
- task-220's per-day fan-out (up to 90 Queue+Payment queries per request) is an accepted simplicity-over-micro-optimization tradeoff, consistent with this codebase's existing "over-fetch for simplicity" precedent (e.g. `GetRoleBranchMatrixUseCase`'s `limit: 100` fetch-all pattern).
