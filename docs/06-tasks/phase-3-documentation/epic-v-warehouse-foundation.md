# Epic V: Warehouse Foundation — Documentation (task-095–103)

---

## Documentation Reviewed

- `docs/06-tasks/task-095.md`–`task-103.md`
- `docs/03-sad/18-module-warehouse.md` Section 5 (Data Model), Section 6.1 (base CRUD/read endpoints), Section 6.5 (10 mandatory error codes)
- `docs/06-tasks/phase-3-plan.md` (no Epic V-specific ambiguity flagged)

## Task List

| Task | Name |
|---|---|
| task-095 | Item (Entity & Migration) |
| task-096 | Create/List Item (`POST/GET /warehouse/items`) |
| task-097 | Get/Update Item (`GET/PATCH /warehouse/items/{itemId}`) |
| task-098 | Supplier (Entity & Migration) |
| task-099 | Create/List Supplier (`POST/GET /warehouse/suppliers`) |
| task-100 | Warehouse Location (Entity & Migration) |
| task-101 | Create/List Warehouse Location (`POST/GET /warehouse/warehouses`) |
| task-102 | Stock (Entity, Migration & `GET /warehouse/stocks`) |
| task-103 | Stock Ledger (`GET /warehouse/stocks/{stockId}/ledger`) |

## Implementation Plan

Master-data and read-model foundation for the whole Warehouse module: `Item` (category/unit/minimumStock/`isConsumable`/`isBatchTracked`/`isExpiryTracked`), `Supplier`, `WarehouseLocation` (branch-scoped), and the `WarehouseStock` balance read model (current/reserved/available/minimum/status) plus its ledger (`StockTransaction`). No hand-written domain entity classes exist for this module — repository interfaces type directly against the Prisma-generated models (e.g. `IItemRepository.ts` imports `Item` from `@prisma/client`), a deliberate simplification consistent across every Warehouse sub-module.

## Files Created

- `apps/backend/src/modules/warehouse/application/use-cases/CreateItemUseCase.ts`(+`.test.ts`), `ListItemsUseCase.ts`, `GetItemUseCase.ts`(+`.test.ts`), `UpdateItemUseCase.ts`(+`.test.ts`), `CreateSupplierUseCase.ts`(+`.test.ts`), `ListSuppliersUseCase.ts`, `CreateWarehouseLocationUseCase.ts`(+`.test.ts`), `ListWarehouseLocationsUseCase.ts`, `ListStocksUseCase.ts`(+`.test.ts`), `GetStockLedgerUseCase.ts`(+`.test.ts`)
- `apps/backend/src/modules/warehouse/application/dtos/ItemRequestDto.ts`, `ItemResponseDto.ts`, `SupplierRequestDto.ts`, `SupplierResponseDto.ts`, `WarehouseLocationRequestDto.ts`, `WarehouseLocationResponseDto.ts`, `StockQueryDto.ts`, `StockResponseDto.ts`
- `apps/backend/src/modules/warehouse/application/mappers/ItemMapper.ts`, `SupplierMapper.ts`, `WarehouseLocationMapper.ts`, `StockMapper.ts`
- `apps/backend/src/modules/warehouse/domain/repositories/IItemRepository.ts`, `ISupplierRepository.ts`, `IWarehouseLocationRepository.ts`, `IStockRepository.ts`
- `apps/backend/src/modules/warehouse/infrastructure/repositories/ItemRepository.ts`, `SupplierRepository.ts`, `WarehouseLocationRepository.ts`, `StockRepository.ts`
- `apps/backend/src/modules/warehouse/presentation/controllers/ItemController.ts`, `SupplierController.ts`, `WarehouseLocationController.ts`, `StockController.ts`
- `apps/backend/prisma/migrations/` — Item/Supplier/WarehouseLocation/Stock migrations

## Files Modified

- `apps/backend/src/modules/warehouse/domain/exceptions/WarehouseExceptions.ts` (`ItemNotFoundException`, `ItemCodeExistsException`, `ItemTrackingFlagsLockedException`, `SupplierNotFoundException`, `SupplierCodeExistsException`, `WarehouseLocationNotFoundException`, `WarehouseLocationCodeExistsException`, `StockNotFoundException`)
- `apps/backend/src/modules/warehouse/presentation/routes/warehouse.routes.ts` (composition root for the whole module, `buildWarehouseModule(...)`; Item/Supplier/Warehouse Location/Stock routes at lines 292–338)
- `apps/backend/prisma/schema.prisma` (`ItemCategory`, `Unit`, `Item`, `Supplier`, `WarehouseLocation`, `WarehouseStock` models, lines 1693–1870)

## Database Changes

`ItemCategory`, `Unit`, `Item`, `Supplier`, `WarehouseLocation`, `WarehouseStock` — all carry the standard audit columns (`createdAt/By`, `updatedAt/By`) and soft-delete (`deletedAt/By`) **except** `WarehouseStock`, which is a live balance row, not a document, and so has neither. `Item.itemCode` is unique; `WarehouseLocation` is unique on `[branchId, locationCode]`; `WarehouseStock` is unique on `[warehouseId, itemId]` and carries a `version` column for optimistic concurrency (schema comment: "for optimistic concurrency per Section 3.5 Rule 1"). `WarehouseStock.availableStock` is documented as always server-computed, never client-accepted.

## API Changes

| Endpoint | Permission |
|---|---|
| `GET/POST /warehouse/items` | `warehouse.item.read` / `.manage` |
| `GET/PATCH /warehouse/items/{itemId}` | `warehouse.item.read` / `.manage` |
| `GET/POST /warehouse/suppliers` | `warehouse.supplier.read` / `.manage` |
| `GET/POST /warehouse/warehouses` | `warehouse.location.read` / `.manage` |
| `GET /warehouse/stocks` | `warehouse.stock.read` |
| `GET /warehouse/stocks/{stockId}/ledger` | `warehouse.stock.read` |

All six endpoints are confirmed present in both `warehouse.routes.ts` and `apps/backend/openapi.yaml` (lines 3012–3175). `POST /warehouse/warehouses` additionally passes through `branchScopeGuard` — a Phase 4 (`task-216`) retrofit applied onto this Phase 3 endpoint, per an explicit routes.ts comment.

## Frontend Changes

Real, working admin pages: `apps/frontend/app/(dashboard)/warehouse/items/page.tsx`, `.../suppliers/page.tsx`, `.../locations/page.tsx`, `.../stocks/page.tsx`, delegating to `apps/frontend/features/warehouse/components/ItemsAdminPage.tsx`, `SuppliersAdminPage.tsx`, `WarehouseLocationsAdminPage.tsx`, `StockListPage.tsx`, hooks `useWarehouseCatalogs.ts`/`useStock.ts`, service `warehouse.service.ts`, types `warehouse.types.ts`. `ItemsAdminPage.tsx` carries a load-bearing comment noting `Item.categoryId`/`unitId` are plain UUID text inputs rather than an invented select, because no `/warehouse/item-categories` or `/warehouse/units` endpoint exists — confirmed absent, not overlooked.

## Security Validation

Every endpoint is gated by a dedicated `warehouse.*.read`/`.manage` permission pair; no endpoint is left ungated. `POST /warehouse/warehouses` carries the additional Phase 4 branch-scope check noted above.

## Architecture Validation

- No cross-module DB access; Item/Supplier/WarehouseLocation/Stock stay entirely within Warehouse's own repository/use-case/controller layering.
- Repository interfaces typing directly against Prisma-generated models (rather than hand-rolled domain entities) is a consistent, deliberate simplification across the whole module — not unique to this epic, but established here first.
- No Epic V ambiguity was flagged in `phase-3-plan.md`; none was found unresolved in code.
