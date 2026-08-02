# task-114: Post Goods Receipt (POST /goods-receipts/{goodsReceiptId}/post)

**Phase:** Phase 3 - Operational Excellence
**Epic:** W. Procurement
**Feature:** W2. Goods Receipt
**Module:** Warehouse
**Priority:** P0 - Blocking

---

## Business Goal

Implement `PostGoodsReceiptUseCase`, the transaction boundary that finalizes UC-WHS-002 by writing the stock ledger and incrementing on-hand quantity (warehouse_stocks (task-102)) — the core of the roadmap 'Automatic Stock Update' behaviour for procurement receipts.

## Depends On

- task-111
- task-112 (Create Goods Receipt)
- task-102 (Stock Balance)
- task-103 (Stock Ledger)

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md, docs/04-ai-contract/04-api-contract.md, docs/04-ai-contract/06-database-contract.md, docs/04-ai-contract/09-security-contract.md
- **PRD:** docs/01-prd/features/warehouse.md, docs/01-prd/business-rules.md § 7
- **SAD:** docs/03-sad/18-module-warehouse.md (Section 4.2 UC-WHS-002 Receive Goods, Section 6.2 API, Section 6.5 Error Codes)
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-112, task-102, task-103, task-013, task-014, task-006.

## Backend Scope

- Application layer: `PostGoodsReceiptUseCase` — within a DB transaction, writes a `warehouse_stock_ledger` entry per line item, increments `warehouse_stocks.quantityOnHand`/`quantityAvailable`, creates/updates the batch record (task-134) if batch-tracked, and sets the receipt to `posted`.
- Idempotent on the goods receipt's source reference: reposting the same receipt returns `WHS_DUPLICATE_MOVEMENT` (409).
- Publishes a `warehouse.goods-receipt.posted.v1` domain event per docs/03-sad/02-system-architecture.md Event Catalog.

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

Inserts into warehouse_stock_ledger; updates warehouse_stocks and warehouse_batches; updates warehouse_goods_receipts status to posted.

## API Impact

Adds POST /warehouse/goods-receipts/{goodsReceiptId}/post.

## Workflow Impact

Completion of UC-WHS-002; the point at which Inventory Management balances reflect the procured stock (Automatic Stock Update).

## Security Impact

Gated by warehouse receipt-post permission (typically separate from receipt-create per segregation of duties). Audit Trail entry required. `Idempotency-Key` header required (high-risk mutating command).

## Testing Required

- Unit tests for the Use Case/Entity (per docs/05-testing/unit-tests.md).
- Integration test for Controller/Repository (per docs/05-testing/api-tests.md).

## Deliverables

- `PostGoodsReceiptUseCase`, route, controller, tests
- `warehouse.goods-receipt.posted.v1` event publisher

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/warehouse.md (sourced from docs/03-sad/18-module-warehouse.md):

- Posting a receipt twice with the same reference returns `WHS_DUPLICATE_MOVEMENT` (409), no double increment.
- Stock ledger running balance matches quantityOnHand after posting.
- Event `warehouse.goods-receipt.posted.v1` is published exactly once per successful post.

## Definition of Done

Transaction boundary implemented; idempotency and event publication verified by integration test.

---

## Dependency Detail

- **Blocked By:** task-112, task-102, task-103
- **Required Before:** See phase-3-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
