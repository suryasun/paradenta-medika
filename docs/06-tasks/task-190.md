# task-190: Report Snapshot (GET /reports/snapshots/{snapshotId})

**Phase:** Phase 3 - Operational Excellence
**Epic:** AH. Report Catalog & Scheduled Reports
**Feature:** AH2. Scheduled Reports (Async Jobs)
**Module:** Reporting
**Priority:** P2 - Medium

---

## Business Goal

Implement `GetReportSnapshotUseCase` exposing an authorised immutable snapshot per docs/03-sad/20-module-report.md Section 5.3 report_snapshots and Section 6.2, including integrity verification.

## Depends On

- task-187 (Create Report Job)

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md, docs/04-ai-contract/04-api-contract.md, docs/04-ai-contract/09-security-contract.md
- **PRD:** docs/01-prd/features/reporting.md, docs/01-prd/business-rules.md § 9
- **SAD:** docs/03-sad/20-module-report.md (Section 5.3 report_snapshots, Section 6.2 Report Query and Jobs)
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-187, task-013, task-014.

## Backend Scope

- Presentation layer: route, controller for `GET /reports/snapshots/{snapshotId}`.
- Application layer: `GetReportSnapshotUseCase`, verifies checksum/integrity before returning.

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

Read-only; queries report_snapshots.

## API Impact

Adds GET /reports/snapshots/{snapshotId}.

## Workflow Impact

Supports reproducible, point-in-time report review (Section 5.5 Lifecycle).

## Security Impact

`RPT_SNAPSHOT_TAMPERED` (409) returned and an incident/data-quality issue created when checksum verification fails (per TC-RPT-015).

## Testing Required

- Unit tests for the Use Case/Entity (per docs/05-testing/unit-tests.md).
- Integration test for Controller/Repository (per docs/05-testing/api-tests.md).

## Deliverables

- `GetReportSnapshotUseCase`, route, controller, tests

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/reporting.md (sourced from docs/03-sad/20-module-report.md):

- TC-RPT-015: failed integrity check blocks the read and creates a data-quality issue.

## Definition of Done

Endpoint implemented and tested.

---

## Dependency Detail

- **Blocked By:** task-187
- **Required Before:** See phase-3-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
