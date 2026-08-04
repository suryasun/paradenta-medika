# Epic AF: Finance Reporting — Documentation (task-172–177)

---

## Documentation Reviewed

- `docs/06-tasks/task-172.md`–`task-177.md`
- `docs/03-sad/17-module-finance.md` Section 6.5 (Reports), Section 6.6 (Error Codes)
- `docs/01-prd/business-rules.md` § 6

## Task List

| Task | Name |
|---|---|
| task-172 | Trial Balance Report (`GET /finance/reports/trial-balance`) — P2 |
| task-173 | General Ledger Report (`GET /finance/reports/general-ledger`) — P2 |
| task-174 | Income Statement Report (`GET /finance/reports/income-statement`) — P2 |
| task-175 | Cash Flow Report (`GET /finance/reports/cash-flow`) — P2 |
| task-176 | Expenses Report (`GET /finance/reports/expenses`) — P2 |
| task-177 | Daily Closing Report (`GET /finance/reports/daily-closing`) — P2 |

## Implementation Plan

Six read-only reports following an identical pattern per task: expose `Get<X>ReportUseCase` as `GET /finance/reports/<x>` per SAD §6.5, "using only posted journal data (Finance is the sole source of truth for accounting balances per `docs/01-prd/business-rules.md` § 6)." A shared `ReportDateRangeResolver` service resolves `dateFrom`/`dateTo` vs. `periodId` and enforces `ReportDateRangeRequiredException` uniformly.

**Deviation worth flagging:** `GetExpensesReportUseCase` and `GetDailyClosingReportUseCase` are constructed with `expenseRepository`/`dailyClosingRepository` directly (not `financeReportRepository`) — these two read from their own aggregate tables rather than reconstructing from posted journal lines, a minor deviation from the literal Backend Scope text ("sourced from posted `finance_journals(_lines)` only"). The other four reports (Trial Balance, General Ledger, Income Statement, Cash Flow) do route through the dedicated `IFinanceReportRepository`.

## Files Created

- `apps/backend/src/modules/finance/application/use-cases/GetTrialBalanceReportUseCase.ts`, `GetGeneralLedgerReportUseCase.ts`, `GetIncomeStatementReportUseCase.ts`, `GetCashFlowReportUseCase.ts`, `GetExpensesReportUseCase.ts`, `GetDailyClosingReportUseCase.ts`
- `apps/backend/src/modules/finance/application/use-cases/FinanceReports.test.ts`
- `apps/backend/src/modules/finance/application/services/ReportDateRangeResolver.ts`
- `apps/backend/src/modules/finance/application/dtos/ReportQueryDto.ts`
- `apps/backend/src/modules/finance/domain/repositories/IFinanceReportRepository.ts` (+ Prisma implementation `FinanceReportRepository.ts`)
- `apps/backend/src/modules/finance/presentation/controllers/FinanceReportController.ts`

## Files Modified

- `FinanceExceptions.ts` — `ReportDateRangeRequiredException` (`FIN_REPORT_DATE_RANGE_REQUIRED`, extrapolated), `ReportPeriodNotFoundException`
- `finance.routes.ts` (lines 474–506)

No new tables — this epic is a pure read projection over Epics AB–AE's existing data.

## Database Changes

None.

## API Changes

| Endpoint | Permission |
|---|---|
| `GET /finance/reports/trial-balance` | `finance.report.read` |
| `GET /finance/reports/general-ledger` | `finance.report.read` |
| `GET /finance/reports/income-statement` | `finance.report.read` |
| `GET /finance/reports/cash-flow` | `finance.report.read` |
| `GET /finance/reports/expenses` | `finance.report.read` |
| `GET /finance/reports/daily-closing` | `finance.report.read` |

`finance.report.export` is reserved for a future task and not exercised anywhere in this epic. Cross-checked against `openapi.yaml`: all 6 paths present (4540, 4565, 4595, 4620, 4648, 4681) and consistent.

## Frontend Changes

`apps/frontend/app/(dashboard)/finance/reports/page.tsx` → `FinanceReportsPage.tsx`; hook `useFinanceReports.ts` — a single consolidated page covering all six report types, mirroring Warehouse's Epic AA reporting page pattern.

## Security Validation

Single `finance.report.read` permission uniformly applied across all six reports; branch-scoping enforced via a required `branchId` query parameter. No write path exists anywhere in this epic.

## Architecture Validation

Read-only use cases correctly placed in the application layer; `ReportDateRangeResolver` is correctly extracted as a shared cross-cutting service rather than duplicated per report. No cross-module boundary violations. No Epic AF ambiguity was flagged in `phase-3-plan.md`.
