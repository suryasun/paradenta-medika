# task-095: Item Master Data (Entity & Migration)

**Phase:** Phase 3 - Operational Excellence
**Epic:** V. Warehouse Foundation
**Feature:** V1. Item Master Data
**Module:** Warehouse
**Priority:** P0 - Blocking

---

## Business Goal

Create the `Item` entity/aggregate and warehouse_items migration (with category, unit, minimum stock, isConsumable, isBatchTracked, isExpiryTracked flags per docs/03-sad/18-module-warehouse.md Section 6.1 Create Item example) so Inventory Management has a master-data foundation for stock, purchase, and consumption tracking.

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

- Domain layer: `Item` entity with code, name, categoryId, unitId, minimumStock, isConsumable, isBatchTracked, isExpiryTracked fields per the Create Item example in docs/03-sad/18-module-warehouse.md Section 6.1.
- Infrastructure layer: Prisma migration for the `warehouse_items` table (audit columns, soft delete) per docs/04-ai-contract/06-database-contract.md.
- `IItemRepository` interface + Prisma implementation.

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

Creates warehouse_items table with audit + soft-delete columns per docs/04-ai-contract/06-database-contract.md.

## API Impact

None in this task (entity/migration only; endpoints in task-096/097).

## Workflow Impact

Foundational master data for all Warehouse workflows (Procurement, Stock Movement, Automatic Stock Update).

## Security Impact

No direct endpoint; downstream endpoints are gated by warehouse.item.read / warehouse.item.manage permissions.

## Testing Required

- Unit tests for the Use Case/Entity (per docs/05-testing/unit-tests.md).
- Integration test for Controller/Repository (per docs/05-testing/api-tests.md).

## Deliverables

- `Item` entity (domain/entities/)
- `IItemRepository` interface + Prisma implementation
- Prisma migration for warehouse_items

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/warehouse.md (sourced from docs/03-sad/18-module-warehouse.md):

- Entity enforces required fields from the Create Item example (code, name, categoryId, unitId, minimumStock, isConsumable, isBatchTracked, isExpiryTracked).
- Migration matches docs/04-ai-contract/06-database-contract.md audit/soft-delete conventions.

## Definition of Done

Entity and migration implemented and unit-tested; no orphaned category/unit references.

---

## Dependency Detail

- **Blocked By:** task-013, task-014, task-006
- **Required Before:** See phase-3-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
