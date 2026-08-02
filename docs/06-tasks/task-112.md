# task-112: Create Goods Receipt (POST /warehouse/goods-receipts)

**Phase:** Phase 3 - Operational Excellence
**Epic:** W. Procurement
**Feature:** W2. Goods Receipt
**Module:** Warehouse
**Priority:** P0 - Blocking

---

## Business Goal

Implement `CreateGoodsReceiptUseCase` per docs/03-sad/18-module-warehouse.md Section 6.2, validating against the approved PO before goods are recorded as received.

## Depends On

- task-111
- task-108 (Approve PO)

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md, docs/04-ai-contract/04-api-contract.md, docs/04-ai-contract/06-database-contract.md, docs/04-ai-contract/09-security-contract.md
- **PRD:** docs/01-prd/features/warehouse.md, docs/01-prd/business-rules.md § 7
- **SAD:** docs/03-sad/18-module-warehouse.md (Section 6.2 Purchase dan Goods Receipt)
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-111, task-108, task-013, task-014, task-006.

## Backend Scope

- Presentation layer: route, controller, DTO/validator for `POST /warehouse/goods-receipts` (payload per Section 6.2 example).
- Application layer: `CreateGoodsReceiptUseCase`; validates PO status is `approved` (else `WHS_PO_NOT_APPROVED` 409) and quantity does not exceed PO quantity without approval (else `WHS_RECEIPT_OVER_QUANTITY` 422).

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

Inserts into warehouse_goods_receipts/_items in `draft`/unposted status (stock is not yet affected until task-114 Post).

## API Impact

Adds POST /warehouse/goods-receipts.

## Workflow Impact

First step of UC-WHS-002 Receive Goods.

## Security Impact

Gated by warehouse receipt-create permission. Audit Trail entry required.

## Testing Required

- Unit tests for the Use Case/Entity (per docs/05-testing/unit-tests.md).
- Integration test for Controller/Repository (per docs/05-testing/api-tests.md).

## Deliverables

- `CreateGoodsReceiptUseCase`, route, controller, DTOs, tests

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/warehouse.md (sourced from docs/03-sad/18-module-warehouse.md):

- `WHS_PO_NOT_APPROVED` returned when PO isn't approved.
- `WHS_RECEIPT_OVER_QUANTITY` returned when quantity exceeds PO without approval.
- `WHS_BATCH_REQUIRED` returned when a batch-tracked item lacks batchNumber.

## Definition of Done

Use case implemented and tested against all three error codes above.

---

## Dependency Detail

- **Blocked By:** task-111, task-108
- **Required Before:** See phase-3-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
