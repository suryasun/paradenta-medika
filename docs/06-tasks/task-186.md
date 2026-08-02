# task-186: On-Demand Report (GET /reports/{reportCode})

**Phase:** Phase 3 - Operational Excellence
**Epic:** AH. Report Catalog & Scheduled Reports
**Feature:** AH1. Catalog
**Module:** Reporting
**Priority:** P1 - High

---

## Business Goal

Implement `GetReportUseCase` for lightweight, synchronous report results per docs/03-sad/20-module-report.md Section 6.2.

## Depends On

- task-185 (Report Definitions Catalog)

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md, docs/04-ai-contract/04-api-contract.md, docs/04-ai-contract/09-security-contract.md
- **PRD:** docs/01-prd/features/reporting.md, docs/01-prd/business-rules.md § 9
- **SAD:** docs/03-sad/20-module-report.md (Section 6.2 Report Query and Jobs)
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-185, task-013, task-014.

## Backend Scope

- Presentation layer: route, controller, query DTO/validator for `GET /reports/{reportCode}`.
- Application layer: `GetReportUseCase` — validates filters/dimensions/date range/detail level server-side; rejects (not silently widens) unsupported requests.

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

Read-only.

## API Impact

Adds GET /reports/{reportCode}.

## Workflow Impact

Synchronous path of the Report Catalog for small/fast reports.

## Security Impact

`RPT_SCOPE_FORBIDDEN` (403) when requested branch/detail is outside authority. `RPT_FILTER_INVALID` (422) / `RPT_RANGE_TOO_LARGE` (422) enforced server-side.

## Testing Required

- Unit tests for the Use Case/Entity (per docs/05-testing/unit-tests.md).
- Integration test for Controller/Repository (per docs/05-testing/api-tests.md).

## Deliverables

- `GetReportUseCase`, route, controller, tests

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/reporting.md (sourced from docs/03-sad/20-module-report.md):

- `RPT_DEFINITION_NOT_FOUND` (404) for unknown reportCode.
- `RPT_RANGE_TOO_LARGE` (422) forces the client to the async job path (task-187) instead of silently truncating.

## Definition of Done

Endpoint implemented and tested against all listed error codes.

---

## Dependency Detail

- **Blocked By:** task-185
- **Required Before:** See phase-3-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
