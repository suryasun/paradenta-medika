# task-156: Expense (Entity & Migration)

**Phase:** Phase 3 - Operational Excellence
**Epic:** AD. Cash & Expense Management
**Feature:** AD2. Expense
**Module:** Finance
**Priority:** P1 - High

---

## Business Goal

Create the `Expense` aggregate and migration per docs/03-sad/17-module-finance.md UC-FIN-003 Record Expense (draft → submitted → approved/rejected → paid).

## Depends On

- task-143
- task-153
- task-013 (Authentication Middleware)
- task-014 (Authorization Middleware)
- task-006 (Audit Trail Service)

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md, docs/04-ai-contract/04-api-contract.md, docs/04-ai-contract/06-database-contract.md, docs/04-ai-contract/09-security-contract.md
- **PRD:** docs/01-prd/features/finance.md, docs/01-prd/business-rules.md § 6
- **SAD:** docs/03-sad/17-module-finance.md (Section 4 UC-FIN-003 Record Expense, Section 5 Data Model, Section 6.3 API)
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-143, task-153, task-013, task-014, task-006.

## Backend Scope

- Domain layer: `Expense` aggregate (branchId, category, expenseAccountId, amount, status lifecycle) per UC-FIN-003.
- Infrastructure layer: Prisma migration for `finance_expenses`; `IExpenseRepository` + Prisma implementation.

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

Creates finance_expenses table.

## API Impact

None in this task (endpoints in task-157 through task-161).

## Workflow Impact

Foundational for UC-FIN-003 Record Expense.

## Security Impact

No direct endpoint; downstream approval enforces segregation of duties.

## Testing Required

- Unit tests for the Use Case/Entity (per docs/05-testing/unit-tests.md).
- Integration test for Controller/Repository (per docs/05-testing/api-tests.md).

## Deliverables

- `Expense` aggregate
- `IExpenseRepository` + Prisma implementation
- Migration for finance_expenses

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/finance.md (sourced from docs/03-sad/17-module-finance.md):

- Status lifecycle matches UC-FIN-003 exactly (draft → submitted → approved/rejected → paid).

## Definition of Done

Aggregate and migration implemented and unit-tested.

---

## Dependency Detail

- **Blocked By:** task-143, task-153, task-013, task-014, task-006
- **Required Before:** See phase-3-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
