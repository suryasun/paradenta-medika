# task-144: Create and List Account (POST/GET /finance/accounts)

**Phase:** Phase 3 - Operational Excellence
**Epic:** AB. Finance Foundation
**Feature:** AB1. Chart of Accounts
**Module:** Finance
**Priority:** P0 - Blocking

---

## Business Goal

Implement `CreateAccountUseCase` and `ListAccountsUseCase` per docs/03-sad/17-module-finance.md Section 6.1.

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

- Presentation layer: route, controller, DTO/validator for `GET/POST /finance/accounts`.
- Application layer: `CreateAccountUseCase`, `ListAccountsUseCase`, gated by `finance.account.read`/`finance.account.manage`.

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

Inserts into finance_accounts.

## API Impact

Adds GET/POST /finance/accounts.

## Workflow Impact

Required before any Journal, Expense, or Cash Account can reference a posting account.

## Security Impact

Gated by finance.account.read / finance.account.manage. Audit Trail entry required for Create.

## Testing Required

- Unit tests for the Use Case/Entity (per docs/05-testing/unit-tests.md).
- Integration test for Controller/Repository (per docs/05-testing/api-tests.md).

## Deliverables

- `CreateAccountUseCase`, `ListAccountsUseCase`, DTOs, route, controller, tests

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/finance.md (sourced from docs/03-sad/17-module-finance.md):

- Create Account succeeds with the payload shape in Section 6.1's example.
- Duplicate code within a branch rejected.

## Definition of Done

Both use cases implemented and tested.

---

## Dependency Detail

- **Blocked By:** task-143
- **Required Before:** See phase-3-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
