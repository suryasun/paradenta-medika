# Epic Y: Stock Opname & Batch — Documentation (task-127–135)

---

## Documentation Reviewed

- `docs/06-tasks/task-127.md`–`task-135.md`
- `docs/03-sad/18-module-warehouse.md` UC-WHS-006 (Physical Count / Stock Opname), Section 6.4, Section 6.5 error codes

## Task List

| Task | Name |
|---|---|
| task-127 | Stock Opname (Entity & Migration) — `WHS_OPNAME_ALREADY_ACTIVE`, one active opname per warehouse |
| task-128 | Create/List Stock Opname (`POST/GET /warehouse/stock-opnames`) |
| task-129 | Get/Update Stock Opname (`GET/PATCH .../{opnameId}`) |
| task-130 | Start Count (`POST .../start-count`) — freezes system-quantity snapshot |
| task-131 | Submit Stock Opname (`POST .../submit`) — computes variance per line |
| task-132 | Approve Stock Opname (`POST .../approve`) — maker-checker |
| task-133 | Post Stock Opname (`POST .../post`) — writes variance to ledger, Automatic Stock Update realization |
| task-134 | Batch (Entity, Migration & `GET /warehouse/batches`, FEFO support) |
| task-135 | Quarantine Batch (`POST /warehouse/batches/{batchId}/quarantine`) |

## Implementation Plan

Stock Opname (physical count) lifecycle: Create (scope only) → Start Count (freezes `systemQuantity` snapshot, `DRAFT`→`COUNTING`) → Submit (computes per-line variance) → Approve (maker-checker) → Post (writes variance to the stock ledger). Task-130/131 deliberately split the SAD's single narrative step ("system takes a balance snapshot when opname opens") into two discrete use cases, using task-130's own AC ("snapshot immutable once counting starts") as the literal source of truth. Batch tracks per-lot expiry for FEFO allocation, consumed by Epic W's Post Goods Receipt (writer) and Epic Z's Consume Material (FEFO reader).

## Files Created

- Use cases: `CreateStockOpnameUseCase.ts`, `ListStockOpnamesUseCase.ts`, `GetStockOpnameUseCase.ts`, `UpdateStockOpnameUseCase.ts`, `StartStockOpnameCountUseCase.ts`, `SubmitStockOpnameUseCase.ts`, `ApproveStockOpnameUseCase.ts`, `PostStockOpnameUseCase.ts`, `ListBatchesUseCase.ts`, `QuarantineBatchUseCase.ts`
- Tests: `StockOpnameLifecycle.test.ts`, `BatchQuarantine.test.ts`
- Service: `StockOpnameNumberGenerator.ts`
- DTOs: `StockOpnameRequestDto.ts`, `StockOpnameResponseDto.ts`, `StockOpnameQueryDto.ts`, `BatchQueryDto.ts`, `BatchResponseDto.ts`
- Mappers: `StockOpnameMapper.ts`, `BatchMapper.ts`
- Repositories: `IStockOpnameRepository.ts`, `IBatchRepository.ts` (+ Prisma implementations)
- Controllers: `StockOpnameController.ts`, `BatchController.ts`

## Files Modified

- `WarehouseExceptions.ts` (`StockOpnameNotFoundException`, `StockOpnameAlreadyActiveException`, `StockOpnameNotInStatusException`, `StockOpnameAlreadyPostedException`, `StockOpnameItemNotInScopeException`, `BatchNotFoundException`, `BatchNotActiveException`)
- `warehouse.routes.ts` (lines 485–531)
- `schema.prisma` (`StockOpname`, `StockOpnameItem`, `ItemBatch`, lines 2227–2349)

## Database Changes

`StockOpnameStatus`: `DRAFT/COUNTING/SUBMITTED/APPROVED/POSTED/REJECTED`. `WHS_OPNAME_ALREADY_ACTIVE` is enforced at the **application layer**, not a DB constraint — MySQL has no native partial-unique index for "active" excluding `POSTED`/`REJECTED`. `ItemBatchStatus`: `ACTIVE/QUARANTINED/EXPIRED/DEPLETED`; `ItemBatch` is unique on `[warehouseId, itemId, batchNumber]`; `remainingQuantity` is documented as never directly client-written — only mutated by consumption/transfer/quarantine flows.

## API Changes

| Endpoint | Permission |
|---|---|
| `GET /warehouse/stock-opnames` / `POST` | `warehouse.opname.read` / `.create` |
| `GET/PATCH .../{opnameId}` | `warehouse.opname.read` / `.create` (Update reuses Create) |
| `POST .../start-count`, `.../submit` | `warehouse.opname.count` (both reuse the same permission) |
| `POST .../approve` | `warehouse.opname.approve` |
| `POST .../post` | `warehouse.opname.post` (deliberately Manager-only, justified against the SAD's Actor Matrix even though §8.1 doesn't explicitly split it) |
| `GET /warehouse/batches` | `warehouse.batch.read` |
| `POST .../quarantine` | `warehouse.batch.quarantine` |

All 9 endpoints confirmed present in both `warehouse.routes.ts` and `openapi.yaml` (lines 3535–3697). Unlike Epic X, this group's permission catalog needed no extrapolated additions — `warehouse.opname.*` is the literal Section 8.1 catalog.

## Frontend Changes

`apps/frontend/app/(dashboard)/warehouse/stock-opnames/page.tsx` + `[id]/page.tsx`, `.../batches/page.tsx`, delegating to `StockOpnameListPage.tsx`, `StockOpnameDetailPage.tsx`, `BatchListPage.tsx`, hooks `useStockOpname.ts`, `useBatches.ts`.

## Security Validation

Maker-checker enforced across Submit→Approve→Post with three distinct permission codes. `QuarantineBatchUseCase` requires the dedicated `warehouse.batch.quarantine` permission rather than reusing a generic write permission.

## Architecture Validation

`QuarantineBatchUseCase` correctly updates both `ItemBatch.status` and the related `WarehouseStock.availableStock` — quantity stays in `quantityOnHand` but is removed from `quantityAvailable` until a formal Adjustment/Opname corrects it, exactly matching task-135's own scoped behavior. No Epic Y ambiguity was flagged in `phase-3-plan.md`.
