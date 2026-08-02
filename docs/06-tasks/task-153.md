# task-153: Cash Account (Entity, Migration & CRUD)

**Phase:** Phase 3 - Operational Excellence
**Epic:** AD. Cash & Expense Management
**Feature:** AD1. Cash and Bank
**Module:** Finance
**Priority:** P1 - High

---

## Business Goal

Create the `CashAccount` entity/migration and `CreateCashAccountUseCase`/`ListCashAccountsUseCase` for `GET/POST /finance/cash-accounts` per docs/03-sad/17-module-finance.md Section 6.3, the register used by Daily Closing and Expense payment.

## Depends On

- task-143
- task-013 (Authentication Middleware)
- task-014 (Authorization Middleware)
- task-006 (Audit Trail Service)

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md, docs/04-ai-contract/04-api-contract.md, docs/04-ai-contract/06-database-contract.md, docs/04-ai-contract/09-security-contract.md
- **PRD:** docs/01-prd/features/finance.md, docs/01-prd/business-rules.md § 6
- **SAD:** docs/03-sad/17-module-finance.md (Section 6.3 Cash and Expense, Section 5 Data Model)
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-143, task-013, task-014, task-006.

## Backend Scope

- Domain layer: `CashAccount` entity (branchId, name, linked finance_accounts.accountId, currentBalance).
- Infrastructure layer: Prisma migration for `finance_cash_accounts`; `ICashAccountRepository` + Prisma implementation.
- Application layer: `CreateCashAccountUseCase`, `ListCashAccountsUseCase`.

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

Creates finance_cash_accounts table (FK to finance_accounts).

## API Impact

Adds GET/POST /finance/cash-accounts.

## Workflow Impact

Required before Cash Transfer, Expense payment, or Daily Closing can reference a cash register.

## Security Impact

Gated by finance cash-account permission. Audit Trail entry required for Create.

## Testing Required

- Unit tests for the Use Case/Entity (per docs/05-testing/unit-tests.md).
- Integration test for Controller/Repository (per docs/05-testing/api-tests.md).

## Deliverables

- `CashAccount` entity, migration, repository
- `CreateCashAccountUseCase`, `ListCashAccountsUseCase`, route, controller, tests

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/finance.md (sourced from docs/03-sad/17-module-finance.md):

- Cash account is linked to a valid postable finance_accounts row (`FIN_ACCOUNT_MAPPING_MISSING` if missing).

## Definition of Done

Entity, migration, and CRUD endpoints implemented and tested.

---

## Dependency Detail

- **Blocked By:** task-143, task-013, task-014, task-006
- **Required Before:** See phase-3-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
