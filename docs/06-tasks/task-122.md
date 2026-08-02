# task-122: Create Stock Adjustment (POST /warehouse/adjustments)

**Phase:** Phase 3 - Operational Excellence
**Epic:** X. Stock Movement
**Feature:** X2. Adjustment
**Module:** Warehouse
**Priority:** P1 - High

---

## Business Goal

Implement `CreateStockAdjustmentUseCase`, the first step of UC-WHS-005.

## Depends On

- task-121

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md, docs/04-ai-contract/04-api-contract.md, docs/04-ai-contract/06-database-contract.md, docs/04-ai-contract/09-security-contract.md
- **PRD:** docs/01-prd/features/warehouse.md, docs/01-prd/business-rules.md § 7
- **SAD:** docs/03-sad/18-module-warehouse.md (Section 6.3 Stock Movement)
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-121, task-013, task-014, task-006.

## Backend Scope

- Presentation layer: route, controller, DTO/validator for `POST /warehouse/adjustments`.
- Application layer: `CreateStockAdjustmentUseCase`, creates draft awaiting approval.

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

Inserts into warehouse_adjustments/_items in draft status.

## API Impact

Adds POST /warehouse/adjustments.

## Workflow Impact

First step of UC-WHS-005.

## Security Impact

Gated by adjustment-create permission. Audit Trail entry required.

## Testing Required

- Unit tests for the Use Case/Entity (per docs/05-testing/unit-tests.md).
- Integration test for Controller/Repository (per docs/05-testing/api-tests.md).

## Deliverables

- `CreateStockAdjustmentUseCase`, route, controller, tests

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/warehouse.md (sourced from docs/03-sad/18-module-warehouse.md):

- Draft created with mandatory reason field; stock not yet affected.

## Definition of Done

Use case implemented and tested.

---

## Dependency Detail

- **Blocked By:** task-121
- **Required Before:** See phase-3-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
