# Epic AA: Warehouse Reporting — Documentation (task-137–142)

---

## Documentation Reviewed

- `docs/06-tasks/task-137.md`–`task-142.md`
- `docs/03-sad/18-module-warehouse.md` Section 6.5 (Reports), Section 4.5

## Task List

| Task | Name |
|---|---|
| task-137 | Stock Card Report (`GET /warehouse/reports/stock-card`) — ledger per item/warehouse/batch |
| task-138 | Stock Balance Report (`GET /warehouse/reports/stock-balance`) — current/reserved/available/minimum/status |
| task-139 | Movements Report (`GET /warehouse/reports/movements`) — in/out by type/reference/actor |
| task-140 | Purchases Report (`GET /warehouse/reports/purchases`) — PO/receipt/vendor analysis |
| task-141 | Expiry Report (`GET /warehouse/reports/expiry`) — near-expiry/expired/quarantine stock |
| task-142 | Opnames Report (`GET /warehouse/reports/opnames`) — snapshot/count/variance/approval |

## Implementation Plan

Six read-only reports, split across two data-access strategies: Stock Balance/Expiry/Opnames reuse the existing stock/batch/opname repositories directly (no new repository needed), while Stock Card/Movements/Purchases go through a new dedicated `WarehouseReportRepository` since no existing repository supported their filter/aggregation needs. All six share a single permission verb — `warehouse.report.read` — with no export capability built in this phase (no task in task-137–142 adds an export endpoint).

## Files Created

- Use cases: `GetStockCardReportUseCase.ts`, `GetStockBalanceReportUseCase.ts`, `GetMovementsReportUseCase.ts`, `GetPurchasesReportUseCase.ts`, `GetExpiryReportUseCase.ts`, `GetOpnamesReportUseCase.ts`
- Test: `WarehouseReports.test.ts`
- DTOs: `ReportQueryDto.ts` (`StockCardQueryDto`, `MovementsQueryDto`, `PurchasesReportQueryDto`), `PurchasesReportResponseDto.ts`
- Mapper: `PurchasesReportMapper.ts`
- Repository: `IWarehouseReportRepository.ts` / `WarehouseReportRepository.ts`
- Controller: `WarehouseReportController.ts`

## Files Modified

- `apps/backend/src/modules/warehouse/presentation/routes/warehouse.routes.ts` (lines 533–576; composition confirms `GetStockBalanceReportUseCase` takes `stockRepository`/`itemRepository`, `GetExpiryReportUseCase` takes `batchRepository`, `GetOpnamesReportUseCase` takes `stockOpnameRepository`, while `GetStockCardReportUseCase`/`GetMovementsReportUseCase`/`GetPurchasesReportUseCase` all take the new `warehouseReportRepository`)

## Database Changes

None — a purely read-only epic. Queries the existing `StockTransaction`, `WarehouseStock`, `PurchaseOrder`/`GoodsReceipt`, `ItemBatch`, and `StockOpname` tables.

## API Changes

| Endpoint | Permission |
|---|---|
| `GET /warehouse/reports/stock-card` | `warehouse.report.read` |
| `GET /warehouse/reports/stock-balance` | `warehouse.report.read` |
| `GET /warehouse/reports/movements` | `warehouse.report.read` |
| `GET /warehouse/reports/purchases` | `warehouse.report.read` |
| `GET /warehouse/reports/expiry` | `warehouse.report.read` |
| `GET /warehouse/reports/opnames` | `warehouse.report.read` |

All 6 confirmed present in both `warehouse.routes.ts` and `openapi.yaml` (lines 3698–3825+).

## Frontend Changes

`apps/frontend/app/(dashboard)/warehouse/reports/page.tsx`, delegating to `apps/frontend/features/warehouse/components/WarehouseReportsPage.tsx` and hook `useWarehouseReports.ts` — a single page covering all six reports.

## Security Validation

All six reports gated by a single `warehouse.report.read` permission (task files describe them as "branch/warehouse-scoped per assignment"); no write path exists anywhere in this epic.

## Architecture Validation

Correctly read-only — no use case in this epic mutates state. `phase-3-plan.md` Ambiguity #5 (Reporting module's literal source-event names not enumerated) applies to the separate Advanced Reporting module (Epic AG/AH, task-178+), **not** to this epic — Epic AA's six reports are synchronous direct-DB-query reports against Warehouse's own tables, not part of the async event-sourced projection system, so Ambiguity #5 does not actually apply here.
