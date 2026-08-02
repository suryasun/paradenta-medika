# task-169: Lock Period (POST /periods/{periodId}/lock)

**Phase:** Phase 3 - Operational Excellence
**Epic:** AE. Daily Closing, Settlement & Period
**Feature:** AE4. Period Management
**Module:** Finance
**Priority:** P1 - High

---

## Business Goal

Transition a period to `locked` per the UC-FIN-007 flowchart, restricting new postings ahead of final close.

## Depends On

- task-168

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md, docs/04-ai-contract/04-api-contract.md, docs/04-ai-contract/06-database-contract.md, docs/04-ai-contract/09-security-contract.md
- **PRD:** docs/01-prd/features/finance.md, docs/01-prd/business-rules.md § 6
- **SAD:** docs/03-sad/17-module-finance.md (Section 4 UC-FIN-007 Close Financial Period, Section 6.4 Closing, Settlement, and Period)
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-168, task-013, task-014, task-006.

## Backend Scope

- Presentation layer: route, controller for `POST /finance/periods/{periodId}/lock`.
- Application layer: `LockFinancialPeriodUseCase`.

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

Updates finance_periods status.

## API Impact

Adds POST /finance/periods/{periodId}/lock.

## Workflow Impact

Step in UC-FIN-007 Close Financial Period (per its mermaid flowchart).

## Security Impact

Gated by finance period-manage permission (typically restricted to Owner/Finance Manager). Audit Trail entry required.

## Testing Required

- Unit tests for the Use Case/Entity (per docs/05-testing/unit-tests.md).
- Integration test for Controller/Repository (per docs/05-testing/api-tests.md).

## Deliverables

- `LockFinancialPeriodUseCase`, route, controller, tests

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/finance.md (sourced from docs/03-sad/17-module-finance.md):

- Locked period still allows explicitly-privileged corrections per UC-FIN-007; ordinary posting attempts return `FIN_PERIOD_CLOSED`.

## Definition of Done

Use case implemented and tested.

---

## Dependency Detail

- **Blocked By:** task-168
- **Required Before:** See phase-3-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
