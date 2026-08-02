# task-154: Cash Account Movements (GET /cash-accounts/{cashAccountId}/movements)

**Phase:** Phase 3 - Operational Excellence
**Epic:** AD. Cash & Expense Management
**Feature:** AD1. Cash and Bank
**Module:** Finance
**Priority:** P1 - High

---

## Business Goal

Implement `GetCashAccountMovementsUseCase` exposing the transaction history of a cash register.

## Depends On

- task-153
- task-146

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md, docs/04-ai-contract/04-api-contract.md, docs/04-ai-contract/06-database-contract.md, docs/04-ai-contract/09-security-contract.md
- **PRD:** docs/01-prd/features/finance.md, docs/01-prd/business-rules.md § 6
- **SAD:** docs/03-sad/17-module-finance.md (Section 6.3 Cash and Expense)
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-153, task-146, task-013, task-014.

## Backend Scope

- Presentation layer: route, controller for `GET /finance/cash-accounts/{cashAccountId}/movements`.
- Application layer: `GetCashAccountMovementsUseCase`, reads posted journal lines against the linked account.

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

Read-only; queries finance_journal_lines filtered by the cash account's linked accountId.

## API Impact

Adds GET /finance/cash-accounts/{cashAccountId}/movements.

## Workflow Impact

Supports Daily Closing reconciliation (expected balance derivation).

## Security Impact

Gated by finance.journal.read (cash-account scoped).

## Testing Required

- Unit tests for the Use Case/Entity (per docs/05-testing/unit-tests.md).
- Integration test for Controller/Repository (per docs/05-testing/api-tests.md).

## Deliverables

- `GetCashAccountMovementsUseCase`, route, controller, tests

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/finance.md (sourced from docs/03-sad/17-module-finance.md):

- Only posted journal lines are included (draft/void excluded).

## Definition of Done

Use case implemented and tested.

---

## Dependency Detail

- **Blocked By:** task-153, task-146
- **Required Before:** See phase-3-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
