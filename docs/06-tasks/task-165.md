# task-165: Approve and List Daily Closing (POST .../approve, GET /finance/daily-closings)

**Phase:** Phase 3 - Operational Excellence
**Epic:** AE. Daily Closing, Settlement & Period
**Feature:** AE2. Daily Closing
**Module:** Finance
**Priority:** P1 - High

---

## Business Goal

Implement `ApproveDailyClosingUseCase` and `ListDailyClosingsUseCase`, completing UC-FIN-005.

## Depends On

- task-164 (Create Daily Closing)

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md, docs/04-ai-contract/04-api-contract.md, docs/04-ai-contract/06-database-contract.md, docs/04-ai-contract/09-security-contract.md
- **PRD:** docs/01-prd/features/finance.md, docs/01-prd/business-rules.md § 6
- **SAD:** docs/03-sad/17-module-finance.md (Section 4 UC-FIN-005, Section 6.4 Closing, Settlement, and Period)
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-164, task-013, task-014, task-006.

## Backend Scope

- Presentation layer: routes/controllers for `POST /finance/daily-closings/{closingId}/approve` and `GET /finance/daily-closings`.
- Application layer: `ApproveDailyClosingUseCase` (maker-checker), `ListDailyClosingsUseCase`.

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

Updates finance_daily_closings status to approved.

## API Impact

Adds POST /finance/daily-closings/{closingId}/approve, GET /finance/daily-closings.

## Workflow Impact

Completion of UC-FIN-005.

## Security Impact

`FIN_SEGREGATION_OF_DUTIES` (403) when approver == creator. Audit Trail entry required.

## Testing Required

- Unit tests for the Use Case/Entity (per docs/05-testing/unit-tests.md).
- Integration test for Controller/Repository (per docs/05-testing/api-tests.md).

## Deliverables

- `ApproveDailyClosingUseCase`, `ListDailyClosingsUseCase`, routes, controllers, tests

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/finance.md (sourced from docs/03-sad/17-module-finance.md):

- Rejects self-approval.
- List supports filter by branch, cashAccount, date range, status.

## Definition of Done

Both use cases implemented and tested.

---

## Dependency Detail

- **Blocked By:** task-164
- **Required Before:** See phase-3-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
