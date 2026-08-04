# Epic X: Stock Movement — Documentation (task-115–126)

---

## Documentation Reviewed

- `docs/06-tasks/task-115.md`–`task-126.md`
- `docs/03-sad/18-module-warehouse.md` UC-WHS-004 (Transfer), UC-WHS-005 (Adjustment), UC-WHS-007 (Reservation), Section 6.3, Section 6.5 error codes

## Task List

| Task | Name |
|---|---|
| task-115 | Stock Transfer (Entity & Migration) — draft→submitted→approved→dispatched→received; `sourceWarehouseId != destinationWarehouseId` |
| task-116 | Create Transfer Draft (`POST /warehouse/transfers`) |
| task-117 | Submit Transfer |
| task-118 | Approve Transfer (maker-checker) |
| task-119 | Dispatch Transfer (`WHS_STOCK_INSUFFICIENT`, writes outbound ledger at source) |
| task-120 | Receive Transfer (writes inbound ledger at destination — Automatic Stock Update for transfers) |
| task-121 | Stock Adjustment (Entity & Migration) — mandatory reason |
| task-122 | Create Stock Adjustment (draft) |
| task-123 | Approve Stock Adjustment (`WHS_ADJUSTMENT_APPROVAL_REQUIRED` gate) |
| task-124 | Post Stock Adjustment (ledger-writing boundary; `WHS_NEGATIVE_STOCK_FORBIDDEN`) |
| task-125 | Stock Reservation (Entity, Migration & `POST /warehouse/reservations`, `WHS_STOCK_INSUFFICIENT`) |
| task-126 | Release Reservation (`POST .../release`, idempotent no-op on double-release) |

## Implementation Plan

Three independent stock-movement flows sharing the same underlying `applyStockMovement` primitive on `IStockRepository`: inter-warehouse Transfer (draft→submitted→approved→dispatched→received, two-sided ledger write), Adjustment (draft→approved→posted, single-direction IN/OUT), and Reservation (create/release, no ledger write — a soft hold against `availableStock`).

## Files Created

- Use cases: `CreateStockTransferUseCase.ts`, `SubmitStockTransferUseCase.ts`, `ApproveStockTransferUseCase.ts`, `DispatchStockTransferUseCase.ts`, `ReceiveStockTransferUseCase.ts`, `ListStockTransferUseCase.ts`, `GetStockTransferUseCase.ts`, `CreateStockAdjustmentUseCase.ts`, `ApproveStockAdjustmentUseCase.ts`, `PostStockAdjustmentUseCase.ts`, `ListStockAdjustmentUseCase.ts`, `GetStockAdjustmentUseCase.ts`, `ReserveStockUseCase.ts`, `ReleaseStockReservationUseCase.ts`
- Tests: `StockTransferLifecycle.test.ts`, `StockAdjustmentLifecycle.test.ts`, `StockReservationLifecycle.test.ts`
- Services: `StockTransferNumberGenerator.ts`, `StockAdjustmentNumberGenerator.ts`, `StockTransactionNumberGenerator.ts` (shared)
- DTOs: `StockTransferRequestDto.ts`, `StockTransferResponseDto.ts`, `StockTransferQueryDto.ts`, `StockAdjustmentRequestDto.ts`, `StockAdjustmentResponseDto.ts`, `StockAdjustmentQueryDto.ts`, `StockReservationRequestDto.ts`, `StockReservationResponseDto.ts`
- Mappers: `StockTransferMapper.ts`, `StockAdjustmentMapper.ts`, `StockReservationMapper.ts`
- Repositories: `IStockTransferRepository.ts`, `IStockAdjustmentRepository.ts`, `IStockReservationRepository.ts` (+ Prisma implementations)
- Controllers: `StockTransferController.ts`, `StockAdjustmentController.ts`, `StockReservationController.ts`

## Files Modified

- `WarehouseExceptions.ts` (`StockTransferNotFoundException`, `SourceDestinationSameException`, `StockTransferNotInStatusException`, `StockInsufficientException`, `StockTransferAlreadyReceivedException`, `StockAdjustmentNotFoundException`, `StockAdjustmentNotInStatusException`, `AdjustmentApprovalRequiredException`, `NegativeStockForbiddenException`, `StockAdjustmentAlreadyPostedException`, `StockReservationNotFoundException`)
- `warehouse.routes.ts` (lines 411–483)
- `schema.prisma` (`StockTransfer`, `StockTransferItem`, `StockAdjustment`, `StockAdjustmentItem`, `StockReservation`, lines 2083–2218)

## Database Changes

`StockTransferStatus`: `DRAFT/SUBMITTED/APPROVED/DISPATCHED/RECEIVED`. `StockAdjustment` models direction at the header level (`StockAdjustmentDirection`: `IN/OUT`, one adjustment = one direction) rather than allowing mixed-direction lines — a schema-comment-documented match to the SAD's literal flat-column description. `StockAdjustmentStatus`: `DRAFT/APPROVED/POSTED`. `StockReservationStatus`: `ACTIVE/RELEASED`. `StockTransfer` uses two named relations (`TransferSource`/`TransferDestination`) to `WarehouseLocation`.

## API Changes

| Endpoint | Permission |
|---|---|
| Transfer create/submit/approve/dispatch/receive | `warehouse.stock.transfer` (shared across all steps — no per-step split exists in SAD §8.1; maker-checker enforced at use-case level instead) |
| Adjustment create/approve | `warehouse.stock.adjust` |
| Adjustment post | `warehouse.stock.adjust.post` (extrapolated, separate from Approve for segregation of duties, mirroring Epic W's `warehouse.purchase.post`) |
| Reservation create/release | `warehouse.stock.reserve` |
| Transfer/Adjustment list & detail GET | `warehouse.stock.read` |

**Documentation drift found:** list/detail GET routes for both Transfer (`GET /warehouse/transfers`, `GET /warehouse/transfers/{transferId}`) and Adjustment (`GET /warehouse/adjustments`, `GET /warehouse/adjustments/{adjustmentId}`) exist in `warehouse.routes.ts`, added post-launch beyond the original task-115–126/task-121–124 scope so the frontend could browse a transfer/adjustment after creating it, but are **not documented in `openapi.yaml`** — only the `POST` variants of those two paths appear in the spec. This is a real code/spec drift, not a missing feature.

## Frontend Changes

`apps/frontend/app/(dashboard)/warehouse/transfers/page.tsx` + `[id]/page.tsx`, `.../adjustments/page.tsx` + `[id]/page.tsx`, delegating to `StockTransferListPage.tsx`, `StockTransferDetailPage.tsx`, `StockAdjustmentListPage.tsx`, `StockAdjustmentDetailPage.tsx`, hooks `useStockTransfer.ts`, `useStockAdjustment.ts`. Reservation is **backend-only** — no frontend page exists, consistent with task-125/126's own Frontend Scope text.

## Security Validation

Maker-checker enforced at the use-case level (not purely via distinct permissions) for Transfer's Approve step; Adjustment's Post uses a distinct permission from Approve specifically for segregation of duties per task-124's own scope.

## Architecture Validation

`PostStockAdjustmentUseCase`, `ReceiveStockTransferUseCase`, and `DispatchStockTransferUseCase` all go through `IStockRepository`'s shared `applyStockMovement` primitive (also used by Epic W and Epic Y/Z) rather than direct table writes — a single, reused stock-mutation seam across the whole module. No Epic X ambiguity was flagged in `phase-3-plan.md`.
