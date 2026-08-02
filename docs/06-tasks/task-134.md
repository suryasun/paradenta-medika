# task-134: Batch (Entity, Migration & GET /warehouse/batches)

**Phase:** Phase 3 - Operational Excellence
**Epic:** Y. Stock Opname & Batch
**Feature:** Y2. Batch
**Module:** Warehouse
**Priority:** P1 - High

---

## Business Goal

Create the `Batch` entity/migration and `ListBatchesUseCase` so batch-tracked, expiry-tracked items (per Item flags in task-095) can be traced and near-expiry stock identified (roadmap Inventory Management + Expiry Report).

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
- **SAD:** docs/03-sad/18-module-warehouse.md (Section 5 Data Model, Section 6.4 Stock Opname dan Batch)
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-095, task-100, task-102, task-013, task-014, task-006.

## Backend Scope

- Domain layer: `Batch` entity (itemId, warehouseId, batchNumber, expiryDate, quantity, status active/quarantined/expired).
- Infrastructure layer: Prisma migration for `warehouse_batches`; `IBatchRepository` + Prisma implementation.
- Application layer: `ListBatchesUseCase` for `GET /warehouse/batches`.

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

Creates warehouse_batches table (populated by Goods Receipt task-114 when isBatchTracked).

## API Impact

Adds GET /warehouse/batches.

## Workflow Impact

Supports FEFO (First-Expired-First-Out) selection referenced across Warehouse consumption workflows.

## Security Impact

Gated by warehouse.stock.read.

## Testing Required

- Unit tests for the Use Case/Entity (per docs/05-testing/unit-tests.md).
- Integration test for Controller/Repository (per docs/05-testing/api-tests.md).

## Deliverables

- `Batch` entity
- Migration, repository
- `ListBatchesUseCase`, route, controller, tests

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/warehouse.md (sourced from docs/03-sad/18-module-warehouse.md):

- List supports filter by itemId, warehouseId, expiry range, status.
- `WHS_BATCH_EXPIRED` (422) is the reserved error for any writer attempting to consume an expired batch (enforced downstream).

## Definition of Done

Entity, migration, and list endpoint implemented and tested.

---

## Dependency Detail

- **Blocked By:** task-095, task-100, task-102, task-013, task-014, task-006
- **Required Before:** See phase-3-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
