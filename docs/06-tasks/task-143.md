# task-143: Chart of Accounts (Entity & Migration)

**Phase:** Phase 3 - Operational Excellence
**Epic:** AB. Finance Foundation
**Feature:** AB1. Chart of Accounts
**Module:** Finance
**Priority:** P0 - Blocking

---

## Business Goal

Create the `Account` entity/migration per docs/03-sad/17-module-finance.md Section 6.1, the ledger backbone required before any Journal can post — delivering the roadmap 'Finance Integration' foundation.

## Depends On

- task-013 (Authentication Middleware)
- task-014 (Authorization Middleware)
- task-006 (Audit Trail Service)

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md, docs/04-ai-contract/04-api-contract.md, docs/04-ai-contract/06-database-contract.md, docs/04-ai-contract/09-security-contract.md
- **PRD:** docs/01-prd/features/finance.md, docs/01-prd/business-rules.md § 6
- **SAD:** docs/03-sad/17-module-finance.md (Section 6.1 Chart of Accounts, Section 5 Data Model)
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-013, task-014, task-006.

## Backend Scope

- Domain layer: `Account` entity (branchId, code, name, accountType, normalBalance, parentId, isPostable) per the Create Account example.
- Infrastructure layer: Prisma migration for `finance_accounts` (self-referencing parentId for hierarchy).
- `IAccountRepository` interface + Prisma implementation.

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

Creates finance_accounts table.

## API Impact

None in this task (endpoints in task-144/145).

## Workflow Impact

Foundational for all Journal posting (UC-FIN-002/003) and every Finance report.

## Security Impact

No direct endpoint; downstream gated by finance.account.read / finance.account.manage.

## Testing Required

- Unit tests for the Use Case/Entity (per docs/05-testing/unit-tests.md).
- Integration test for Controller/Repository (per docs/05-testing/api-tests.md).

## Deliverables

- `Account` entity
- `IAccountRepository` + Prisma implementation
- Migration for finance_accounts

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/finance.md (sourced from docs/03-sad/17-module-finance.md):

- Entity enforces accountType/normalBalance consistency (e.g. asset/expense = debit-normal; liability/equity/revenue = credit-normal) per standard accounting rules referenced in docs/01-prd/business-rules.md § 6.
- isPostable=false accounts (heading accounts) cannot be journal targets (enforced by `FIN_ACCOUNT_NOT_POSTABLE`, verified downstream).

## Definition of Done

Entity and migration implemented and unit-tested.

---

## Dependency Detail

- **Blocked By:** task-013, task-014, task-006
- **Required Before:** See phase-3-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
