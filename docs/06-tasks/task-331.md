# task-331: Insurance Coverage Model — Design Spike

**Epic:** Billing Module Completion, Stage 3 (`docs/06-tasks/epic-billing-completion.md`)
**Feature:** Feasibility & Design
**Module:** Billing
**Priority:** P1 - High (blocks all Insurance implementation)

---

## Business Goal

Produce the missing design for UC-BIL-006 "Apply Insurance" (`docs/03-sad/16-module-billing.md`), since the only source material is a three-line Main Flow ("Pilih Insurance. Sistem menghitung coverage. Remaining menjadi tagihan pasien") and a three-outcome Exception Flow (§7) — neither specifies a coverage-calculation formula or an Insurance Provider/Plan data model. No `InsuranceProvider`/`InsurancePlan`/coverage-rule entity exists anywhere in the codebase or in Master Data.

## Depends On

- task-054 (Generate Invoice), task-057 (Create Payment — the mechanism this spike's recommendation reuses), task-322 (Apply Discount — the "not the same thing as insurance" comparison point)

## Required Documents

- **AI Contract:** `docs/04-ai-contract/01-global-rules.md` (never invent business rules; stop and report if missing — the exact situation this task addresses), `docs/04-ai-contract/06-database-contract.md`
- **SAD:** `docs/03-sad/16-module-billing.md` UC-BIL-006 (Part 3, "Apply Insurance"), §7 Insurance Exception Flow, Part 4 (no `billing_insurance*` table specified), Part 5 API section (documents `POST/DELETE /billing/invoices/{id}/insurance` with no request/response schema detail)
- **Business Rules:** `docs/01-prd/business-rules.md` §5 — no Insurance subsection exists at all (Invoice/Payment/Cancel & Void/Discount/Refund/Deposit are the only subsections)

## Required Existing Code

`CreatePaymentUseCase.ts`/`CreatePaymentRequestDto.ts` (task-057 — already supports multi-line/split payments, the mechanism this spike's ADR recommends reusing), `ApplyDiscountUseCase.ts` (task-322 — the pattern explicitly rejected as a model for Insurance, see ADR "Alternatives considered"), `PaymentMethod` master-data entity (the flat-list pattern `InsuranceProvider` would mirror).

## Backend Scope

This task does NOT implement Insurance. Per CLAUDE.md's Missing Information rule, no document specifies the coverage-calculation formula, so none can be built without guessing.

- Deliverable is `docs/adr/ADR-001-insurance-coverage-model.md`, covering: (a) the "Payment allocation, not a discount" reframing (UC-BIL-006's own wording is "*mengalokasikan pembayaran*" — allocate *payment* — not "apply coverage"), (b) the recommended model (new `InsuranceProvider` Master Data entity + `Payment.payerType`/`insuranceProviderId`/`policyNumber`, reusing `CreatePaymentUseCase` as-is rather than a new Coverage/Allocation subsystem), (c) an explicit statement that the coverage *amount* is Cashier-entered (manual, verified with the insurer out-of-band), not system-computed — since no formula exists to compute it, (d) what's deferred (automated coverage-rule computation, live eligibility/claim integration, multi-plan-per-provider) and why, (e) alternatives considered and rejected (bespoke rules engine; modeling Insurance as a Discount source).

## Frontend Scope

No dedicated page in this task. Per the ADR's recommendation, once approved, the actual UI change (task-332) would be additive to the existing `CreatePaymentModal` (a Payer toggle + Provider/Policy fields per line), not a new screen.

## Database Impact

None (design task). The ADR's recommended schema (`InsuranceProvider` table, three new nullable `Payment` columns) is deferred to task-332.

## API Impact

None (design task). Per the ADR, UC-BIL-006's literal `POST/DELETE /billing/invoices/{id}/insurance` endpoints are recommended *not* to be built — insurance allocation happens through the existing `POST /billing/payments` instead. This deviation from the SAD's literal endpoint list is called out explicitly in the ADR for reviewer attention.

## Workflow Impact

Unblocks task-332 (Insurance implementation). Without this ADR, no Insurance code can be written without inventing a coverage formula or data model.

## Security Impact

None beyond what task-332 will need (a new `billing.invoice.insurance.apply`-style permission, once implemented) — not addressed here.

## Testing Required

- Not applicable (no code produced). Verification is architecture review sign-off on the ADR.

## Deliverables

- `docs/adr/ADR-001-insurance-coverage-model.md`

## Acceptance Criteria

- The ADR is reviewed and approved by the project's architecture owner (or the requesting user, in this repo's working mode).
- The ADR states explicitly what is and is not being decided (coverage calculation is deferred; payment-allocation modeling is decided).

## Definition of Done

ADR authored. **This task deliberately does not produce a live Insurance feature.** Per CLAUDE.md's Missing Information rule, task-332 (implementation) is explicitly BLOCKED until this ADR is approved.

---

## Dependency Detail

- **Blocked By:** task-054, task-057
- **Required Before:** task-332 (Insurance implementation, once ADR-001 is approved)
- **Can Run In Parallel With:** Stage 2 (Deposit) and Stage 4 (History) work
