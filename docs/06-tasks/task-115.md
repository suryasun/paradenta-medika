# task-115: Stock Transfer (Entity & Migration)

**Phase:** Phase 3 - Operational Excellence
**Epic:** X. Stock Movement
**Feature:** X1. Transfer
**Module:** Warehouse
**Priority:** P1 - High

---

## Business Goal

Create the `StockTransfer` aggregate and migration per docs/03-sad/18-module-warehouse.md UC-WHS-004 Transfer Stock (draft → submitted → approved → dispatched → received).

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
- **SAD:** docs/03-sad/18-module-warehouse.md (Section 4.2 UC-WHS-004 Transfer Stock (with mermaid flowchart), Section 6.3 Stock Movement)
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-095, task-100, task-102, task-013, task-014, task-006.

## Backend Scope

- Domain layer: `StockTransfer` aggregate (sourceWarehouseId, destinationWarehouseId, line items, status lifecycle) per UC-WHS-004.
- Infrastructure layer: Prisma migration for `warehouse_transfers` and `warehouse_transfer_items`.
- `IStockTransferRepository` interface + Prisma implementation.
- Validates sourceWarehouseId != destinationWarehouseId (else `WHS_SOURCE_DESTINATION_SAME` 422).

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

Creates warehouse_transfers and warehouse_transfer_items tables.

## API Impact

None in this task (endpoints in task-116 through task-120).

## Workflow Impact

Foundational for UC-WHS-004 Transfer Stock.

## Security Impact

No direct endpoint; downstream gated by transfer permissions.

## Testing Required

- Unit tests for the Use Case/Entity (per docs/05-testing/unit-tests.md).
- Integration test for Controller/Repository (per docs/05-testing/api-tests.md).

## Deliverables

- `StockTransfer` aggregate
- `IStockTransferRepository` + Prisma implementation
- Migration for warehouse_transfers(_items)

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/warehouse.md (sourced from docs/03-sad/18-module-warehouse.md):

- `WHS_SOURCE_DESTINATION_SAME` enforced at the domain layer.
- Status lifecycle matches the UC-WHS-004 mermaid flowchart exactly.

## Definition of Done

Aggregate and migration implemented and unit-tested.

---

## Dependency Detail

- **Blocked By:** task-095, task-100, task-102, task-013, task-014, task-006
- **Required Before:** See phase-3-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
