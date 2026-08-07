# ADR-001: Insurance Coverage Model (UC-BIL-006)

**Status:** Accepted — implemented by `docs/06-tasks/task-332.md` (user directed implementation directly, superseding the formal sign-off gate described below).
**Date:** 2026-08-07
**Related:** `docs/06-tasks/epic-billing-completion.md` Stage 3, `docs/06-tasks/task-331.md`, `docs/03-sad/16-module-billing.md` UC-BIL-006.

## Context

`docs/03-sad/16-module-billing.md` documents UC-BIL-006 "Apply Insurance" as three lines: *"Pilih Insurance. Sistem menghitung coverage. Remaining menjadi tagihan pasien"* ("Select Insurance. System calculates coverage. Remaining becomes the patient's bill"). The Insurance Exception Flow (§7) adds three outcomes — insurance inactive, coverage insufficient, validation failed — but again with no formula. No document anywhere specifies:

- **How coverage is computed** — flat percentage of the bill? Fixed copay? Per-Treatment-category rules (e.g. scaling covered, veneers not)? Annual/per-visit caps?
- **What an "Insurance" even is as data** — no `InsuranceProvider`/`InsurancePlan`/coverage-rule entity exists in Master Data or the Billing schema (`billing_deposits`/`billing_refunds`/etc. are specified in Part 4; no `billing_insurance*` table is).
- **Whether coverage is computed automatically at all** — "Insurance Validation Failed → Invoice tetap dibuat tanpa alokasi insurance" (the invoice still gets created without insurance allocation) implies validation can simply fail with no automated fallback, consistent with a manual, not a real-time-API, process.

Per this project's global rule ("never invent business rules... stop and report if missing"), none of the above can be implemented without either (a) real business input on the actual coverage model this clinic uses, or (b) a documented, defensible design decision that doesn't require guessing numbers or rules that were never specified. This ADR takes path (b).

## A key observation that reframes the problem

UC-BIL-006's own literal Indonesian wording is: *"Mengalokasikan **pembayaran** ke pihak asuransi"* — "Allocate **payment** to the insurance party." Not "apply a discount," not "compute a coverage rule." The SAD's own words describe this as a payment allocation, and Billing already has a fully general payment allocation mechanism: `CreatePaymentUseCase` (task-057), which already supports **multiple payment lines against one Invoice, each with its own `paymentMethodId` and `amount`** ("Split Payment"/"Multiple Payment", UC-BIL-009/010, already implemented).

This means Insurance coverage doesn't need a new parallel subsystem (a `Coverage`/`Allocation` entity, a rules engine, a "recompute grandTotal" step like Discount). It needs:
1. A way to identify a Payment as coming from an insurance party rather than the patient directly.
2. A minimal Master Data list of insurance providers to select from.
3. The **coverage amount itself entered by the Cashier**, not computed by a formula — because no formula is specified, and the Exception Flow's "validation failed → no allocation, invoice unaffected" behavior is exactly what a manual, verify-with-the-insurer-yourself process looks like (which matches how Indonesian dental clinics typically handle private/company insurance today: a phone/portal benefit check, not a live API).

"Remaining becomes the patient's bill" then falls out of the **already-existing** `outstanding = grandTotal - paidAmount` computation (`InvoiceMapper.ts`) with zero new formula — the same way a partial cash payment already reduces outstanding today.

## Decision

**Model Insurance coverage as a Payment with a payer classification, not as a new Coverage/Allocation subsystem.**

1. **New Master Data entity `InsuranceProvider`** (mirrors the existing flat `PaymentMethod` list pattern — `id`, `providerName`, `isActive`, `branchId?` if branch-scoped providers are ever needed). No `InsurancePlan`/coverage-rule sub-entity — out of scope until a real coverage-rule requirement is specified (see "Deferred" below).
2. **`Payment` gains**: `payerType` (`'PATIENT' | 'INSURANCE'`, default `'PATIENT'` — every existing Payment row is implicitly `PATIENT`, no backfill needed), `insuranceProviderId` (nullable FK, set only when `payerType = 'INSURANCE'`), `policyNumber` (nullable, free text — claim/policy reference for audit, matches UC-BIL-006's implicit need to trace which claim paid what).
3. **No change to `CreatePaymentUseCase`'s core logic** — it already validates `amount > 0`, sums against outstanding, and updates `Invoice.paidAmount`/`status`. It only needs to accept the three new optional fields per payment line and pass them through to `PaymentRepository.create`.
4. **The "coverage amount" is Cashier-entered**, exactly like `CreatePaymentUseCase`'s existing `amount` field for any other payment line — no automated calculation. This is the load-bearing decision this ADR makes explicitly, rather than leaving it implicit: **UC-BIL-006's "Sistem menghitung coverage" is interpreted as "the system totals up whatever coverage amount the Cashier confirmed with the insurer," not "the system runs a coverage-rule formula."** If a real automated coverage-rule engine is later required, that is new scope requiring its own ADR (see Deferred).
5. **UI**: the existing `CreatePaymentModal` (task-057, already supports multiple lines) gains a per-line "Payer" toggle (Patient / Insurance); selecting Insurance reveals Provider select + Policy Number field. No separate "Apply Insurance" screen.

## Consequences

- **Small, well-scoped implementation** (task-332): one new Master Data entity + CRUD, three new nullable `Payment` columns, `CreatePaymentUseCase`/`CreatePaymentRequestDto` extended (not replaced), `CreatePaymentModal` UI extended (not replaced). No new Invoice fields, no new "recalculate grandTotal" logic (unlike Discount/Manual Charge), no new status.
- **UC-BIL-006's literal endpoints** (`POST/DELETE /billing/invoices/{id}/insurance`) documented in the SAD's Part 5 are **not** built as separate endpoints under this decision — insurance allocation happens through the existing `POST /billing/payments` with the new fields on a payment line. This is a deliberate deviation from the SAD's literal endpoint list, justified by the reuse argument above; call this out explicitly to whoever reviews this ADR, since it's the one place this decision diverges from the letter of the documented API surface (not its intent).
- **Reporting**: "how much of my revenue is insurance-funded vs. patient-funded" becomes a simple `GROUP BY payerType` query — arguably easier to report on than a separate Coverage ledger would have been.
- **Refund** (task-326, already implemented) works unmodified — a `Refund` row still just references a `Payment`, regardless of that Payment's `payerType`.

## Deferred (explicitly out of scope of this ADR)

- **Automated coverage-rule computation** (percentage-of-subtotal, per-Treatment-category rules, annual caps) — requires real business input on an actual coverage model before any of it can be specified without inventing numbers. If/when that input exists, it should land as a new `InsurancePlan`/coverage-rule entity and a `CalculateCoverageUseCase` that *pre-fills* (not replaces) the Cashier-entered amount described above — additive to this decision, not a rebuild of it.
- **Live eligibility/claim submission integration** with any specific insurer or BPJS — a separate, larger integration effort (comparable in shape to the National Health Integration Design Spike, task-255), not assumed here.
- **`InsurancePlan` as a concept distinct from `InsuranceProvider`** — deferred until multiple plans per provider is a real, specified need.

## Alternatives considered

- **A. Bespoke Coverage/Allocation entity + rules engine** (percentage or fixed-cap per Insurance Plan, `InsuranceCalculationService` computing coverage automatically). Rejected for now: would require inventing the exact coverage formula and plan data model, which is precisely the missing information this ADR exists to avoid guessing. Revisit if real coverage rules are provided.
- **B. Insurance coverage as a Discount variant** (add `INSURANCE` as a fifth `discountSource` alongside task-322's `DOCTOR/PROMOTION/MEMBERSHIP/MANUAL`). Rejected: a discount permanently reduces `grandTotal` (the bill itself shrinks); insurance coverage does not shrink the bill, it pays part of it on the patient's behalf — the distinction matters for accounting (revenue recognition should show the full billed amount, with insurance and patient as two different payers), which the Payment-based model in this decision preserves correctly and the Discount model would not.
