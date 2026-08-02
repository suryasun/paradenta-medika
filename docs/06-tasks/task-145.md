# task-145: Update and Deactivate Account (PATCH /accounts/{accountId}, POST .../deactivate)

**Phase:** Phase 3 - Operational Excellence
**Epic:** AB. Finance Foundation
**Feature:** AB1. Chart of Accounts
**Module:** Finance
**Priority:** P1 - High

---

## Business Goal

Implement `UpdateAccountUseCase` and `DeactivateAccountUseCase` per docs/03-sad/17-module-finance.md Section 6.1.

## Depends On

- task-143

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md, docs/04-ai-contract/04-api-contract.md, docs/04-ai-contract/06-database-contract.md, docs/04-ai-contract/09-security-contract.md
- **PRD:** docs/01-prd/features/finance.md, docs/01-prd/business-rules.md § 6
- **SAD:** docs/03-sad/17-module-finance.md (Section 6.1 Chart of Accounts)
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-143, task-013, task-014, task-006.

## Backend Scope

- Presentation layer: routes/controllers for `PATCH /finance/accounts/{accountId}` and `POST /finance/accounts/{accountId}/deactivate`.
- Application layer: `UpdateAccountUseCase`, `DeactivateAccountUseCase`, gated by `finance.account.manage`.

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

Updates finance_accounts row (fields or isActive flag).

## API Impact

Adds PATCH /finance/accounts/{accountId}, POST /finance/accounts/{accountId}/deactivate.

## Workflow Impact

Maintains Chart of Accounts integrity over time without hard deletion (soft-delete/deactivate policy).

## Security Impact

Gated by finance.account.manage. Audit Trail entry required.

## Testing Required

- Unit tests for the Use Case/Entity (per docs/05-testing/unit-tests.md).
- Integration test for Controller/Repository (per docs/05-testing/api-tests.md).

## Deliverables

- `UpdateAccountUseCase`, `DeactivateAccountUseCase`, routes, controllers, tests

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/finance.md (sourced from docs/03-sad/17-module-finance.md):

- Deactivating an account with posted journal history is allowed (it just becomes non-postable going forward); an account cannot be hard-deleted (soft-delete policy).
- accountType/normalBalance are immutable after any journal has posted against the account.

## Definition of Done

Both use cases implemented and tested.

---

## Dependency Detail

- **Blocked By:** task-143
- **Required Before:** See phase-3-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
