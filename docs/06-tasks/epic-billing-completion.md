# Epic: Billing Module Completion

**Phase:** post-roadmap (cross-cutting, Billing module)
**Module:** Billing (Stage 1/4 cross-module with EMR/System; Stage 2/3 introduce new subsystems)
**Status:** Stage 1 implemented (task-322–326); Stage 3 implemented (task-331 Design Spike + task-332, ADR-001); Stage 2/4 backlog only

---

## Goal

`docs/03-sad/16-module-billing.md` documents 20 use cases (UC-BIL-001–020). Only 5 were ever converted into task files and built: Generate Invoice (task-054), Invoice List (task-055), Invoice Detail (task-056), Create Payment (task-057), Close Invoice (task-058) — plus task-320/task-321, which completed UC-BIL-004 "Update Invoice" (Treatment add/edit/remove sync between EMR and Billing). Everything else documented in the SAD has zero implementation. This epic closes the highest-value remaining gaps in staged order, and explicitly documents what's being deferred and why, rather than leaving it silently unaddressed.

Confirmed by full-SAD read + full-code inventory (both done as part of scoping this epic):
- **Money only ever moves one way today.** A charge can be created and paid, but there is no way to correct it: no Discount, no Cancel, no Void, no Refund exist anywhere in the code. `Invoice.discount`/`InvoiceItem.discount` columns exist but are hardcoded to `0` at every write site.
- **Insurance (UC-BIL-006) and Deposit (UC-BIL-007/017) are whole undocumented-in-code subsystems** — zero schema, zero use-cases, zero UI beyond a plain `discount`/`tax` Decimal column that's never populated.
- **UC-BIL-020 "Daily Closing" duplicates Finance's already-built UC-FIN-005 "Daily Cash Closing"** (`docs/03-sad/17-module-finance.md` §4.6; opening/closing balance, denomination count, mandatory variance-reason + Finance Manager approval; delivered as Finance Epic AE, task-162–171). The two Daily Closing use cases were never reconciled with each other in the docs.
- **Print/Reprint (UC-BIL-011/012)** needs thermal/A4/PDF print infrastructure that doesn't exist anywhere in this codebase yet.
- The AI-contract (`docs/04-ai-contract/07-module-contract.md` MOD-060/061) asserts Billing owns `receipts`, `doctor_fees`, `invoice_histories`, `cashier_shift_transactions` tables that are named in `docs/03-sad/06-database-design.md` §49's table inventory but never given column specs anywhere — a pre-existing documentation gap, noted here, not fixed by this epic.

## Stage 1 — Financial correction operations (task-322–326, full task files)

The highest-priority slice: closes the "no way to correct a charge" gap. Self-contained — no new subsystem required, unlike Deposit/Insurance.

| Task | UC | Title |
|---|---|---|
| task-322 | UC-BIL-005 | Apply Discount to Invoice |
| task-323 | UC-BIL-003 | Add Manual Charge to Invoice |
| task-324 | UC-BIL-014 | Cancel Invoice |
| task-325 | UC-BIL-015 | Void Invoice |
| task-326 | UC-BIL-016 | Refund Payment |

See each task file for full detail (Backend/Frontend Scope, DB Impact, Acceptance Criteria, etc., in the same structure as `task-311.md`–`task-321.md`).

## Stage 2 — Deposit (backlog, UC-BIL-007 "Apply Deposit" + UC-BIL-017 "Deposit Refund")

Not yet task-filed — needs more design first. A patient-level running balance (top-up, apply-to-invoice, withdraw, refund-with-approval) is a bigger subsystem than a single-invoice operation: it needs its own entity (`billing_deposits` + `billing_deposit_transactions`, both already named in the SAD's Part 4 schema, L2125–2413), a patient-facing balance view, and validation ("saldo cukup & aktif" per SAD §13) that spans multiple invoices over time rather than one Invoice's lifecycle. Reserve task-329/task-330 when this is picked up.

## Stage 3 — Insurance (UC-BIL-006 "Apply Insurance")

**Implemented** — `task-331.md` (Design Spike) done; `docs/adr/ADR-001-insurance-coverage-model.md` written, then `task-332.md` implemented it end-to-end. Summary of the decision: UC-BIL-006's own wording ("*mengalokasikan pembayaran* ke pihak asuransi" — allocate *payment* to the insurance party) reframes this as a payment-allocation concern, not a discount/coverage-rules-engine concern. Shipped model: a new lightweight `InsuranceProvider` Master Data entity + `Payment.payerType`/`insuranceProviderId`/`policyNumber`, reusing the existing `CreatePaymentUseCase` (task-057, already supports multi-line/split payments) rather than building a new Coverage/Allocation subsystem — with the coverage *amount* Cashier-entered (no formula exists to compute it automatically; the SAD's own Exception Flow implies a manual, verify-with-the-insurer process, not a live eligibility API). Automated coverage-rule computation and live insurer/BPJS integration remain explicitly deferred — see the ADR's "Deferred" section.

**task-332 (done): Insurance implementation.** Scope shipped: `InsuranceProvider` CRUD (backend + `InsuranceProvidersAdminPage.tsx`), three new nullable `Payment` columns, `CreatePaymentUseCase`/`CreatePaymentRequestDto` extended (not replaced) with active-provider validation (`InsuranceProviderNotActiveException`), `CreatePaymentModal` UI gains a Payer toggle + Provider/Policy fields per line, `InvoiceDetailView` payment rows show a Payer badge. No new Invoice fields, no new status, no new "recalculate grandTotal" logic — exactly as scoped. See `task-332.md` for full detail.

## Stage 4 — History views (backlog, UC-BIL-018 "Invoice History" + UC-BIL-019 "Payment History")

Lower-risk than Stage 1 (read-only), but not yet task-filed in full detail:
- **task-327 (reserved): Invoice History** — a Billing-scoped endpoint/UI surfacing the existing generic `AuditService` log entries already recorded for `Invoice` (Create/Update/Discount/Cancel/Void, once Stage 1 lands) and `Payment`/`Refund` (once task-326 lands), filtered per-Invoice. Mostly a read/query + UI task once Stage 1's audit entries exist to surface — sequencing note: do this *after* Stage 1, not before, so there's something meaningful to show.
- **task-328 (reserved): Payment History** — a standalone, cross-invoice payment list/filter endpoint (`GET /billing/payments` with date/method/branch filters) and UI; today payments are only visible nested inside one Invoice's detail (`GetInvoiceDetailUseCase`), with no cross-invoice view.

## Explicitly deferred (documented, not built by this epic)

- **UC-BIL-020 Daily Closing** — dropped from the Billing epic entirely; superseded by Finance's UC-FIN-005 (already implemented). See SAD annotation in `docs/03-sad/16-module-billing.md`.
- **UC-BIL-011/012 Print/Reprint Invoice** — blocked on a print/PDF infrastructure decision (thermal vs. A4 vs. PDF-only, reprint audit-trail requirements) that is out of this epic's scope. See SAD annotation.
- **UC-BIL-001 Create Invoice (manual)** — the shipped system only ever auto-generates an Invoice from a completed Visit (UC-BIL-002, task-054); a manual "Create Invoice" path would need a real workflow justification (e.g. billing for something with no Visit at all — a walk-in retail charge) that hasn't been identified. Flagged as an open product question, not built speculatively. See SAD annotation.

## Numbering

Highest existing task file before this epic: `task-321.md`. This epic reserves `task-322`–`task-326` (Stage 1, written now), `task-327`/`task-328` (Stage 4, reserved for later), `task-329`/`task-330` (Stage 2, reserved for later), `task-331`+ (Stage 3, reserved for later, starting with the Design Spike).
