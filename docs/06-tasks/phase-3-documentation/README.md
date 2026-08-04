# Phase 3 — Per-Epic Documentation

Retroactive documentation for Phase 3 (Operational Excellence), structured per the same template used in `phase-2-documentation/` and `phase-4-documentation/` (Documentation Reviewed → Task List → Implementation Plan → Files Created/Modified → Database/API/Frontend Changes → Security/Architecture Validation), produced at **epic granularity**.

For the phase-level narrative (ambiguity resolutions, codebase footprint, verification status, the task-136/task-162 timeline discrepancy, known gaps), see [`../phase-3-implementation-report.md`](../phase-3-implementation-report.md). For the original pre-build plan, see [`../phase-3-plan.md`](../phase-3-plan.md).

**Note on epic count**: `phase-3-plan.md`'s own "Task List by Epic" table lists **17** epics (V through AL), not 18 — V, W, X, Y, Z, AA, AB, AC, AD, AE, AF, AG, AH, AI, AJ, AK, AL. This document set follows that literal count; no epic letter in the V–AL range was combined or split.

| Epic | Feature Area | Tasks | Document |
|---|---|---|---|
| V. Warehouse Foundation | Item, Supplier, Warehouse Location, Stock Read | task-095–103 | [epic-v-warehouse-foundation.md](./epic-v-warehouse-foundation.md) |
| W. Procurement | Purchase Order, Goods Receipt | task-104–114 | [epic-w-procurement.md](./epic-w-procurement.md) |
| X. Stock Movement | Transfer, Adjustment, Reservation | task-115–126 | [epic-x-stock-movement.md](./epic-x-stock-movement.md) |
| Y. Stock Opname & Batch | Physical Count, Batch/Expiry | task-127–135 | [epic-y-stock-opname-batch.md](./epic-y-stock-opname-batch.md) |
| Z. Automatic Stock Update | EMR Material Consumption (event consumer) | task-136 | [epic-z-automatic-stock-update.md](./epic-z-automatic-stock-update.md) |
| AA. Warehouse Reporting | Stock Card, Balance, Movements, Purchases, Expiry, Opnames | task-137–142 | [epic-aa-warehouse-reporting.md](./epic-aa-warehouse-reporting.md) |
| AB. Finance Foundation | Chart of Accounts | task-143–145 | [epic-ab-finance-foundation.md](./epic-ab-finance-foundation.md) |
| AC. Journals | Manual & System Journal, Financial Period (task-168 pulled forward) | task-146–152 (+168) | [epic-ac-journals.md](./epic-ac-journals.md) |
| AD. Cash & Expense Management | Cash Account, Cash Transfer, Expense | task-153–161 | [epic-ad-cash-expense-management.md](./epic-ad-cash-expense-management.md) |
| AE. Daily Closing, Settlement & Period | Automatic Billing Event, Daily Closing, Doctor Fee Settlement, Period Lock/Close/Reopen | task-162–171 | [epic-ae-daily-closing-settlement-period.md](./epic-ae-daily-closing-settlement-period.md) |
| AF. Finance Reporting | Trial Balance, GL, Income Statement, Cash Flow, Expenses, Daily Closing | task-172–177 | [epic-af-finance-reporting.md](./epic-af-finance-reporting.md) |
| AG. Advanced Reporting — Dashboards | Projection Infra, Executive/Ops/Clinical/Finance/Warehouse Dashboards (HR not implemented) | task-178–184 | [epic-ag-advanced-reporting-dashboards.md](./epic-ag-advanced-reporting-dashboards.md) |
| AH. Report Catalog & Scheduled Reports | Definitions, On-Demand, Jobs (sync in-process), Snapshots, Export | task-185–191 | [epic-ah-report-catalog-scheduled-reports.md](./epic-ah-report-catalog-scheduled-reports.md) |
| AI. Audit Dashboard | Audit Log, Activity Log, Operations Health (task-194 deferred, completed with Epic AL) | task-192–194 | [epic-ai-audit-dashboard.md](./epic-ai-audit-dashboard.md) |
| AJ. Notification Center | Templates, Inbox, Delivery Worker | task-195–199 | [epic-aj-notification-center.md](./epic-aj-notification-center.md) |
| AK. Approval Workflow | System Parameter, Change Request/Approval, Feature Flag, Menu | task-200–206 | [epic-ak-approval-workflow.md](./epic-ak-approval-workflow.md) |
| AL. Background Job Operations | Job Registry, Retry, Cancel (+ completes task-194) | task-207–209 | [epic-al-background-job-operations.md](./epic-al-background-job-operations.md) |

Build order followed the git commit sequence (Warehouse V→AA, then Finance AB→AF with task-168 pulled forward into AC, then Reporting AG→AH, then System AI→AL), which matches the plan's own dependency ordering. Two tasks — task-136 (Epic Z) and task-162 (Epic AE) — were explicitly deferred as "genuinely blocked" at their respective epics' own commits and again at the Phase-3-completion commit, then completed afterward in later (currently uncommitted) work; see each epic's own "Timeline note" section and `../phase-3-implementation-report.md` Section 4 for the full account. task-194 (Epic AI) was deferred at Epic AI's own commit and completed later alongside Epic AL, once the background job registry it depends on existed.
