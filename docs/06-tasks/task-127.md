# task-127: Stock Opname (Entity & Migration)

**Phase:** Phase 3 - Operational Excellence
**Epic:** Y. Stock Opname & Batch
**Feature:** Y1. Stock Opname
**Module:** Warehouse
**Priority:** P1 - High

---

## Business Goal

Create the `StockOpname` aggregate and migration per docs/03-sad/18-module-warehouse.md UC-WHS-006 Stock Opname (physical count vs system, variance, approval).

## Depends On

- task-100
- task-102
- task-013 (Authentication Middleware)
- task-014 (Authorization Middleware)
- task-006 (Audit Trail Service)

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md, docs/04-ai-contract/04-api-contract.md, docs/04-ai-contract/06-database-contract.md, docs/04-ai-contract/09-security-contract.md
- **PRD:** docs/01-prd/features/warehouse.md, docs/01-prd/business-rules.md § 7
- **SAD:** docs/03-sad/18-module-warehouse.md (Section 4.2 UC-WHS-006 Stock Opname, Section 6.4 Stock Opname dan Batch)
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-100, task-102, task-013, task-014, task-006.

## Backend Scope

- Domain layer: `StockOpname` aggregate (warehouseId, opnameDate, status draft/counting/submitted/approved/posted, line items with system qty vs counted qty and variance) per UC-WHS-006.
- Infrastructure layer: Prisma migration for `warehouse_stock_opnames` and `warehouse_stock_opname_items`.
- `IStockOpnameRepository` interface + Prisma implementation. Enforces `WHS_OPNAME_ALREADY_ACTIVE` (one active opname per warehouse/date).

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

Creates warehouse_stock_opnames and warehouse_stock_opname_items tables.

## API Impact

None in this task (endpoints in task-128 through task-133).

## Workflow Impact

Foundational for UC-WHS-006 Stock Opname.

## Security Impact

No direct endpoint; downstream requires approval before posting.

## Testing Required

- Unit tests for the Use Case/Entity (per docs/05-testing/unit-tests.md).
- Integration test for Controller/Repository (per docs/05-testing/api-tests.md).

## Deliverables

- `StockOpname` aggregate
- `IStockOpnameRepository` + Prisma implementation
- Migration for warehouse_stock_opnames(_items)

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/warehouse.md (sourced from docs/03-sad/18-module-warehouse.md):

- `WHS_OPNAME_ALREADY_ACTIVE` enforced when a warehouse already has an active opname.

## Definition of Done

Aggregate and migration implemented and unit-tested.

---

## Dependency Detail

- **Blocked By:** task-100, task-102, task-013, task-014, task-006
- **Required Before:** See phase-3-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
