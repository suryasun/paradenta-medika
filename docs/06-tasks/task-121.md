# task-121: Stock Adjustment (Entity & Migration)

**Phase:** Phase 3 - Operational Excellence
**Epic:** X. Stock Movement
**Feature:** X2. Adjustment
**Module:** Warehouse
**Priority:** P1 - High

---

## Business Goal

Create the `StockAdjustment` aggregate and migration per docs/03-sad/18-module-warehouse.md UC-WHS-005 Stock Adjustment.

## Depends On

- task-095
- task-100
- task-102
- task-013 (Authentication Middleware)
- task-014 (Authorization Middleware)
- task-006 (Audit Trail Service)

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md, docs/04-ai-contract/04-api-contract.md, docs/04-ai-contract/06-database-contract.md, docs/04-ai-contract/09-security-contract.md
- **PRD:** docs/01-prd/features/warehouse.md, docs/01-prd/business-rules.md § 7
- **SAD:** docs/03-sad/18-module-warehouse.md (Section 4.2 UC-WHS-005 Stock Adjustment, Section 6.3 Stock Movement)
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-095, task-100, task-102, task-013, task-014, task-006.

## Backend Scope

- Domain layer: `StockAdjustment` aggregate (warehouseId, item lines, quantity delta, reason) per UC-WHS-005.
- Infrastructure layer: Prisma migration for `warehouse_adjustments` and `warehouse_adjustment_items`.
- `IStockAdjustmentRepository` interface + Prisma implementation.

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

Creates warehouse_adjustments and warehouse_adjustment_items tables.

## API Impact

None in this task (endpoints in task-122 through task-124).

## Workflow Impact

Foundational for UC-WHS-005 Stock Adjustment.

## Security Impact

No direct endpoint; downstream requires approval per `WHS_ADJUSTMENT_APPROVAL_REQUIRED`.

## Testing Required

- Unit tests for the Use Case/Entity (per docs/05-testing/unit-tests.md).
- Integration test for Controller/Repository (per docs/05-testing/api-tests.md).

## Deliverables

- `StockAdjustment` aggregate
- `IStockAdjustmentRepository` + Prisma implementation
- Migration for warehouse_adjustments(_items)

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/warehouse.md (sourced from docs/03-sad/18-module-warehouse.md):

- Reason field is mandatory per UC-WHS-005 business rule.

## Definition of Done

Aggregate and migration implemented and unit-tested.

---

## Dependency Detail

- **Blocked By:** task-095, task-100, task-102, task-013, task-014, task-006
- **Required Before:** See phase-3-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
