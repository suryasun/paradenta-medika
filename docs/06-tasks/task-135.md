# task-135: Quarantine Batch (POST /batches/{batchId}/quarantine)

**Phase:** Phase 3 - Operational Excellence
**Epic:** Y. Stock Opname & Batch
**Feature:** Y2. Batch
**Module:** Warehouse
**Priority:** P1 - High

---

## Business Goal

Implement `QuarantineBatchUseCase` so an expired or defective batch can be removed from available/consumable stock without a full adjustment cycle.

## Depends On

- task-134 (Batch)

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md, docs/04-ai-contract/04-api-contract.md, docs/04-ai-contract/06-database-contract.md, docs/04-ai-contract/09-security-contract.md
- **PRD:** docs/01-prd/features/warehouse.md, docs/01-prd/business-rules.md § 7
- **SAD:** docs/03-sad/18-module-warehouse.md (Section 6.4 Stock Opname dan Batch)
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-134, task-013, task-014, task-006.

## Backend Scope

- Presentation layer: route, controller for `POST /warehouse/batches/{batchId}/quarantine`.
- Application layer: `QuarantineBatchUseCase` — sets batch status to `quarantined`, moves its quantity out of `quantityAvailable` on the related Stock row (but keeps it in quantityOnHand until a formal Adjustment/Opname corrects it).

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

Updates warehouse_batches status; updates warehouse_stocks.quantityAvailable.

## API Impact

Adds POST /warehouse/batches/{batchId}/quarantine.

## Workflow Impact

Prevents an expired/defective batch from being selected by FEFO logic in downstream consumption/transfer workflows.

## Security Impact

Gated by warehouse batch-manage permission. Audit Trail entry required.

## Testing Required

- Unit tests for the Use Case/Entity (per docs/05-testing/unit-tests.md).
- Integration test for Controller/Repository (per docs/05-testing/api-tests.md).

## Deliverables

- `QuarantineBatchUseCase`, route, controller, tests

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/warehouse.md (sourced from docs/03-sad/18-module-warehouse.md):

- Quarantined batch no longer selectable by any FEFO-based reservation/consumption use case.

## Definition of Done

Use case implemented and tested.

---

## Dependency Detail

- **Blocked By:** task-134
- **Required Before:** See phase-3-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
