# Pages: Billing Module

> Status: **Verified against shipped code** (Phase 1, task-054–058). `docs/03-sad/16-module-billing.md` has no dedicated UI Pages section (its §12 Billing Status and §8 Actors & Permissions are the closest source material), so — like Queue and EMR — this is a Proposed layout cross-checked against shipped code rather than a verbatim SAD UI spec. Sourced from SAD §8 (Actors & Permissions), §10–12 (Invoice/Payment Lifecycle, Billing Status), cross-checked against `apps/frontend/features/billing/`.

---

## 1. Page Inventory

| Page | Route | Purpose |
|---|---|---|
| Invoice List | `/billing` | All invoices — filter by status/date, no "New Invoice" action |
| Invoice Detail | `/billing/{id}` | Line items, payment history, Record Payment / Close Invoice actions |

**Gap flagged, significant:** the pre-verification draft assumed 6 pages (Invoice List, Generate Invoice, Invoice Detail, Payment, Refund, Void/Cancel Invoice) plus Invoice Detail sections for Discount, Insurance/Company Guarantee, and a Print/Reprint/Refund/Re-open action set. **None of that exists in shipped code.** What actually shipped is narrower than "Billing Basic" might imply:

- No manual "Generate Invoice" page — by design (task-054 code comment: "Invoice auto-appears in the Cashier's Billing queue once generated; no manual creation form needed for the primary flow"). Correctly documented as an intentional simplification, not a gap — Invoice creation is a EMR→Billing event-driven process (Visit Completed → Invoice generated), consistent with SAD §9's Billing Lifecycle (`EMR Completed → Generate Invoice → Review Invoice → Payment → ...`).
- **No Discount line-item UI** — SAD/PRD describe Doctor/Manual/Promotion/Membership discount sources; `InvoiceDetailView`'s Line Items table has no discount column, and there's no discount-entry affordance anywhere in shipped Billing.
- **No Insurance / Company Guarantee UI** at all.
- **No Refund UI or flow** — SAD §12 lists `Paid → Refunded` as a valid Invoice/Payment Lifecycle transition; nothing in shipped code implements it.
- **No Void/Cancel UI** — SAD §12 lists `Draft → Cancelled` and `Draft → Void` as valid transitions; nothing in shipped code implements either, and (per §2 below) the shipped invoice status enum doesn't even include `DRAFT`, `CANCELLED`, or `VOID` as reachable states in the frontend's type.
- **No Print/Reprint** — not present in shipped code; SAD doesn't mandate it as a P0 in the sections reviewed either.

This is the largest gap between "what a page-inventory draft assumed" and "what actually shipped" of any module covered in this pass — worth a direct product conversation about whether Discount/Insurance/Refund/Void are still-pending Phase 1 scope or were deliberately deferred to a later epic; not guessed here either way.

---

## 2. Invoice status — see `design-system.md` §8.3

Shipped enum is `UNPAID | PARTIALLY_PAID | PAID | CLOSED` — 4 of SAD §12's 7 statuses (`Draft`, `Pending Payment`, `Partially Paid`, `Paid`, `Closed`, `Cancelled`, `Void`). The mapping and the important semantic clarification — **shipped `CLOSED` means "sent to Finance," not "Void"** — now live in `design-system.md` §8.3 (added this pass). Do not conflate the two when the Void feature above eventually ships; it will need its own status value, not a reuse of `CLOSED`.

---

## 3. Invoice List (`/billing`)

```text
Billing
├── Header: H1 "Billing" — no create action (see §1)
├── Filter bar: Status select (4 options, see §2) + Date From + Date To
├── LoadingState | ErrorState | EmptyState | Table
└── Pagination
```

### 3.1 Table columns

Invoice No. · Date · Grand Total · Outstanding · Status (Badge) · Actions (View only — links to Detail).

**Gap vs. the pre-verification draft:** no Patient/Cashier/Branch columns shown, and no Receive Payment/Void/Refund/Print row actions — only "View." All financial actions happen from Detail, not inline from the list (a reasonable modal-vs-full-page judgment per `ui-guidelines.md` §4, given Record Payment involves a multi-line split-payment form).

### 3.2 States (`ui-guidelines.md` §1)

| State | Shipped | Compliant? |
|---|---|---|
| Loading | `LoadingState` spinner (same cross-cutting gap) | Gap |
| Empty | `EmptyState title="No invoices found" description="Invoices appear automatically once a Visit is closed."` — description present, no action (consistent with the pattern seen elsewhere; also arguably correct here since there IS no create action to offer — see §1) | Partial, but closer to compliant than most since the missing action isn't actually applicable |
| Error | `ErrorState` + retry | Compliant |

### 3.3 Table/list behavior (`ui-guidelines.md` §3)

Search: **none** (gap — no search by invoice number/patient). Filter: Status + date range (compliant, ≥1 filter). Sort: none wired (gap, same pattern as every module so far). Pagination: ✔ page-based. Row actions: single text link, not icon+tooltip (same minor pattern gap as other modules, below the 3-action overflow threshold either way).

---

## 4. Invoice Detail (`/billing/{id}`)

```text
Invoice Detail
├── Header: invoice number (H1) + status Badge
├── Action bar
│   ├── PermissionGuard(billing.payment.create), shown when status ∈ {UNPAID, PARTIALLY_PAID} → "Record Payment" → CreatePaymentModal
│   └── PermissionGuard(billing.invoice.close), shown when status === PAID → "Close Invoice" (secondary)
├── Summary grid (4-col): Subtotal, Grand Total, Paid, Outstanding
├── Line Items table: Item, Qty, Unit Price, Total
└── Payments table (shown only if payments.length > 0): Date, Amount, Reference
```

No Patient & Visit Summary section (the pre-verification draft assumed one) — Detail opens directly on the financial summary, no patient name/MRN/visit link shown. Same class of gap as Reservation List's missing patient columns and Queue Card's missing patient name — a recurring pattern across this codebase worth naming once, explicitly: **none of the transactional modules (Reservation, Queue, Billing) currently denormalize or link to patient identity on their primary working screens**, which is a real cross-module UX gap, not three unrelated ones.

### 4.1 Record Payment (`CreatePaymentModal`)

```text
Record Payment (modal)
├── "Outstanding: {formatCurrency}"
├── Payment line(s) — each: Method (select, from Master Data Payment Method
│   catalog) + Amount (number input)
├── "Split Payment (+)" — adds another line (task-057: Multiple Payment,
│   several methods in one POST /billing/payments call, e.g. cash + card)
├── Per-line "Remove" (shown once >1 line exists)
├── Running total + inline warning text if total > outstanding
└── "Confirm Payment" — disabled unless every line has a method + positive
    amount AND 0 < total ≤ outstanding
```

This directly powers task-162 (Finance's `RecordBillingPaymentUseCase`, delivered earlier this session) — `PaymentCompletedPayload.paymentIds` carries exactly the line IDs this modal's split-payment submission creates.

`ui-guidelines.md` §2 check: money fields (Amount) are plain `<Input type="number">`, not right-aligned/Rp-prefixed/blur-formatted — same gap already flagged for Master Data's Treatment price fields (`master-data.md` §4). Validation is submit-gate (disabled button), not blur-inline-error — consistent with the pattern already flagged across every module (not repeating the full gap analysis per-module going forward now that the pattern is well-established from Master Data/Reservation).

---

## 5. RBAC (SAD §8, cross-checked against shipped permission strings)

| Role | Responsibility (SAD §8) | Shipped permission(s) observed |
|---|---|---|
| Cashier | Create Invoice, Payment, Refund | `billing.payment.create` |
| Doctor | Give Doctor Discount | — (no discount UI shipped, see §1) |
| Nurse | Read Only | — |
| Registration | View Invoice Status | — |
| Finance | Closing Billing | `billing.invoice.close` |
| Clinic Manager | Approve Refund | — (no refund UI shipped) |
| Owner | Read Only | `billing.invoice.read` (sidebar visibility) |
| Administrator | Full Access | — |

Sidebar entry: single flat link `/billing`, gated on `billing.invoice.read` (confirmed via `apps/frontend/config/navigation.ts`). Only two write permissions are actually exercised anywhere in shipped code — `billing.payment.create` and `billing.invoice.close` — since Discount/Refund/Void aren't built, their corresponding SAD-described role responsibilities (Doctor's discount grant, Clinic Manager's refund approval) have no UI surface to attach a permission check to yet.

---

## 6. Navigation

**Entry points:** Sidebar "Billing" (flat, single link — no sub-items, matching Queue's pattern rather than Reservation/Master Data's nested pattern). Cross-module: per SAD §9's Billing Lifecycle, an Invoice is created automatically once a Visit reaches Completed in EMR/Queue — there is no manual "start a new invoice from here" entry point anywhere in the app, by design (§1).

**Exit points:** Per SAD §9/§13, Invoice → Paid → Finance Closing → Reporting is the intended downstream flow; "Close Invoice" is this module's contribution to that (Finance-side consumption of the closed invoice was covered separately in this session's task-162 work, which is the actual Finance-side event consumer for `PaymentCompleted`). No in-app link from a Closed invoice forward into Finance's own screens (reasonable — Finance doesn't have a shipped frontend yet at all, only backend, per this session's earlier context).

`navigation.md` §4's existing Billing tree (`Invoice List / Generate Invoice / Payment / Discount / Insurance / Refund / Void`) significantly overstates what exists — corrected as part of this pass to the real 2-route structure (see the corresponding edit).

## 7. Interactivity (2026 refresh — `design-system.md` §11, `ui-guidelines.md` §9)

`CreatePaymentModal`'s split-payment lines (§4.1) are the clearest micro-interaction opportunity: adding a line via "Split Payment (+)" should animate the new row in (`motion-micro`), and the running-total/outstanding-balance comparison should update live as amounts are typed with a brief highlight when it crosses from under-outstanding to over-outstanding, rather than only a static warning string appearing after the fact. Money fields here should also be the first to actually adopt `design-system.md` §3's tabular-figure data face — Amount inputs and the Outstanding/Total displays are exactly the kind of numeric content that face exists for, and this module's payment-amount gap was already flagged in last pass's cross-module findings (`overview.md` §3). Invoice List's status Badge (§3.1) cross-fades on change (`motion-standard`), matching the pattern established for Reservation/Queue. Not applicable here: drag-and-drop (no board-shaped UI in this module) and inline edit (invoice line items are system-generated from EMR, not user-editable — editing them would violate the "invoice can't be changed once payment starts" business rule implicit in SAD §12's lifecycle).
