# Pages: Warehouse Module

> Status: **Proposed Design, backend-grounded** — no Warehouse frontend has shipped yet. Every route/permission below is copy-verified against the real (tested, passing) backend code (`apps/backend/src/modules/warehouse/presentation/routes/warehouse.routes.ts`), whose own code comments already cite `docs/03-sad/18-module-warehouse.md` §8.1's permission catalog verbatim and flag every place a permission was extrapolated rather than literal — those extrapolation notes are carried into this spec rather than re-guessed. Same grounding approach as `finance.md`.

---

## 1. Page Inventory

11 functional areas:

| Area | Key routes | Permissions |
|---|---|---|
| Item (catalog) | `GET/POST /warehouse/items`, `GET/PATCH /warehouse/items/:id` | `warehouse.item.read/manage` |
| Supplier | `GET/POST /warehouse/suppliers` | `warehouse.supplier.read/manage` |
| Warehouse Location | `GET/POST /warehouse/warehouses` | `warehouse.location.read/manage` |
| Stock | `GET /warehouse/stocks`, `GET .../:id/ledger` | `warehouse.stock.read` |
| Purchase Order | `GET/POST /warehouse/purchase-orders`, `GET/PATCH .../:id`, `.../submit`, `.../approve`, `.../reject`, `.../cancel` | `warehouse.purchase.read/create/submit/approve/cancel` |
| Goods Receipt | `POST /warehouse/goods-receipts`, `GET .../:id`, `.../post` | `warehouse.purchase.receive/read/post` |
| Stock Transfer | `POST /warehouse/transfers`, `.../submit`, `.../approve`, `.../dispatch`, `.../receive` | `warehouse.stock.transfer` (one permission, all 5 steps) |
| Stock Adjustment | `POST /warehouse/adjustments`, `.../approve`, `.../post` | `warehouse.stock.adjust`, `.adjust.post` |
| Stock Reservation | `POST /warehouse/reservations`, `.../release` | `warehouse.stock.reserve` |
| Stock Opname | `GET/POST /warehouse/stock-opnames`, `GET/PATCH .../:id`, `.../start-count`, `.../submit`, `.../approve`, `.../post` | `warehouse.opname.read/create/count/approve/post` |
| Batch | `GET /warehouse/batches`, `.../:id/quarantine` | `warehouse.batch.read/quarantine` |
| Warehouse Reports (6) | `GET /warehouse/reports/{stock-card,stock-balance,movements,purchases,expiry,opnames}` | `warehouse.report.read` (export not implemented — code comment confirms no export endpoint exists in this phase) |

Item/Supplier/Warehouse Location live in the Warehouse module's own route file but are structurally identical to Master Data's catalog pattern (`master-data.md` §2) — reuse `AdminEntityListPage` directly rather than building a parallel list+form component, since the shape (list/create/edit/deactivate, code-locked-after-use) is the same.

---

## 2. Shared conventions

- **10 WHS_* error codes** (per CLAUDE.md's Phase 3 Definition of Done, cross-checked against these routes): `WHS_STOCK_INSUFFICIENT`, `WHS_NEGATIVE_STOCK_FORBIDDEN`, `WHS_BATCH_REQUIRED`, `WHS_BATCH_EXPIRED`, `WHS_DUPLICATE_MOVEMENT`, `WHS_PO_NOT_APPROVED`, `WHS_RECEIPT_OVER_QUANTITY`, `WHS_OPNAME_ALREADY_ACTIVE`, `WHS_ADJUSTMENT_APPROVAL_REQUIRED`, `WHS_SOURCE_DESTINATION_SAME`. Each maps to a specific UI moment worth designing for directly rather than a generic error toast: e.g. `WHS_BATCH_EXPIRED` should be a pre-emptive warning at batch-selection time (grey out expired batches, don't just reject on submit — same "disabled not just rejected" principle as Reservation's `TimeSlotPicker` showing FULL slots disabled rather than hidden, `reservation.md` §3); `WHS_SOURCE_DESTINATION_SAME` should disable the destination warehouse option matching whatever source is currently selected in Stock Transfer's form, not just error after submit.
- **Maker-checker (segregation of duties) is pervasive here**, more than any module besides Finance — PO Approve, Adjustment Approve, Opname Approve, Transfer Approve are all separate steps from their own Create, enforced at the use-case level per the code comments (`WarehouseSegregationOfDutiesException` — named directly in the Stock Transfer comment). Same UI principle as `finance.md` §2: visible-but-disabled with an explanatory tooltip when the current user is blocked by policy (they created it), not hidden.
- **FEFO (First-Expired-First-Out) batch selection**: the pre-verification draft's guidance holds up — "should surface in the Goods Issue/Consumption UI as a read-only suggested batch the user can only override with a visible reason field." This directly matters for Goods Receipt and the EMR material-consumption event consumer (`ConsumeMaterialUseCase`, built earlier this session, task-136) — though that consumer has no UI of its own (it's an event consumer triggered by EMR Visit close, same pattern as Finance's `RecordBillingPaymentUseCase`), its *effects* (which batch got decremented) should be visible somewhere in Stock/Batch's ledger view.
- **Money/quantity fields**: same unformatted-input gap as every module — Purchase Order unit prices and Stock Adjustment quantities are the two places in this module where it matters most.

---

## 3. Item / Supplier / Warehouse Location

Reuse Master Data's `AdminEntityListPage` pattern exactly (`master-data.md` §2) — list + create/edit modal, code locked after first use, Active/Inactive toggle. Item fields (per SAD's Inventory Master Data catalog, `master-data.md` §8.2 cross-reference): Code, Name, Category, Unit, Minimum Stock, Purchase/Selling Price. Supplier: Code, Name, Contact Person, Phone, Email, Address, NPWP (per `master-data.md`'s existing Supplier field list, §11.14 of the Master Data SAD, already documented there — Warehouse's Supplier list page just consumes that same catalog).

## 4. Stock (`/warehouse/stocks`)

List: Item, Warehouse Location, Current Qty, Reserved Qty, Available Qty (= Current − Reserved), Minimum Stock, low-stock indicator (Warning tone, per `design-system.md` §8's existing "Warehouse: Low stock → Warning" row). Ledger (`.../:id/ledger`): a chronological in/out/running-balance table per item per warehouse — this is the "Stock Card" concept the redesign brief specifically called out as needing a dedicated component; it does not need a new component beyond the existing `TableHead`/`TableCell` primitives, just a specific column set (Date, Reference Type, Reference Id, Qty In, Qty Out, Running Balance) reused identically for the Stock Card report (§9) — one table shape serving both the live ledger view and the historical report.

## 5. Purchase Order (`/warehouse/purchase-orders`)

```text
Purchase Order
├── List: PO Number, Supplier, Branch, Status (Badge), Total, Actions
├── Create/Detail: Supplier + Branch + Warehouse selects, Line Items
│   (Item, Qty Ordered, Unit Price, Expected Date — editable while Draft
│   via PATCH, which reuses the same `.create` permission per the code's
│   own comment: whoever can draft a PO can edit their own draft)
├── Status: Draft → Submitted → Approved (or Rejected) → [Goods Receipt
│   posts against it] → Partially Received → Received, or → Cancelled
└── Actions: Submit · Approve/Reject (reason) · Cancel (reason) — Approve
    is segregation-of-duties gated per §2
```

`WHS_PO_NOT_APPROVED` implies Goods Receipt's PO picker should only list Approved POs to begin with, not surface every PO and reject unapproved ones after selection.

## 6. Goods Receipt (`/warehouse/goods-receipts`)

Create against an approved PO: per-line received quantity (defaulting to ordered quantity, editable down for partial receipt) + batch/expiry entry per line (SAD's batch-tracking requirement, cross-referenced with `WHS_BATCH_REQUIRED`). A separate **Post** step (its own permission, `warehouse.purchase.post` — explicitly split from Create per the code comment, "task-114 explicitly requires it be a separate permission... for segregation of duties") is the actual stock-incrementing event — Create alone should visibly read as "drafted, not yet posted," consistent with Finance Journal's Draft/Posted distinction (`finance.md` §4). `WHS_RECEIPT_OVER_QUANTITY` implies the received-quantity input should be capped/warned against exceeding the PO line's ordered quantity live, not just rejected on submit.

## 7. Stock Transfer (`/warehouse/transfers`)

A 4-step lifecycle in one permission (`warehouse.stock.transfer` covers Create/Submit/Approve/Dispatch/Receive — maker-checker enforced in the use case, not the route): Source Warehouse, Destination Warehouse (must differ — `WHS_SOURCE_DESTINATION_SAME`, live-disable the matching option per §2), Item lines with quantities. Status progression should render as a horizontal step indicator (Draft → Submitted → Approved → Dispatched → Received) — a genuine sequential workflow, unlike most status badges elsewhere in this app which are just states, not steps; this is a case where `design-system.md` §7's Horizontal Stepper is the right component for *display*, not just input, extending the precedent `finance.md` §5 already established for Financial Period closing.

## 8. Stock Adjustment (`/warehouse/adjustments`)

Create (reason: damaged/lost/expired/sample + item/quantity delta) → Approve (segregation-gated, self-approval blocked per §2) → Post (separate permission again, same split-for-segregation pattern as Goods Receipt). `WHS_ADJUSTMENT_APPROVAL_REQUIRED` and `WHS_NEGATIVE_STOCK_FORBIDDEN` together imply the create form should show live current-stock context next to the quantity-delta input, so a user can see before submitting whether their adjustment would drive stock negative.

## 9. Stock Reservation (`/warehouse/reservations`)

Simple create/release pair (one permission covers both) — reserves stock against a future consumption (e.g. a planned Treatment) without decrementing available stock immediately. No separate list route exists in the code (only create/release) — reservations are presumably surfaced through the Stock list's Reserved Qty column (§4) rather than their own dedicated list page; flagged as inferred, not confirmed by a route that doesn't exist.

## 10. Stock Opname (`/warehouse/stock-opnames`)

The pre-verification draft's structure holds up well:

```text
Stock Opname
├── Warehouse & Date (opens a system-balance snapshot) — Create
├── Start Count → Count sheet (Item, System Qty, Physical Count, Variance,
│   Note) — Submit (both steps share `warehouse.opname.count`, "both are
│   steps the counting staff performs" per the code comment)
├── Approve (variance review, segregation-gated — Manager-only per the
│   code's Actor Matrix cross-reference)
└── Post — generates one immutable OPNAME adjustment transaction, same
    split-permission-for-segregation pattern as Goods Receipt/Adjustment
```

`WHS_OPNAME_ALREADY_ACTIVE` implies the Create form should check for and surface an already-open opname on the selected warehouse before allowing a new one to start, not just reject on submit.

## 11. Batch (`/warehouse/batches`)

List (Item, Batch No., Expiry Date, Remaining Qty, Warehouse) + Quarantine action (its own permission — pulls a batch out of the FEFO-selectable pool without deleting it, presumably for a recalled/damaged batch). Directly feeds the Expiry report (§12) and FEFO suggestion logic (§2).

## 12. Warehouse Reports (`/warehouse/reports/*`)

6 reports, same shared metadata pattern as Finance's reports (`finance.md` §10) — date/branch filters, no export endpoint yet (confirmed absent from the route file, not silently assumed present): Stock Card (per-item ledger, reuses §4's table shape), Stock Balance, Movements, Purchases, Expiry (near/past-expiry batches, feeds the "Expiry / Low Stock Alerts" concept from the pre-verification draft), Opnames (historical opname results).

---

## 13. RBAC

No literal SAD role table was located in the sections reviewed for this pass (same caveat as `finance.md` §12) — the permission groups above (`warehouse.item/supplier/location/stock/purchase/stock/opname/batch/report`) are the actual authority; role-to-permission mapping should be confirmed against the System module's permission catalog rather than inferred here. What is confirmed: every write action beyond simple Create has a maker-checker split (Submit ≠ Approve ≠ Post are usually 2–3 distinct permissions, per §2), which should read in the UI as a visible pipeline of who-can-do-what-when, not just a flat permission gate.

---

## 14. Navigation

**Entry points:** no shipped sidebar entry exists yet. When built, needs a nested structure given 11 functional areas — likely grouped as this doc's §1 table groups them (Master-Data-style catalogs; Procurement: PO+Goods Receipt; Stock Movement: Transfer+Adjustment+Reservation; Stock Opname+Batch; Reports), mirroring `phase-3-plan.md`'s own Epic grouping (V/W/X/Y/AA) rather than inventing a new taxonomy.

**Exit points:** Goods Receipt posting should be the trigger a Purchase Order's status visibly updates against (Detail page should reflect Partially Received/Received without a manual refresh conceptually) — and, per `finance.md` §13's cross-module link gap, Stock/Batch ledger entries with a `referenceType`/`referenceId` (e.g. from EMR's `emr.treatment-material-finalized.v1` consumption) should link back to the originating Visit, not just show an opaque reference id.

`navigation.md` §4's existing Warehouse tree (`Stock Balance / Stock Card / Purchase Order / Goods Receipt / Stock Transfer / Stock Adjustment / Stock Opname`) is missing Item/Supplier/Location catalogs, Stock Reservation, Batch, and the Reports group — corrected as part of this pass (see the corresponding edit).

## 15. Interactivity (2026 refresh — `design-system.md` §11, `ui-guidelines.md` §9)

**Live update** matters most here of any module besides Queue: Stock (§4) and Batch (§11) are read by multiple concurrent actors (a Goods Receipt posting, a Stock Adjustment, an EMR material-consumption event all touch the same rows) — the Stock list and ledger should reflect a concurrent post without a manual refresh, with the changed row briefly highlighted (`motion-standard`) so a warehouse staff member notices what just moved. **Interactive charts** (§12, Recharts): the 6 warehouse reports get the same table+chart upgrade as Finance's (`finance.md` §14) — Stock Card and Expiry are the two most chart-suited (a running balance line, an expiry-date distribution). **Drag-and-drop is intentionally not used** for Purchase Order or Stock Transfer status progression, mirroring Finance's own restraint (`finance.md` §14) — these are maker-checker workflows (§2's segregation-of-duties note) where an explicit Approve/Dispatch/Receive click is the correct interaction, not a draggable state; §7's Stepper recommendation is for *display* of that progression, not drag-driven control of it. **Inline edit**: Item/Supplier/Warehouse Location catalogs (§3) get the same treatment as Master Data's (`master-data.md` §9), since they reuse that exact component. **Live-validation micro-interactions** tied to the WHS_* error codes (§2) are this module's most concrete opportunity: batch-expiry graying-out, source≠destination live-disable, and stock-going-negative preview are all called out per-area in §5–§10 above — treat those as this section's worked examples rather than repeating them here.
