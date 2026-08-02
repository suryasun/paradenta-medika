# task-136: Automatic Stock Update — Consume Material from EMR (Event Consumer)

**Phase:** Phase 3 - Operational Excellence
**Epic:** Z. Automatic Stock Update
**Feature:** Z1. Material Consumption Integration
**Module:** Warehouse
**Priority:** P0 - Blocking

---

## Business Goal

Implement the `ConsumeMaterialUseCase` event consumer per docs/03-sad/18-module-warehouse.md UC-WHS-003 Consume Material from EMR, delivering the roadmap Phase 3 Automation item 'Automatic Stock Update': when a treatment's material usage is finalized in EMR, Warehouse automatically deducts the consumed materials from stock using FEFO batch selection.

## Depends On

- task-102
- task-103
- task-134 (Batch)
- task-013 (Authentication Middleware)
- task-014 (Authorization Middleware)
- task-006 (Audit Trail Service)

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md, docs/04-ai-contract/04-api-contract.md, docs/04-ai-contract/06-database-contract.md, docs/04-ai-contract/09-security-contract.md
- **PRD:** docs/01-prd/features/warehouse.md, docs/01-prd/business-rules.md § 7
- **SAD:** docs/03-sad/18-module-warehouse.md (Section 4.2 UC-WHS-003 Consume Material from EMR, Section 6.5 Error Codes)
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-102, task-103, task-134, task-013, task-014, task-006.

## Backend Scope

- Application layer: `ConsumeMaterialUseCase`, an event-driven consumer that subscribes to the EMR material-finalization event and, within a DB transaction, selects consumable batches by FEFO (earliest expiryDate first), writes an outbound warehouse_stock_ledger entry per item, and decrements warehouse_stocks.quantityOnHand/quantityAvailable.
- Rejects with `WHS_STOCK_INSUFFICIENT` (409) if consumable quantity is insufficient, and with `WHS_BATCH_EXPIRED` (422) if the only available batch has expired.
- Idempotent per source EMR reference (`WHS_DUPLICATE_MOVEMENT` 409 on redelivery).

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

Inserts into warehouse_stock_ledger; updates warehouse_stocks and warehouse_batches quantities.

## API Impact

None (event-driven consumer, no new synchronous endpoint). Consumes the domain event published by the EMR module's treatment-material-finalization use case.

## Workflow Impact

Automates the EMR → Warehouse stock deduction step of the Patient Journey's clinical/consumption flow, per docs/03-sad/02-system-architecture.md Event Catalog cross-module integration pattern.

## Security Impact

Runs as a trusted system worker (no end-user permission gate); all writes carry a system-actor Audit Trail entry with correlation id back to the source EMR event.

## Testing Required

- Unit tests for the Use Case/Entity (per docs/05-testing/unit-tests.md).
- Integration test for Controller/Repository (per docs/05-testing/api-tests.md).

## Deliverables

- `ConsumeMaterialUseCase` event consumer
- FEFO batch-selection domain service
- Unit + integration tests including idempotent-redelivery test

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/warehouse.md (sourced from docs/03-sad/18-module-warehouse.md):

- FEFO selection always chooses the batch with the earliest non-expired expiryDate first.
- `WHS_STOCK_INSUFFICIENT` and `WHS_BATCH_EXPIRED` both covered by tests.
- Redelivering the same source EMR event does not double-deduct stock (`WHS_DUPLICATE_MOVEMENT` semantics honored idempotently, i.e. the second delivery is a safe no-op, not a user-facing error).

## Definition of Done

Event consumer implemented, tested, and verified idempotent under redelivery. **Ambiguity flagged (see phase-3-plan.md):** the exact Phase 2 EMR task ID and event name that finalizes treatment material usage are not enumerated as a literal event name in any single SAD section reviewed; this task consumes the conceptual event described in UC-WHS-003 and docs/03-sad/02-system-architecture.md's cross-module event pattern. The literal event name/schema must be confirmed against the EMR module's implementation (Phase 2 Epic M/L) before this consumer is wired to a live topic.

---

## Dependency Detail

- **Blocked By:** task-102, task-103, task-134
- **Required Before:** See phase-3-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
