# task-113: Get Goods Receipt (GET /warehouse/goods-receipts/{goodsReceiptId})

**Phase:** Phase 3 - Operational Excellence
**Epic:** W. Procurement
**Feature:** W2. Goods Receipt
**Module:** Warehouse
**Priority:** P1 - High

---

## Business Goal

Implement `GetGoodsReceiptUseCase` so a receipt can be reviewed before posting.

## Depends On

- task-111

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md, docs/04-ai-contract/04-api-contract.md, docs/04-ai-contract/06-database-contract.md, docs/04-ai-contract/09-security-contract.md
- **PRD:** docs/01-prd/features/warehouse.md, docs/01-prd/business-rules.md § 7
- **SAD:** docs/03-sad/18-module-warehouse.md (Section 6.2 Purchase dan Goods Receipt)
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-111, task-013, task-014, task-006.

## Backend Scope

- Presentation layer: route, controller for `GET /warehouse/goods-receipts/{goodsReceiptId}`.
- Application layer: `GetGoodsReceiptUseCase`.

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

Read-only.

## API Impact

Adds GET /warehouse/goods-receipts/{goodsReceiptId}.

## Workflow Impact

Supports review step before Post Goods Receipt.

## Security Impact

Gated by warehouse receipt-read permission.

## Testing Required

- Unit tests for the Use Case/Entity (per docs/05-testing/unit-tests.md).
- Integration test for Controller/Repository (per docs/05-testing/api-tests.md).

## Deliverables

- `GetGoodsReceiptUseCase`, route, controller, tests

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/warehouse.md (sourced from docs/03-sad/18-module-warehouse.md):

- 404 when goodsReceiptId not found.
- Response includes line items with batch/expiry.

## Definition of Done

Use case implemented and tested.

---

## Dependency Detail

- **Blocked By:** task-111
- **Required Before:** See phase-3-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
