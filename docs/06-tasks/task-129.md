# task-129: Get and Update Stock Opname (GET/PATCH /stock-opnames/{opnameId})

**Phase:** Phase 3 - Operational Excellence
**Epic:** Y. Stock Opname & Batch
**Feature:** Y1. Stock Opname
**Module:** Warehouse
**Priority:** P1 - High

---

## Business Goal

Allow a draft opname's scope/count sheet to be reviewed and edited.

## Depends On

- task-127

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md, docs/04-ai-contract/04-api-contract.md, docs/04-ai-contract/06-database-contract.md, docs/04-ai-contract/09-security-contract.md
- **PRD:** docs/01-prd/features/warehouse.md, docs/01-prd/business-rules.md § 7
- **SAD:** docs/03-sad/18-module-warehouse.md (Section 4.2 UC-WHS-006 Stock Opname, Section 6.4 Stock Opname dan Batch)
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-127, task-013, task-014, task-006.

## Backend Scope

- Presentation layer: route, controller, DTO/validator for `GET/PATCH /warehouse/stock-opnames/{opnameId}`.
- Application layer: `GetStockOpnameUseCase / UpdateStockOpnameUseCase`.

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

Updates warehouse_stock_opnames(_items) status/counts.

## API Impact

Adds GET/PATCH /warehouse/stock-opnames/{opnameId} per docs/03-sad/18-module-warehouse.md Section 6.4.

## Workflow Impact

Step in UC-WHS-006 Stock Opname.

## Security Impact

Gated by opname-scoped permission. Audit Trail entry required.

## Testing Required

- Unit tests for the Use Case/Entity (per docs/05-testing/unit-tests.md).
- Integration test for Controller/Repository (per docs/05-testing/api-tests.md).

## Deliverables

- `GetStockOpnameUseCase / UpdateStockOpnameUseCase`, route, controller, tests

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/warehouse.md (sourced from docs/03-sad/18-module-warehouse.md):

- 404 when opnameId not found; update rejected once counting has started.

## Definition of Done

Use case implemented and tested.

---

## Dependency Detail

- **Blocked By:** task-127
- **Required Before:** See phase-3-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
