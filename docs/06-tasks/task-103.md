# task-103: Stock Ledger (GET /warehouse/stocks/{stockId}/ledger)

**Phase:** Phase 3 - Operational Excellence
**Epic:** V. Warehouse Foundation
**Feature:** V4. Stock Read
**Module:** Warehouse
**Priority:** P1 - High

---

## Business Goal

Implement `GetStockLedgerUseCase` exposing the immutable in/out/running-balance ledger per stock line, per docs/03-sad/18-module-warehouse.md Section 6.1 and Section 4.5 Stock Card report.

## Depends On

- task-102 (Stock)
- task-013 (Authentication Middleware)
- task-014 (Authorization Middleware)
- task-006 (Audit Trail Service)

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md, docs/04-ai-contract/04-api-contract.md, docs/04-ai-contract/06-database-contract.md, docs/04-ai-contract/09-security-contract.md
- **PRD:** docs/01-prd/features/warehouse.md, docs/01-prd/business-rules.md § 7
- **SAD:** docs/03-sad/18-module-warehouse.md (Section 6.1 Item/Supplier/Warehouse API, Section 4.5 Inventory Reports)
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-102, task-013, task-014, task-006.

## Backend Scope

- Domain layer: `StockLedgerEntry` value object (movement type, reference, quantity, running balance).
- Application layer: `GetStockLedgerUseCase` for `GET /warehouse/stocks/{stockId}/ledger`, gated by `warehouse.stock.read`.

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

Read-only; queries the ledger rows written by Goods Receipt, Transfer, Adjustment, Opname, and Automatic Stock Update tasks.

## API Impact

Adds GET /warehouse/stocks/{stockId}/ledger.

## Workflow Impact

Provides traceability for every stock-affecting workflow (Section 4.5 Stock Card report).

## Security Impact

Gated by warehouse.stock.read. Ledger itself is append-only (no update/delete endpoint exists).

## Testing Required

- Unit tests for the Use Case/Entity (per docs/05-testing/unit-tests.md).
- Integration test for Controller/Repository (per docs/05-testing/api-tests.md).

## Deliverables

- `GetStockLedgerUseCase`, route, controller, tests

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/warehouse.md (sourced from docs/03-sad/18-module-warehouse.md):

- Ledger entries are ordered chronologically with a correct running balance.
- 404 when stockId not found.

## Definition of Done

Endpoint implemented and tested; ledger entries traceable to their source reference (PO/GR/Transfer/Adjustment/Opname).

---

## Dependency Detail

- **Blocked By:** task-102, task-013, task-014, task-006
- **Required Before:** See phase-3-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
