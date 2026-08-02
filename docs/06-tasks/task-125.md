# task-125: Reservation (Entity, Migration & POST /warehouse/reservations)

**Phase:** Phase 3 - Operational Excellence
**Epic:** X. Stock Movement
**Feature:** X3. Reservation
**Module:** Warehouse
**Priority:** P1 - High

---

## Business Goal

Create the `StockReservation` entity/migration and `ReserveStockUseCase` per docs/03-sad/18-module-warehouse.md UC-WHS-007 Reserve/Release Stock, so committed demand (e.g. from a Treatment Plan) reduces available-but-not-on-hand stock.

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
- **SAD:** docs/03-sad/18-module-warehouse.md (Section 4.2 UC-WHS-007 Reserve/Release Stock, Section 6.3 Stock Movement)
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-095, task-100, task-102, task-013, task-014, task-006.

## Backend Scope

- Domain layer: `StockReservation` entity (itemId, warehouseId, quantity, sourceReference, status).
- Infrastructure layer: Prisma migration for `warehouse_reservations`; `IStockReservationRepository` + Prisma implementation.
- Application layer: `ReserveStockUseCase` for `POST /warehouse/reservations` — increments `warehouse_stocks.quantityReserved`, decrements `quantityAvailable`; rejects with `WHS_STOCK_INSUFFICIENT` if unavailable.

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

Creates warehouse_reservations table; updates warehouse_stocks.quantityReserved/quantityAvailable.

## API Impact

Adds POST /warehouse/reservations.

## Workflow Impact

First half of UC-WHS-007; supports future cross-module reservation from Reservation/EMR flows.

## Security Impact

Gated by reservation-create permission. Audit Trail entry required.

## Testing Required

- Unit tests for the Use Case/Entity (per docs/05-testing/unit-tests.md).
- Integration test for Controller/Repository (per docs/05-testing/api-tests.md).

## Deliverables

- `StockReservation` entity
- Migration, repository
- `ReserveStockUseCase`, route, controller, tests

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/warehouse.md (sourced from docs/03-sad/18-module-warehouse.md):

- `WHS_STOCK_INSUFFICIENT` returned when available stock is less than requested.
- quantityReserved/quantityAvailable updated atomically.

## Definition of Done

Entity, migration, and reserve endpoint implemented and tested.

---

## Dependency Detail

- **Blocked By:** task-095, task-100, task-102, task-013, task-014, task-006
- **Required Before:** See phase-3-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
