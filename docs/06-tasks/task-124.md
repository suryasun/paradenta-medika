# task-124: Post Stock Adjustment (POST /adjustments/{adjustmentId}/post)

**Phase:** Phase 3 - Operational Excellence
**Epic:** X. Stock Movement
**Feature:** X2. Adjustment
**Module:** Warehouse
**Priority:** P1 - High

---

## Business Goal

Implement `PostStockAdjustmentUseCase`, the ledger-writing transaction boundary completing UC-WHS-005.

## Depends On

- task-123 (Approve Adjustment)
- task-102
- task-103

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md, docs/04-ai-contract/04-api-contract.md, docs/04-ai-contract/06-database-contract.md, docs/04-ai-contract/09-security-contract.md
- **PRD:** docs/01-prd/features/warehouse.md, docs/01-prd/business-rules.md § 7
- **SAD:** docs/03-sad/18-module-warehouse.md (Section 4.2 UC-WHS-005, Section 6.5 Error Codes)
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-123, task-102, task-103, task-013, task-014, task-006.

## Backend Scope

- Application layer: `PostStockAdjustmentUseCase` — within a DB transaction, writes warehouse_stock_ledger entries and updates warehouse_stocks; rejects if adjustment not `approved` (`WHS_ADJUSTMENT_APPROVAL_REQUIRED`); rejects if the resulting balance would go negative (`WHS_NEGATIVE_STOCK_FORBIDDEN`).
- Publishes a `warehouse.stock-adjustment.posted.v1` domain event.

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

Inserts into warehouse_stock_ledger; updates warehouse_stocks; sets warehouse_adjustments status to posted.

## API Impact

Adds POST /warehouse/adjustments/{adjustmentId}/post.

## Workflow Impact

Completion of UC-WHS-005; realizes 'Automatic Stock Update' for adjustments.

## Security Impact

Gated by adjustment-post permission (separate from approve per segregation of duties). `Idempotency-Key` required. Audit Trail entry required.

## Testing Required

- Unit tests for the Use Case/Entity (per docs/05-testing/unit-tests.md).
- Integration test for Controller/Repository (per docs/05-testing/api-tests.md).

## Deliverables

- `PostStockAdjustmentUseCase`, route, controller, tests
- Event publisher

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/warehouse.md (sourced from docs/03-sad/18-module-warehouse.md):

- `WHS_NEGATIVE_STOCK_FORBIDDEN` returned when posting would drive balance negative.
- Reposting returns `WHS_DUPLICATE_MOVEMENT`.

## Definition of Done

Transaction boundary implemented and tested against both error codes.

---

## Dependency Detail

- **Blocked By:** task-123, task-102, task-103
- **Required Before:** See phase-3-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
