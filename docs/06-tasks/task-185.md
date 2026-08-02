# task-185: Report Definitions Catalog (GET /reports/definitions)

**Phase:** Phase 3 - Operational Excellence
**Epic:** AH. Report Catalog & Scheduled Reports
**Feature:** AH1. Catalog
**Module:** Reporting
**Priority:** P1 - High

---

## Business Goal

Implement `ListReportDefinitionsUseCase` per docs/03-sad/20-module-report.md Section 6.3 Report Catalog, listing the report codes a user is authorised to run.

## Depends On

- task-178

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md, docs/04-ai-contract/04-api-contract.md, docs/04-ai-contract/09-security-contract.md
- **PRD:** docs/01-prd/features/reporting.md, docs/01-prd/business-rules.md § 9
- **SAD:** docs/03-sad/20-module-report.md (Section 6.3 Report Catalog)
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-178, task-013, task-014.

## Backend Scope

- Presentation layer: route, controller for `GET /reports/definitions`.
- Application layer: `ListReportDefinitionsUseCase`, filters the catalog (Section 6.3 table: operations.queue-performance, clinical.visit-summary, billing.daily-summary, finance.trial-balance, finance.income-statement, inventory.stock-card, inventory.expiry, hr.attendance, hr.payroll-register, system.activity-audit) by the requester's permissions.

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

Read-only; reads the static report-definition registry (part of task-{proj}'s metric definition/version registry).

## API Impact

Adds GET /reports/definitions.

## Workflow Impact

Entry point for on-demand and async report consumption.

## Security Impact

Only report codes the requester is authorised for are listed.

## Testing Required

- Unit tests for the Use Case/Entity (per docs/05-testing/unit-tests.md).
- Integration test for Controller/Repository (per docs/05-testing/api-tests.md).

## Deliverables

- `ListReportDefinitionsUseCase`, route, controller, tests

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/reporting.md (sourced from docs/03-sad/20-module-report.md):

- Returned list excludes report codes the requester lacks permission for.

## Definition of Done

Endpoint implemented and tested.

---

## Dependency Detail

- **Blocked By:** task-178
- **Required Before:** See phase-3-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
