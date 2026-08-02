# task-164: Create Daily Closing (POST /finance/daily-closings)

**Phase:** Phase 3 - Operational Excellence
**Epic:** AE. Daily Closing, Settlement & Period
**Feature:** AE2. Daily Closing
**Module:** Finance
**Priority:** P0 - Blocking

---

## Business Goal

Implement `CreateDailyClosingUseCase`, computing expected balance from Cash Account Movements (task-154) and comparing against the counted balance, per UC-FIN-005 — the core of the 'Daily Closing' automation.

## Depends On

- task-163
- task-153

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md, docs/04-ai-contract/04-api-contract.md, docs/04-ai-contract/06-database-contract.md, docs/04-ai-contract/09-security-contract.md
- **PRD:** docs/01-prd/features/finance.md, docs/01-prd/business-rules.md § 6
- **SAD:** docs/03-sad/17-module-finance.md (Section 4 UC-FIN-005, Section 6.4 Closing, Settlement, and Period)
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-163, task-153, task-013, task-014, task-006.

## Backend Scope

- Presentation layer: route, controller, DTO/validator for `POST /finance/daily-closings`.
- Application layer: `CreateDailyClosingUseCase` — computes expected balance from posted cash movements up to closingDate, compares to countedBalance, requires varianceReason if different.

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

Inserts into finance_daily_closings.

## API Impact

Adds POST /finance/daily-closings.

## Workflow Impact

First step of UC-FIN-005 Daily Cash Closing.

## Security Impact

Gated by finance daily-closing permission. `Idempotency-Key` required. Audit Trail entry required.

## Testing Required

- Unit tests for the Use Case/Entity (per docs/05-testing/unit-tests.md).
- Integration test for Controller/Repository (per docs/05-testing/api-tests.md).

## Deliverables

- `CreateDailyClosingUseCase`, route, controller, tests

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/finance.md (sourced from docs/03-sad/17-module-finance.md):

- `FIN_CLOSING_DUPLICATE` (409) returned when a closing already exists for the branch/cashAccount/date.
- `FIN_CLOSING_VARIANCE_REASON_REQUIRED` (422) returned when countedBalance != expected and varianceReason is null.

## Definition of Done

Use case implemented and tested against both error codes.

---

## Dependency Detail

- **Blocked By:** task-163, task-153
- **Required Before:** See phase-3-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
