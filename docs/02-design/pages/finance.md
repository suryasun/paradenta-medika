# Pages: Finance Module

> Status: **Proposed Design, backend-grounded** — no Finance frontend has shipped yet (backend built and tested across this project's Phase 3 sessions, most recently task-162's Automatic Billing Event this session). Unlike Master Data/Reservation/Queue/EMR/Billing/System above, there is no shipped UI to verify against — every screen below is derived from the actual backend surface (`apps/backend/src/modules/finance/presentation/routes/finance.routes.ts`'s real routes/permissions, `docs/03-sad/17-module-finance.md` §8 Authorization/Audit/Security, §9 Exception Handling, §10 Reporting), not guessed UI. This is more rigorous than a pure-SAD-prose proposal (every permission string and route below is copy-verified against running backend code) but is still a proposal in the sense that no layout decision has been implemented or user-tested.

---

## 1. Page Inventory

Finance is accounting-of-record — keep its UI clearly separated from Billing's patient-facing invoice UI (Billing creates the triggering event; Finance is the ledger of what happened as a result). 9 functional areas, each mapping to a real backend route group:

| Area | Routes (verified in `finance.routes.ts`) | Permissions |
|---|---|---|
| Chart of Accounts | `GET/POST /finance/accounts`, `PATCH /finance/accounts/:id`, `POST /finance/accounts/:id/deactivate` | `finance.account.read`, `.manage` |
| Journal | `GET /finance/journals`, `GET /finance/journals/:id`, `POST /finance/journals`, `PATCH /finance/journals/:id`, `POST .../post`, `.../reverse`, `.../void` | `finance.journal.read/create/update/post/reverse/void` |
| Financial Period | `GET/POST /finance/periods`, `.../lock`, `.../close`, `.../reopen` | `finance.period.read/manage/lock/close/reopen` |
| Cash & Bank Accounts | `GET/POST /finance/cash-accounts`, `GET .../movements`, `POST /finance/cash-transfers` | `finance.cash.read/manage/transfer` |
| Daily Cash Closing | `POST /finance/daily-closings`, `.../approve`, `GET /finance/daily-closings` | `finance.cash.close`, `.approve_close`, `.read` |
| Expense | `GET/POST /finance/expenses`, `GET/PATCH /finance/expenses/:id`, `.../submit`, `.../approve`, `.../reject`, `.../pay` | `finance.expense.read/create/approve/pay` |
| Doctor Fee Settlement | `POST /finance/doctor-fee-settlements/generate`, `.../:id/approve`, `.../:id/pay` | `finance.settlement.read/generate/approve/pay` |
| Financial Reports | `GET /finance/reports/{trial-balance,general-ledger,income-statement,cash-flow,expenses,daily-closing}` (6 reports) | `finance.report.read` |
| Account Mappings *(built this session, task-162)* | `GET/POST /finance/account-mappings` | `finance.account-mapping.read/manage` |

This session's own task-162 work (`RecordBillingPaymentUseCase`) is a background event consumer, not a page — it has no UI surface, only Journal entries it produces that appear in the Journal List/Detail below.

---

## 2. Shared conventions (apply to every area below — not repeated per-section)

- **Layout pattern:** every List follows the same shell already established across the app (Master Data's `AdminEntityListPage`, Reservation/Queue/Billing's List views) — header + filter bar + Table + Pagination. No new list component needed; `design-system.md` §7's existing `TableHead`/`TableCell` cover Finance's tabular data (journal lines, account balances) without a bespoke "ledger table" component.
- **Segregation of duties is a first-class UI concern, not just a server check** (SAD §8.2): "The person creating a manual journal cannot post it," "Expense requester cannot approve their own expense," "Only Owner or delegated Administrator may reopen a period." Per `ui-guidelines.md` §5, actions blocked by segregation-of-duties should render **visible-but-disabled with a tooltip explaining why** (e.g. "You created this journal — a different Finance Manager must post it"), not hidden — since the actor can see the workflow exists and is blocked by policy, not by not having the feature at all. This is a stronger case for disabled-not-hidden than most `PermissionGuard` usage elsewhere in the app, which mostly hides.
- **Reports only include posted journals** (SAD §10.2) — every report page must show its date-as-of/generated-at/filter metadata visibly, and Draft records must never leak into a financial statement even if a user can see Drafts in the operational Journal List.
- **Money fields**: every module covered so far has the same gap (plain unformatted number inputs) — Finance is the one module where this actually matters most (real accounting figures), so this should be the first module to actually fix it rather than repeat the gap. Flagged as a priority, not just a note.
- **FIN_* error codes** (`docs/03-sad/17-module-finance.md` §9, and confirmed against actual `FinanceExceptions.ts` from this session's task-162 work): `FIN_JOURNAL_UNBALANCED`, `FIN_PERIOD_CLOSED`, `FIN_ACCOUNT_NOT_POSTABLE`, `FIN_DUPLICATE_POSTING`, `FIN_EXPENSE_NOT_APPROVED`, `FIN_CLOSING_DUPLICATE`, `FIN_CLOSING_VARIANCE_REASON_REQUIRED`, `FIN_SETTLEMENT_SOURCE_USED`, `FIN_SEGREGATION_OF_DUTIES`, `FIN_ACCOUNT_MAPPING_MISSING` — every write form below must surface these via the same inline-`Alert`-on-submit-error pattern used everywhere else in the app (`getApiErrorMessage`), not a generic "something went wrong."

---

## 3. Chart of Accounts (`/finance/accounts`)

List: Code, Name, Type, Normal Balance, Postable (boolean), Active (Badge). Create/Edit modal: Code (create-only, matching every other module's "code locks after use" convention), Name, Account Type (select), Normal Balance (Debit/Credit select), Parent Account (select, for hierarchy), Postable (boolean — non-postable accounts are header/summary rows only). Deactivate action, not delete (matches Master Data's soft-delete convention throughout this codebase).

## 4. Journal (`/finance/journals`)

List: Journal No., Date, Description, Reference Type/Reference Id (e.g. `BILLING_PAYMENT` from this session's task-162), Status (Draft/Posted/Reversed/Voided — Badge), Total Debit/Credit, Actions. Detail: header fields + a lines table (Account, Debit, Credit, Description) that must visibly balance (sum debit = sum credit — a live running total in the Create form, not just a server-side rejection on submit, would directly prevent the most common `FIN_JOURNAL_UNBALANCED` case before the user even submits).

Actions, each its own confirm step given financial irreversibility (`ui-guidelines.md` §2's confirm-modal rule squarely applies here, more than almost anywhere else in the app):
- **Post** — segregation-of-duties gated (§2): disabled with tooltip if the current user is the journal's creator.
- **Reverse** — creates a new reversing journal (per this session's `JournalRepository.createReversal` pattern seen in task-162 work) — requires a reason.
- **Void** — only for unposted/Draft journals; requires a reason.

## 5. Financial Period (`/finance/periods`)

List/status view of periods (e.g. monthly), each with a status (Open/Locked/Closed) and the actions available at that status: Lock → Close → Reopen. Per SAD §10.3's Period Closing Checklist, the Close action should walk through a **Stepper** (`design-system.md` §7 — "multi-step forms... PO approval" precedent extends naturally here): confirm daily closings approved, resolve pending source events, reconcile cash, review trial balance, review expense/settlement exceptions, then close. This is the one place in Finance where a Stepper is the right component (not just a form — a genuine multi-stage checklist-driven workflow), consistent with `ui-guidelines.md` §2's "never a single 20-field form" guidance extended to "never a single-click irreversible action hiding a 6-step checklist." Reopen is Owner/delegated-Administrator only (§2's segregation-of-duties note) and should require a typed reason, consistent with every other high-consequence reason-required action across this codebase.

## 6. Cash & Bank Accounts + Cash Transfer

List (`/finance/cash-accounts`): Code, Name, Type (Cash/Bank/Clearing), Linked Ledger Account, Current Balance, Active. Detail/Movements (`/finance/cash-accounts/:id/movements`): a filtered Journal-lines view scoped to this account's ledger account — reuses the Journal list/table pattern (§4), not a new component. Cash Transfer (`/finance/cash-transfers`, modal — 2 accounts + amount + reason, ≤6 fields, correctly modal per `ui-guidelines.md` §4): source/destination account selects (must differ — this is the same "source ≠ destination" rule Warehouse's Stock Transfer already establishes via `WHS_SOURCE_DESTINATION_SAME`; Finance's exception list doesn't name an equivalent code explicitly in the sections reviewed, flagged as worth confirming rather than assumed identical), amount, reason.

## 7. Daily Cash Closing (`/finance/daily-closings`)

The pre-verification draft's structure for this screen holds up well against the real backend and SAD §10.4 (Reconciliation):

```text
Daily Cash Closing
├── Branch / Cashier / Shift / Date selector
├── Expected balance (system-calculated — opening + inbound − outbound posted movements, SAD §10.4)
├── Counted cash input
├── Variance (auto-calculated client-side; FIN_CLOSING_VARIANCE_REASON_REQUIRED
│   forces a reason field to appear the moment variance ≠ 0, not just on submit-reject)
└── Submit → Approve (finance.cash.approve_close — Finance Staff if zero
    variance per segregation rules, escalates to Finance Manager if
    variance exists, per the pre-verification draft's own citation of
    UC-FIN-005; not independently re-verified against SAD text in this
    pass, flagged as inherited rather than freshly confirmed)
```

`FIN_CLOSING_DUPLICATE` implies the create form should disable/warn before submission if a closing already exists for the selected Branch/Cashier/Shift/Date combination, not just reject after the round-trip.

## 8. Expense (`/finance/expenses`)

List + Create + Detail, with a Draft → Submitted → Approved/Rejected → Paid lifecycle (mirrors the enum already seen server-side across this codebase's other approval flows, e.g. System's `ConfigurationChangeRequest`). Create: Category, Amount, Description, Evidence attachment. Submit / Approve / Reject (reason) / Pay actions, each segregation-of-duties gated per §2 (requester ≠ approver; payer ≠ creator for high-value, per SAD §8.2's literal wording — the value threshold itself isn't specified in the sections reviewed, flagged as a real gap needing a System Parameter lookup, not guessed).

## 9. Doctor Fee Settlement (`/finance/doctor-fee-settlements`)

Generate (batch calculation over a period/doctor scope) → Approve → Pay. `FIN_SETTLEMENT_SOURCE_USED` implies the Generate action must show, per doctor/source-record, whether it's already been included in a prior settlement (visible state, not just a rejected resubmit) — same UX principle as Billing's payment idempotency, applied here to prevent double-settlement.

## 10. Financial Reports (`/finance/reports/*`)

6 reports (Trial Balance, General Ledger, Income Statement, Cash Flow, Expenses, Daily Closing) share one page pattern: a date/period range + branch filter header, a `definitionVersion`/`dataAsOf` metadata line (per SAD §10.2 and this codebase's Reporting-module convention already established for Reservation/Queue Analytics — `reservation.md` §5, `queue.md` §5), and an Export action that's itself an audited event (SAD §8.4 — "report export" is in the mandatory-audit list). No charting library is approved (same constraint noted in `reservation.md` §5) — these should render as tables/summary cards, not charts, until that's revisited.

`Dashboard KPIs` from SAD §10.1 (Cash position, Daily receipts/disbursements, Revenue, Operating expense, Net result, Unapproved expense, Cash variance, Pending source events) belong on a Finance-specific dashboard/landing page distinct from the 6 detailed reports — not yet assigned a route in this pass; flagged as an open item for whoever builds Finance's actual dashboard (likely alongside the Reporting module's Executive/Finance dashboards from Phase 3's Epic AG, which also has no frontend yet — see `reporting.md`).

## 11. Account Mappings (`/finance/account-mappings`) — built this session

CRUD for branch × payment-method → cash/revenue account mapping (task-162). List: Branch, Payment Method, Cash Account, Revenue Account, Active. Create: 4 required selects, no update/deactivate endpoint currently exists server-side (only `create`/`list`/`findById` — confirmed against this session's own `CreateFinanceAccountMappingUseCase`/`ListFinanceAccountMappingsUseCase`), so no Edit action should appear in this screen's spec even though every other Master-Data-style catalog in this app has one — a real, currently-accurate asymmetry, not an oversight to silently smooth over.

---

## 12. RBAC (SAD §8.1 Permission Catalog + §8.2 Segregation of Duties)

| Role (inferred from permission groups, not a literal SAD role table in the sections reviewed) | Read | Journal Create/Post | Period Lock/Close/Reopen | Expense Approve | Settlement Approve/Pay | Report Export |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| Finance Staff | ✔ | Create only (not Post — segregation of duties) | ✖ | ✖ | ✖ | ✔ |
| Finance Manager | ✔ | ✔ | Lock/Close | ✔ | ✔ | ✔ |
| Owner / delegated Administrator | ✔ | ✔ | ✔ (incl. Reopen) | ✔ | ✔ | ✔ |
| Cashier | Own drawer/shift only | ✖ | ✖ | ✖ | ✖ | ✖ |

**Explicitly not sourced from a literal SAD role table** — no "User Roles & Permissions" section with named roles was found in the sections of `docs/03-sad/17-module-finance.md` reviewed for this pass (only §8.1's permission-group catalog and §8.2's duty-separation prose). The table above is inferred from those two sections plus this codebase's consistent Finance Staff/Finance Manager/Owner naming convention seen elsewhere (e.g. `docs/01-prd/business-rules.md` §6 citations in the pre-verification draft) — flag this inference explicitly rather than presenting it as SAD-literal, and confirm against `docs/01-prd/features/finance.md`'s Actor Matrix (cited by the pre-verification draft but not re-read in this pass) before implementation.

---

## 13. Navigation

**Entry points:** no shipped sidebar entry exists yet (Finance has no frontend at all — `apps/frontend/config/navigation.ts` has no Finance section, confirmed by its absence in every nav-config grep run this session). When built, it should follow the nested pattern established by Master Data/Reservation (parent + children), given 9 functional areas is too many for Queue/Billing's flat single-link pattern.

**Exit points:** Journal Detail should link back to its `referenceType`/`referenceId` source where one exists (e.g. a `BILLING_PAYMENT` journal linking back to the originating Invoice in Billing) — this directly parallels the cross-module "no link back to source" gaps already flagged in `queue.md` §7 and `billing.md` §4, and is worth fixing here first since Finance is being designed fresh rather than retrofitted.

`navigation.md` §4's existing Finance tree (`General Ledger / Cash & Bank (Daily Closing) / Expense / Doctor Fee Settlement / Financial Period`) is missing Chart of Accounts, Cash Transfer as distinct from Cash & Bank, Account Mappings, and Financial Reports as its own section — corrected as part of this pass (see the corresponding edit).

## 14. Interactivity (2026 refresh — `design-system.md` §11, `ui-guidelines.md` §9)

**Interactive charts** (§10, Recharts): all 6 report pages upgrade from table-only to table+chart, with the "View as table" toggle mandatory per `ui-guidelines.md` §9.5 given these are audited financial statements — the chart is additive, never the only way to read the number. **Inline edit** fits Chart of Accounts (§3) well — Name, Account Type, Postable toggle are single-field low-risk corrections, same reasoning as `master-data.md` §9; Code stays create-only and Journal lines stay in the full Journal form (too much cross-field validation — balance must hold — for inline edit to be safe). **Drag-and-drop is deliberately not used for Journal posting or Period closing** despite both being sequential workflows — §5's Stepper-as-display recommendation is the right pattern for a maker-checker financial workflow specifically because it forces an explicit confirm click per stage rather than a draggable state that could be bumped accidentally; this is a case where this revision's own drag-and-drop enthusiasm should be restrained; noted explicitly so a future pass doesn't "improve" this into drag-and-drop by default. **Live update**: Cash Account balances (§6) and the Financial Period status banner (§5) should reflect concurrent postings from other users without a refresh, same pattern as Warehouse's Stock ledger (`warehouse.md` §4).
