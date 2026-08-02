# task-100: Warehouse Location Master Data (Entity & Migration)

**Phase:** Phase 3 - Operational Excellence
**Epic:** V. Warehouse Foundation
**Feature:** V3. Warehouse Location
**Module:** Warehouse
**Priority:** P0 - Blocking

---

## Business Goal

Create the `WarehouseLocation` entity/aggregate and warehouse_warehouses migration so stock, transfer, and opname operations have an authoritative location scope.

## Depends On

- task-013 (Authentication Middleware)
- task-014 (Authorization Middleware)
- task-006 (Audit Trail Service)

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md, docs/04-ai-contract/04-api-contract.md, docs/04-ai-contract/06-database-contract.md, docs/04-ai-contract/09-security-contract.md
- **PRD:** docs/01-prd/features/warehouse.md, docs/01-prd/business-rules.md § 7
- **SAD:** docs/03-sad/18-module-warehouse.md (Section 5 Data Model, Section 6.1 Item/Supplier/Warehouse API)
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-013, task-014, task-006.

## Backend Scope

- Domain layer: `WarehouseLocation` entity per docs/03-sad/18-module-warehouse.md Section 5 Core Tables.
- Infrastructure layer: Prisma migration for `warehouse_warehouses` (branch-scoped, audit columns, soft delete).
- `IWarehouseLocationRepository` interface + Prisma implementation.

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

Creates warehouse_warehouses table with branch FK.

## API Impact

None in this task (endpoints in task-101).

## Workflow Impact

Foundational master data for all stock-holding workflows.

## Security Impact

No direct endpoint; downstream gated by warehouse.location.read / warehouse.location.manage.

## Testing Required

- Unit tests for the Use Case/Entity (per docs/05-testing/unit-tests.md).
- Integration test for Controller/Repository (per docs/05-testing/api-tests.md).

## Deliverables

- `WarehouseLocation` entity
- `IWarehouseLocationRepository` + Prisma implementation
- Prisma migration for warehouse_warehouses

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/warehouse.md (sourced from docs/03-sad/18-module-warehouse.md):

- Entity/migration match docs/03-sad/18-module-warehouse.md Section 5 Core Tables.

## Definition of Done

Entity and migration implemented and unit-tested.

---

## Dependency Detail

- **Blocked By:** task-013, task-014, task-006
- **Required Before:** See phase-3-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
