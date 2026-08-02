# task-126: Release Reservation (POST /reservations/{reservationId}/release)

**Phase:** Phase 3 - Operational Excellence
**Epic:** X. Stock Movement
**Feature:** X3. Reservation
**Module:** Warehouse
**Priority:** P1 - High

---

## Business Goal

Implement `ReleaseStockReservationUseCase`, completing UC-WHS-007 by returning reserved quantity to available stock.

## Depends On

- task-125 (Reservation)

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md, docs/04-ai-contract/04-api-contract.md, docs/04-ai-contract/06-database-contract.md, docs/04-ai-contract/09-security-contract.md
- **PRD:** docs/01-prd/features/warehouse.md, docs/01-prd/business-rules.md § 7
- **SAD:** docs/03-sad/18-module-warehouse.md (Section 4.2 UC-WHS-007, Section 6.3 Stock Movement)
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-125, task-013, task-014, task-006.

## Backend Scope

- Presentation layer: route, controller for `POST /warehouse/reservations/{reservationId}/release`.
- Application layer: `ReleaseStockReservationUseCase` — decrements quantityReserved, increments quantityAvailable; idempotent (releasing an already-released reservation is a no-op, not an error).

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

Updates warehouse_reservations status; updates warehouse_stocks.quantityReserved/quantityAvailable.

## API Impact

Adds POST /warehouse/reservations/{reservationId}/release.

## Workflow Impact

Completion of UC-WHS-007.

## Security Impact

Gated by reservation-release permission. Audit Trail entry required.

## Testing Required

- Unit tests for the Use Case/Entity (per docs/05-testing/unit-tests.md).
- Integration test for Controller/Repository (per docs/05-testing/api-tests.md).

## Deliverables

- `ReleaseStockReservationUseCase`, route, controller, tests

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/warehouse.md (sourced from docs/03-sad/18-module-warehouse.md):

- 404 when reservationId not found.
- Idempotent release verified by test.

## Definition of Done

Use case implemented and tested.

---

## Dependency Detail

- **Blocked By:** task-125
- **Required Before:** See phase-3-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
