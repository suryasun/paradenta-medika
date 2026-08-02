# task-120: Receive Transfer (POST /transfers/{transferId}/receive)

**Phase:** Phase 3 - Operational Excellence
**Epic:** X. Stock Movement
**Feature:** X1. Transfer
**Module:** Warehouse
**Priority:** P1 - High

---

## Business Goal

Add destination warehouse stock on receipt, completing UC-WHS-004 — the transfer-side realization of 'Automatic Stock Update'.

## Depends On

- task-115
- task-102
- task-103

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md, docs/04-ai-contract/04-api-contract.md, docs/04-ai-contract/06-database-contract.md, docs/04-ai-contract/09-security-contract.md
- **PRD:** docs/01-prd/features/warehouse.md, docs/01-prd/business-rules.md § 7
- **SAD:** docs/03-sad/18-module-warehouse.md (Section 4.2 UC-WHS-004 Transfer Stock, Section 6.3 Stock Movement)
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-115, task-013, task-014, task-006.

## Backend Scope

- Presentation layer: route, controller, DTO/validator for `POST /warehouse/transfers/{transferId}/receive`.
- Application layer: `ReceiveStockTransferUseCase`.

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

Updates warehouse_transfers status; dispatch/receive steps also write warehouse_stock_ledger and update warehouse_stocks per UC-WHS-004.

## API Impact

Adds POST /warehouse/transfers/{transferId}/receive per docs/03-sad/18-module-warehouse.md Section 6.3.

## Workflow Impact

Step in UC-WHS-004 Transfer Stock.

## Security Impact

Gated by transfer-scoped permission. Audit Trail entry required.

## Testing Required

- Unit tests for the Use Case/Entity (per docs/05-testing/unit-tests.md).
- Integration test for Controller/Repository (per docs/05-testing/api-tests.md).

## Deliverables

- `ReceiveStockTransferUseCase`, route, controller, tests

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/warehouse.md (sourced from docs/03-sad/18-module-warehouse.md):

- Writes an inbound warehouse_stock_ledger entry at the destination warehouse.
- Transfer status becomes `received`/completed; idempotent against `WHS_DUPLICATE_MOVEMENT`.

## Definition of Done

Use case implemented and tested; matches the UC-WHS-004 flowchart step.

---

## Dependency Detail

- **Blocked By:** task-115
- **Required Before:** See phase-3-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
