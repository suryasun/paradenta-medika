# task-168: Financial Period (Entity, Migration & Create/List)

**Phase:** Phase 3 - Operational Excellence
**Epic:** AE. Daily Closing, Settlement & Period
**Feature:** AE4. Period Management
**Module:** Finance
**Priority:** P0 - Blocking

---

## Business Goal

Create the `FinancialPeriod` entity/migration and `GET/POST /finance/periods` per docs/03-sad/17-module-finance.md UC-FIN-007 Close Financial Period, the control that enforces `FIN_PERIOD_CLOSED` across every posting use case in this Epic and Epic AC.

## Depends On

- task-013 (Authentication Middleware)
- task-014 (Authorization Middleware)
- task-006 (Audit Trail Service)

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md, docs/04-ai-contract/04-api-contract.md, docs/04-ai-contract/06-database-contract.md, docs/04-ai-contract/09-security-contract.md
- **PRD:** docs/01-prd/features/finance.md, docs/01-prd/business-rules.md § 6
- **SAD:** docs/03-sad/17-module-finance.md (Section 4 UC-FIN-007 Close Financial Period (with mermaid flowchart), Section 5 Data Model, Section 6.4 API)
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-013, task-014, task-006.

## Backend Scope

- Domain layer: `FinancialPeriod` entity (branchId, periodStart, periodEnd, status open/locked/closed).
- Infrastructure layer: Prisma migration for `finance_periods`; `IFinancialPeriodRepository` + Prisma implementation.
- Application layer: `CreatePeriodUseCase`, `ListPeriodsUseCase` for `GET/POST /finance/periods`.

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

Creates finance_periods table.

## API Impact

Adds GET/POST /finance/periods.

## Workflow Impact

Every Journal-posting use case in Epic AC/AD/AE must check this table for `FIN_PERIOD_CLOSED` before posting — this task must land before task-150 (Post Journal) is considered fully compliant; if sequenced after, task-150 requires a follow-up integration patch (see phase-3-plan.md Implementation Order).

## Security Impact

Gated by finance period-manage permission. Audit Trail entry required for Create.

## Testing Required

- Unit tests for the Use Case/Entity (per docs/05-testing/unit-tests.md).
- Integration test for Controller/Repository (per docs/05-testing/api-tests.md).

## Deliverables

- `FinancialPeriod` entity, migration, repository
- `CreatePeriodUseCase`, `ListPeriodsUseCase`, route, controller, tests

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/finance.md (sourced from docs/03-sad/17-module-finance.md):

- Periods for a branch cannot overlap.

## Definition of Done

Entity, migration, and CRUD endpoints implemented and tested.

---

## Dependency Detail

- **Blocked By:** task-013, task-014, task-006
- **Required Before:** See phase-3-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
