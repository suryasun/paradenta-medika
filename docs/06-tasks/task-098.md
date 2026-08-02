# task-098: Supplier Master Data (Entity & Migration)

**Phase:** Phase 3 - Operational Excellence
**Epic:** V. Warehouse Foundation
**Feature:** V2. Supplier Management
**Module:** Warehouse
**Priority:** P0 - Blocking

---

## Business Goal

Create the `Supplier` entity/aggregate and warehouse_suppliers migration so Procurement can reference an authoritative vendor list (roadmap 'Supplier Management' feature).

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

- Domain layer: `Supplier` entity per docs/03-sad/18-module-warehouse.md Section 5 Core Tables.
- Infrastructure layer: Prisma migration for `warehouse_suppliers` (audit columns, soft delete).
- `ISupplierRepository` interface + Prisma implementation.

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

Creates warehouse_suppliers table.

## API Impact

None in this task (endpoints in task-099).

## Workflow Impact

Foundational master data for Procurement (Purchase Order supplier reference).

## Security Impact

No direct endpoint; downstream gated by warehouse.supplier.read / warehouse.supplier.manage.

## Testing Required

- Unit tests for the Use Case/Entity (per docs/05-testing/unit-tests.md).
- Integration test for Controller/Repository (per docs/05-testing/api-tests.md).

## Deliverables

- `Supplier` entity
- `ISupplierRepository` + Prisma implementation
- Prisma migration for warehouse_suppliers

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/warehouse.md (sourced from docs/03-sad/18-module-warehouse.md):

- Entity/migration match docs/03-sad/18-module-warehouse.md Section 5 Core Tables and docs/04-ai-contract/06-database-contract.md conventions.

## Definition of Done

Entity and migration implemented and unit-tested.

---

## Dependency Detail

- **Blocked By:** task-013, task-014, task-006
- **Required Before:** See phase-3-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
