# task-189: Cancel Report Job (POST /reports/jobs/{jobId}/cancel)

**Phase:** Phase 3 - Operational Excellence
**Epic:** AH. Report Catalog & Scheduled Reports
**Feature:** AH2. Scheduled Reports (Async Jobs)
**Module:** Reporting
**Priority:** P2 - Medium

---

## Business Goal

Implement `CancelReportJobUseCase` per docs/03-sad/20-module-report.md Section 6.2, when the job type supports cancellation.

## Depends On

- task-187 (Create Report Job)

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md, docs/04-ai-contract/04-api-contract.md, docs/04-ai-contract/09-security-contract.md
- **PRD:** docs/01-prd/features/reporting.md, docs/01-prd/business-rules.md § 9
- **SAD:** docs/03-sad/20-module-report.md (Section 6.2 Report Query and Jobs)
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-187, task-013, task-014, task-006.

## Backend Scope

- Presentation layer: route, controller for `POST /reports/jobs/{jobId}/cancel`.
- Application layer: `CancelReportJobUseCase`, best-effort per Section 10.5 Operational Runbook semantics.

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

Updates report_jobs status to cancelled (when supported).

## API Impact

Adds POST /reports/jobs/{jobId}/cancel.

## Workflow Impact

Operational control over the Scheduled Reports automation.

## Security Impact

Gated by the report code's permission. Audit Trail entry required.

## Testing Required

- Unit tests for the Use Case/Entity (per docs/05-testing/unit-tests.md).
- Integration test for Controller/Repository (per docs/05-testing/api-tests.md).

## Deliverables

- `CancelReportJobUseCase`, route, controller, tests

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/reporting.md (sourced from docs/03-sad/20-module-report.md):

- Cancel on an already-completed job is a no-op, not an error.

## Definition of Done

Endpoint implemented and tested.

---

## Dependency Detail

- **Blocked By:** task-187
- **Required Before:** See phase-3-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
