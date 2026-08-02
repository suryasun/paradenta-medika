# task-102: Stock Balance (Entity, Migration & GET /warehouse/stocks)

**Phase:** Phase 3 - Operational Excellence
**Epic:** V. Warehouse Foundation
**Feature:** V4. Stock Read
**Module:** Warehouse
**Priority:** P0 - Blocking

---

## Business Goal

Create the `Stock` read entity (current, reserved, available, minimum, status) and warehouse_stocks migration, plus `ListStocksUseCase` for `GET /warehouse/stocks`, giving Inventory Management its balance view of record.

## Depends On

- task-095 (Item)
- task-100 (Warehouse Location)
- task-013 (Authentication Middleware)
- task-014 (Authorization Middleware)
- task-006 (Audit Trail Service)

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md, docs/04-ai-contract/04-api-contract.md, docs/04-ai-contract/06-database-contract.md, docs/04-ai-contract/09-security-contract.md
- **PRD:** docs/01-prd/features/warehouse.md, docs/01-prd/business-rules.md § 7
- **SAD:** docs/03-sad/18-module-warehouse.md (Section 5 Data Model, Section 6.1 Item/Supplier/Warehouse API)
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-095, task-100, task-013, task-014, task-006.

## Backend Scope

- Domain layer: `Stock` entity (itemId, warehouseId, quantityOnHand, quantityReserved, quantityAvailable, minimumStock, status) per docs/03-sad/18-module-warehouse.md Section 5.
- Infrastructure layer: Prisma migration for `warehouse_stocks`; `IStockRepository` + Prisma implementation.
- Application layer: `ListStocksUseCase` for `GET /warehouse/stocks`, gated by `warehouse.stock.read`.

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

Creates warehouse_stocks table (item/warehouse composite scope).

## API Impact

Adds GET /warehouse/stocks.

## Workflow Impact

Read model consumed by Goods Receipt posting, Stock Movement, Reservation, and Automatic Stock Update to check/update balances.

## Security Impact

Gated by warehouse.stock.read.

## Testing Required

- Unit tests for the Use Case/Entity (per docs/05-testing/unit-tests.md).
- Integration test for Controller/Repository (per docs/05-testing/api-tests.md).

## Deliverables

- `Stock` entity
- `IStockRepository` + Prisma implementation
- Prisma migration for warehouse_stocks
- `ListStocksUseCase`, route, controller, tests

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/warehouse.md (sourced from docs/03-sad/18-module-warehouse.md):

- List reflects current/reserved/available/minimum/status per Section 4.5 Inventory Reports.
- `WHS_NEGATIVE_STOCK_FORBIDDEN` (422) is a reserved invariant enforced by any writer of this table (validated in later movement tasks).

## Definition of Done

Entity, migration, and read endpoint implemented and tested.

---

## Dependency Detail

- **Blocked By:** task-095, task-100, task-013, task-014, task-006
- **Required Before:** See phase-3-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
