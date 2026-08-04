# Epic Z: Automatic Stock Update — Documentation (task-136)

---

## Documentation Reviewed

- `docs/06-tasks/task-136.md`
- `docs/03-sad/18-module-warehouse.md` UC-WHS-003 (Consume Material from EMR)
- `docs/06-tasks/phase-3-plan.md` Ambiguity #1 (EMR material-consumption event contract not enumerated with field-level schema anywhere reviewed)

## Task List

| Task | Name |
|---|---|
| task-136 | Automatic Stock Update — EMR Material Consumption (event consumer) |

## Implementation Plan

`ConsumeMaterialUseCase` subscribes to an EMR-published domain event and, on delivery, FEFO-allocates the consumed materials across `ItemBatch` rows and posts one `TREATMENT`-typed stock transaction per allocation.

## Important timeline note (read before treating this epic as simply "done")

`phase-3-plan.md`'s own Ambiguity #1 flagged that no literal event name/payload schema for this consumer existed anywhere in the reviewed SAD sections at planning time. The commit that closed out Phase 3 (`9fb2771`, "Epic AL... completes Phase 3") explicitly recorded task-136 as one of **two permanently-documented, genuinely-blocked deferrals** at that point in time: *"no schema links EMR treatments to consumed Warehouse materials."* However, the actual current source tree (as of this documentation pass) contains a complete, working implementation — the event contract was defined and wired **after** the Phase-3-completion commit, as later (currently uncommitted) work layered on top. This is recorded here for accuracy rather than silently treating the epic as having shipped inside the original Phase 3 commit sequence.

## Ambiguity #1 resolution (verified directly in code)

- **Event definition** (EMR-owned, per module-contract boundary rules): `apps/backend/src/modules/emr/domain/events/EmrEvents.ts` line 29 — `export const TREATMENT_MATERIAL_FINALIZED_EVENT = 'emr.treatment-material-finalized.v1';`, with payload interface `TreatmentMaterialFinalizedPayload` (`visitId`, `treatmentId`, `visitTreatmentId`, `branchId`, `warehouseId`, `materials[]`, `occurredAt`).
- **Subscription wiring**: `apps/backend/src/modules/warehouse/presentation/routes/warehouse.routes.ts` lines 138–179 — `eventBus.subscribe<TreatmentMaterialFinalizedPayload>(TREATMENT_MATERIAL_FINALIZED_EVENT, async (payload) => {...})`, wrapped in try/catch that on failure publishes `warehouse.material-consumption-failed.v1` instead of letting the exception propagate back into EMR's `CloseVisitUseCase` — explicitly citing UC-WHS-003's rule that a stock shortfall must not change EMR state directly.
- **Consumer logic**: `apps/backend/src/modules/warehouse/application/use-cases/ConsumeMaterialUseCase.ts` (189 lines) — validates `item.isConsumable`, FEFO-allocates across `ItemBatch` rows (ascending `expiryDate`, non-expiry batches last), posts one `TREATMENT`-typed `StockTransaction` per allocation via `stockRepository.applyStockMovement`, and on success publishes `warehouse.material-consumed.v1`.
- **Idempotency**: keyed on `visitTreatmentId` (`referenceType='EMR_TREATMENT_MATERIAL', referenceId=visitTreatmentId`) at the **application layer**, deliberately not relying solely on the DB `idempotency_key` unique index — the use case's own doc comment explains MySQL treats a null `batchId` as distinct per row under unique-index NULL semantics, so the DB index alone can't catch redelivery for non-batch-tracked items.
- **FEFO/expiry distinction**: if eligible (non-expired) batches can't cover the requested quantity but expired `ACTIVE` batches exist with remaining stock, `BatchExpiredException` (`WHS_BATCH_EXPIRED`) is thrown instead of the generic `StockInsufficientException` (`WHS_STOCK_INSUFFICIENT`) — distinguishing "stock exists but expired" from "no stock at all."

## Files Created

- `apps/backend/src/modules/warehouse/application/use-cases/ConsumeMaterialUseCase.ts` + `.test.ts`
- Event contract addition (EMR-owned): `apps/backend/src/modules/emr/domain/events/EmrEvents.ts`

## Files Modified

- `apps/backend/src/modules/warehouse/domain/exceptions/WarehouseExceptions.ts` (`ItemNotConsumableException`, `MaterialConsumptionAlreadyProcessedException` mapping to `WHS_DUPLICATE_MOVEMENT`)
- `apps/backend/src/modules/warehouse/presentation/routes/warehouse.routes.ts` (event subscription wiring)

## Database Changes

No new tables. Writes to `StockTransaction` (via `applyStockMovement`) and decrements `ItemBatch.remainingQuantity` via `batchRepository.decrementRemaining`.

## API Changes

None — a pure event-driven consumer, matching task-136's own API Impact ("None"). No synchronous endpoint exists.

## Frontend Changes

None — backend-only, matching task-136's own Frontend Scope.

## Security Validation

Runs as a trusted system worker with `actorUserId: 'system:material-consume'` hardcoded in the subscription handler — no end-user permission gate, matching task-136's "system-actor Audit Trail entry" requirement. Audit entry recorded via `auditService.record('VisitTreatmentMaterial', ...)`.

## Architecture Validation

Warehouse subscribes to an EMR-owned event via the shared `IEventBus` abstraction (`apps/backend/src/shared/events/EventBus.ts`) and never reads EMR's tables directly — the cleanest, most literal confirmation across the whole Phase 3 codebase that the cross-module "events only" rule (`docs/04-ai-contract/07-module-contract.md`) was actually followed in practice, not just described. This closes Ambiguity #1's Warehouse side; the Finance side (task-162, Epic AE) is documented separately in `epic-ae-daily-closing-settlement-period.md`.
