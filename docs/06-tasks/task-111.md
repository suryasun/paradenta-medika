# task-111: Goods Receipt (Entity & Migration)

**Phase:** Phase 3 - Operational Excellence
**Epic:** W. Procurement
**Feature:** W2. Goods Receipt
**Module:** Warehouse
**Priority:** P0 - Blocking

---

## Business Goal

Create the `GoodsReceipt` aggregate (header + line items with batch/expiry) and migration per docs/03-sad/18-module-warehouse.md UC-WHS-002 (Receive Goods).

## Depends On

- task-104
- task-095
- task-100
- task-013 (Authentication Middleware)
- task-014 (Authorization Middleware)
- task-006 (Audit Trail Service)

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md, docs/04-ai-contract/04-api-contract.md, docs/04-ai-contract/06-database-contract.md, docs/04-ai-contract/09-security-contract.md
- **PRD:** docs/01-prd/features/warehouse.md, docs/01-prd/business-rules.md § 7
- **SAD:** docs/03-sad/18-module-warehouse.md (Section 4.2 UC-WHS-002 Receive Goods, Section 5 Data Model, Section 6.2 API)
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-104, task-095, task-100, task-013, task-014, task-006.

## Backend Scope

- Domain layer: `GoodsReceipt` aggregate (purchaseOrderId, warehouseId, receiptDate, supplierDocumentNo, line items with batchNumber/expiryDate) per Section 6.2 example.
- Infrastructure layer: Prisma migration for `warehouse_goods_receipts` and `warehouse_goods_receipt_items`.
- `IGoodsReceiptRepository` interface + Prisma implementation.

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

Creates warehouse_goods_receipts and warehouse_goods_receipt_items tables (FK to purchase order, item, warehouse).

## API Impact

None in this task (endpoints in task-112 through task-114).

## Workflow Impact

Second half of UC-WHS-002 Receive Goods.

## Security Impact

No direct endpoint; downstream gated by receipt-related permissions.

## Testing Required

- Unit tests for the Use Case/Entity (per docs/05-testing/unit-tests.md).
- Integration test for Controller/Repository (per docs/05-testing/api-tests.md).

## Deliverables

- `GoodsReceipt` aggregate
- `IGoodsReceiptRepository` + Prisma implementation
- Migration for warehouse_goods_receipts(_items)

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/warehouse.md (sourced from docs/03-sad/18-module-warehouse.md):

- Line items validate batchNumber/expiryDate when the referenced item isBatchTracked/isExpiryTracked.
- `WHS_BATCH_REQUIRED` (422) enforced.

## Definition of Done

Aggregate and migration implemented and unit-tested.

---

## Dependency Detail

- **Blocked By:** task-104, task-095, task-100, task-013, task-014, task-006
- **Required Before:** See phase-3-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
