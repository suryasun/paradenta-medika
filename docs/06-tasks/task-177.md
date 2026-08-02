# task-177: Daily Closing Report (GET /finance/reports/daily-closing)

**Phase:** Phase 3 - Operational Excellence
**Epic:** AF. Finance Reporting
**Feature:** AF1. Reports
**Module:** Finance
**Priority:** P2 - Medium

---

## Business Goal

Implement `GetDailyClosingReportUseCase` exposing `GET /finance/reports/daily-closing` per docs/03-sad/17-module-finance.md Section 6.5 Reports, using only posted journal data (Finance is the sole source of truth for accounting balances per docs/01-prd/business-rules.md § 6).

## Depends On

- task-146
- task-168
- task-013 (Authentication Middleware)
- task-014 (Authorization Middleware)

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md, docs/04-ai-contract/04-api-contract.md, docs/04-ai-contract/06-database-contract.md, docs/04-ai-contract/09-security-contract.md
- **PRD:** docs/01-prd/features/finance.md, docs/01-prd/business-rules.md § 6
- **SAD:** docs/03-sad/17-module-finance.md (Section 6.5 Reports, Section 6.6 Error Codes)
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-146, task-168, task-013, task-014.

## Backend Scope

- Presentation layer: route, controller, query DTO/validator for `GET /finance/reports/daily-closing` (requires branchId, dateFrom/dateTo or periodId).
- Application layer: `GetDailyClosingReportUseCase`, read-only, sourced from posted finance_journals(_lines) only.

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

Read-only; queries finance_journals/_lines and finance_accounts.

## API Impact

Adds GET /finance/reports/daily-closing.

## Workflow Impact

Supports Finance Integration operational and statutory reporting.

## Security Impact

Gated by finance report-read permission; branch-scoped per assignment.

## Testing Required

- Unit tests for the Use Case/Entity (per docs/05-testing/unit-tests.md).
- Integration test for Controller/Repository (per docs/05-testing/api-tests.md).

## Deliverables

- `GetDailyClosingReportUseCase`, route, controller, tests

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/finance.md (sourced from docs/03-sad/17-module-finance.md):

- Only `posted` journals are included; draft/void journals excluded.
- Output matches the Expected/count/variance/approval shape defined in Section 6.5.

## Definition of Done

Endpoint implemented and tested.

---

## Dependency Detail

- **Blocked By:** task-146, task-168
- **Required Before:** See phase-3-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
