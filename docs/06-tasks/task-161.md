# task-161: Pay Expense (POST /expenses/{expenseId}/pay)

**Phase:** Phase 3 - Operational Excellence
**Epic:** AD. Cash & Expense Management
**Feature:** AD2. Expense
**Module:** Finance
**Priority:** P1 - High

---

## Business Goal

Pay an approved expense, per the Pay Expense request example in Section 6.3 — posts a Journal debiting the expense account and crediting the chosen cash account.

## Depends On

- task-156
- task-153
- task-146

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md, docs/04-ai-contract/04-api-contract.md, docs/04-ai-contract/06-database-contract.md, docs/04-ai-contract/09-security-contract.md
- **PRD:** docs/01-prd/features/finance.md, docs/01-prd/business-rules.md § 6
- **SAD:** docs/03-sad/17-module-finance.md (Section 4 UC-FIN-003 Record Expense, Section 6.3 Cash and Expense)
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-156, task-013, task-014, task-006.

## Backend Scope

- Presentation layer: route, controller, DTO/validator for `POST /finance/expenses/{expenseId}/pay`.
- Application layer: `PayExpenseUseCase`.

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

Writes/updates finance_expenses.

## API Impact

Adds POST /finance/expenses/{expenseId}/pay per docs/03-sad/17-module-finance.md Section 6.3.

## Workflow Impact

Step in UC-FIN-003 Record Expense.

## Security Impact

Gated by the corresponding finance.expense.* permission (implied by module contract). Audit Trail entry required.

## Testing Required

- Unit tests for the Use Case/Entity (per docs/05-testing/unit-tests.md).
- Integration test for Controller/Repository (per docs/05-testing/api-tests.md).

## Deliverables

- `PayExpenseUseCase`, route, controller, tests

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/finance.md (sourced from docs/03-sad/17-module-finance.md):

- `FIN_EXPENSE_NOT_APPROVED` (409) returned if expense is not `approved`.
- Posts a balanced Journal via the Post Journal use case and updates the CashAccount balance.

## Definition of Done

Use case implemented and tested.

---

## Dependency Detail

- **Blocked By:** task-156
- **Required Before:** See phase-3-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
