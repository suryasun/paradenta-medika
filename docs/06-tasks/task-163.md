# task-163: Daily Closing (Entity & Migration)

**Phase:** Phase 3 - Operational Excellence
**Epic:** AE. Daily Closing, Settlement & Period
**Feature:** AE2. Daily Closing
**Module:** Finance
**Priority:** P0 - Blocking

---

## Business Goal

Create the `DailyClosing` aggregate and migration per docs/03-sad/17-module-finance.md UC-FIN-005 Daily Cash Closing, delivering the roadmap Phase 3 Automation item 'Daily Closing'.

## Depends On

- task-153
- task-013 (Authentication Middleware)
- task-014 (Authorization Middleware)
- task-006 (Audit Trail Service)

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md, docs/04-ai-contract/04-api-contract.md, docs/04-ai-contract/06-database-contract.md, docs/04-ai-contract/09-security-contract.md
- **PRD:** docs/01-prd/features/finance.md, docs/01-prd/business-rules.md § 6
- **SAD:** docs/03-sad/17-module-finance.md (Section 4 UC-FIN-005 Daily Cash Closing, Section 5 Data Model, Section 6.4 API)
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-153, task-013, task-014, task-006.

## Backend Scope

- Domain layer: `DailyClosing` aggregate (branchId, cashAccountId, cashierId, closingDate, countedBalance, denominations, varianceReason) per the Daily Close Request example in Section 6.4.
- Infrastructure layer: Prisma migration for `finance_daily_closings`; `IDailyClosingRepository` + Prisma implementation.

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

Creates finance_daily_closings table.

## API Impact

None in this task (endpoints in task-164/165).

## Workflow Impact

Foundational for UC-FIN-005 Daily Cash Closing.

## Security Impact

No direct endpoint; downstream enforces `FIN_CLOSING_DUPLICATE` and `FIN_CLOSING_VARIANCE_REASON_REQUIRED`.

## Testing Required

- Unit tests for the Use Case/Entity (per docs/05-testing/unit-tests.md).
- Integration test for Controller/Repository (per docs/05-testing/api-tests.md).

## Deliverables

- `DailyClosing` aggregate
- `IDailyClosingRepository` + Prisma implementation
- Migration for finance_daily_closings

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/finance.md (sourced from docs/03-sad/17-module-finance.md):

- Domain layer requires `varianceReason` whenever countedBalance differs from the expected (system) balance.

## Definition of Done

Aggregate and migration implemented and unit-tested.

---

## Dependency Detail

- **Blocked By:** task-153, task-013, task-014, task-006
- **Required Before:** See phase-3-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
