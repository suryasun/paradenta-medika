# task-187: Create Report Job (POST /reports/{reportCode}/jobs)

**Phase:** Phase 3 - Operational Excellence
**Epic:** AH. Report Catalog & Scheduled Reports
**Feature:** AH2. Scheduled Reports (Async Jobs)
**Module:** Reporting
**Priority:** P1 - High

---

## Business Goal

Implement `CreateReportJobUseCase` per docs/03-sad/20-module-report.md Section 6.2, delivering the roadmap Phase 3 Automation item 'Scheduled Reports' for large/async report generation and export.

## Depends On

- task-185 (Report Definitions Catalog)

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md, docs/04-ai-contract/04-api-contract.md, docs/04-ai-contract/09-security-contract.md
- **PRD:** docs/01-prd/features/reporting.md, docs/01-prd/business-rules.md § 9
- **SAD:** docs/03-sad/20-module-report.md (Section 6.2 Report Query and Jobs (Create report job example))
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-185, task-013, task-014, task-006.

## Backend Scope

- Presentation layer: route, controller, DTO/validator for `POST /reports/{reportCode}/jobs` (filters, format, timezone per the Section 6.2 example).
- Application layer: `CreateReportJobUseCase` — intersects requested branchIds with authorised scope; creates a `report_jobs` row and enqueues background processing.

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

Inserts into report_jobs.

## API Impact

Adds POST /reports/{reportCode}/jobs.

## Workflow Impact

Entry point of the async Scheduled Reports automation.

## Security Impact

Gated by the report code's permission; scope intersected not widened. Audit Trail entry required.

## Testing Required

- Unit tests for the Use Case/Entity (per docs/05-testing/unit-tests.md).
- Integration test for Controller/Repository (per docs/05-testing/api-tests.md).

## Deliverables

- `CreateReportJobUseCase`, route, controller, tests

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/reporting.md (sourced from docs/03-sad/20-module-report.md):

- `RPT_JOB_DUPLICATE` (409) returned when an equivalent active job already exists (per TC-RPT-012 idempotent-retry semantics).

## Definition of Done

Endpoint implemented and tested.

---

## Dependency Detail

- **Blocked By:** task-185
- **Required Before:** See phase-3-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
