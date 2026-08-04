# Epic W: Procurement — Documentation (task-104–114)

---

## Documentation Reviewed

- `docs/06-tasks/task-104.md`–`task-114.md`
- `docs/03-sad/18-module-warehouse.md` UC-WHS-001 (Purchase Order lifecycle), UC-WHS-002 (Goods Receipt), Section 6.2, Section 6.5 error codes
- `docs/06-tasks/phase-3-plan.md` Critical Path (task-095 → task-104 → task-108 → task-111 → task-112 → task-114 as the first real Automatic Stock Update realization)

## Task List

| Task | Name |
|---|---|
| task-104 | Purchase Order (Entity & Migration) — draft→submitted→approved/rejected→cancelled |
| task-105 | Create/List PO (`POST/GET /warehouse/purchase-orders`) |
| task-106 | Get/Update PO (`GET/PATCH /warehouse/purchase-orders/{purchaseOrderId}`) |
| task-107 | Submit PO (`POST .../submit`) |
| task-108 | Approve PO (`POST .../approve`) — maker-checker |
| task-109 | Reject PO (`POST .../reject`) — mandatory reason |
| task-110 | Cancel PO (`POST .../cancel`) |
| task-111 | Goods Receipt (Entity & Migration) |
| task-112 | Create Goods Receipt (`POST /warehouse/goods-receipts`) |
| task-113 | Get Goods Receipt (`GET /warehouse/goods-receipts/{goodsReceiptId}`) |
| task-114 | Post Goods Receipt (`POST .../post`) — the Automatic Stock Update transaction boundary |

## Implementation Plan

Purchase Order maker-checker lifecycle (Create→Submit→Approve/Reject→Cancel) followed by Goods Receipt against an approved PO, with Post Goods Receipt as the point where stock is actually incremented (FEFO batch upsert). `PurchaseOrderStatus` extends the task text's literal 5-state lifecycle with two extra receipt-tracking states (`PARTIALLY_RECEIVED`/`RECEIVED`), and `PurchaseOrderItem.quantityReceived` is a running total across posted receipts, enforcing quantity-received never exceeding ordered (except a documented over-receipt approval path).

## Files Created

- `apps/backend/src/modules/warehouse/application/use-cases/CreatePurchaseOrderUseCase.ts`, `ListPurchaseOrdersUseCase.ts`, `GetPurchaseOrderUseCase.ts`, `UpdatePurchaseOrderUseCase.ts`, `SubmitPurchaseOrderUseCase.ts`, `ApprovePurchaseOrderUseCase.ts`, `RejectPurchaseOrderUseCase.ts`, `CancelPurchaseOrderUseCase.ts`, `CreateGoodsReceiptUseCase.ts`, `GetGoodsReceiptUseCase.ts`, `PostGoodsReceiptUseCase.ts`
- `apps/backend/src/modules/warehouse/application/use-cases/PurchaseOrderLifecycle.test.ts`, `GoodsReceiptLifecycle.test.ts`
- `apps/backend/src/modules/warehouse/application/services/PurchaseOrderNumberGenerator.ts`, `GoodsReceiptNumberGenerator.ts`
- `apps/backend/src/modules/warehouse/application/dtos/PurchaseOrderRequestDto.ts`, `PurchaseOrderResponseDto.ts`, `PurchaseOrderQueryDto.ts`, `GoodsReceiptRequestDto.ts`, `GoodsReceiptResponseDto.ts`
- `apps/backend/src/modules/warehouse/application/mappers/PurchaseOrderMapper.ts`, `GoodsReceiptMapper.ts`
- `apps/backend/src/modules/warehouse/domain/repositories/IPurchaseOrderRepository.ts`, `IGoodsReceiptRepository.ts` (+ Prisma implementations)
- `apps/backend/src/modules/warehouse/presentation/controllers/PurchaseOrderController.ts`, `GoodsReceiptController.ts`

## Files Modified

- `apps/backend/src/modules/warehouse/domain/exceptions/WarehouseExceptions.ts` (`PurchaseOrderNotFoundException`, `PurchaseOrderNotDraftException`, `PurchaseOrderNotInStatusException`, `WarehouseSegregationOfDutiesException`, `PurchaseOrderNotApprovedException`, `PurchaseOrderHasPostedReceiptsException`, `GoodsReceiptNotFoundException`, `ReceiptOverQuantityException`, `BatchRequiredException`, `GoodsReceiptAlreadyPostedException`)
- `apps/backend/src/modules/warehouse/presentation/routes/warehouse.routes.ts` (lines 340–409)
- `apps/backend/prisma/schema.prisma` (`PurchaseOrder`, `PurchaseOrderItem`, `GoodsReceipt`, `GoodsReceiptItem`, lines 1943–2062)

## Database Changes

`PurchaseOrder`/`PurchaseOrderItem`/`GoodsReceipt`/`GoodsReceiptItem`. `PurchaseOrderStatus`: `DRAFT/SUBMITTED/APPROVED/REJECTED/CANCELLED/PARTIALLY_RECEIVED/RECEIVED`. `GoodsReceiptStatus`: `DRAFT/POSTED`. `GoodsReceiptItem.batchNumber`/`expiryDate` are captured per line and later upserted into `ItemBatch` by `PostGoodsReceiptUseCase`.

## API Changes

| Endpoint | Permission |
|---|---|
| `GET/POST /warehouse/purchase-orders` | `warehouse.purchase.read` / `.create` |
| `GET/PATCH /warehouse/purchase-orders/{id}` | `warehouse.purchase.read` / `.create` |
| `POST .../submit` | `warehouse.purchase.submit` |
| `POST .../approve` | `warehouse.purchase.approve` |
| `POST .../reject` | `warehouse.purchase.approve` |
| `POST .../cancel` | `warehouse.purchase.cancel` |
| `POST /warehouse/goods-receipts` | `warehouse.purchase.receive` |
| `GET /warehouse/goods-receipts/{id}` | `warehouse.purchase.receive` |
| `POST .../post` | `warehouse.purchase.post` |

All 11 endpoints confirmed present in both `warehouse.routes.ts` and `openapi.yaml` (lines 3176–3369). Two permission-code deviations from the task specs' own imprecise wording are documented inline in `warehouse.routes.ts`: (1) the literal `warehouse.purchase.*` Section 8.1 catalog was used as the actual source of truth in preference to task-105/106's vaguer "warehouse.item.manage (procurement scope)" text; (2) `warehouse.purchase.post` is an extrapolated addition to that catalog, added because task-114 explicitly requires Post to be a separate permission from Create for segregation of duties.

## Frontend Changes

`apps/frontend/app/(dashboard)/warehouse/purchase-orders/page.tsx` + `[id]/page.tsx`, `.../goods-receipts/new/page.tsx` + `[id]/page.tsx`, delegating to `PurchaseOrderListPage.tsx`, `PurchaseOrderDetailPage.tsx`, `GoodsReceiptCreatePage.tsx`, `GoodsReceiptDetailPage.tsx` and hooks `usePurchaseOrder.ts`, `useGoodsReceipt.ts`.

## Security Validation

Nine distinct permission codes across the create→submit→approve→reject→cancel→receive→post chain (not a single blanket write permission), directly enforcing maker-checker: `ApprovePurchaseOrderUseCase` rejects approver === requester via `WarehouseSegregationOfDutiesException`, and `CancelPurchaseOrderUseCase` rejects cancellation once any Goods Receipt has been posted against the PO (`PurchaseOrderHasPostedReceiptsException`).

## Architecture Validation

`PostGoodsReceiptUseCase` correctly composes `stockRepository`, `itemRepository`, `batchRepository`, `StockTransactionNumberGenerator`, `auditService`, `eventBus` — all injected via the `warehouse.routes.ts` composition root, no direct cross-module DB access. No Epic W ambiguity was flagged in `phase-3-plan.md`.
