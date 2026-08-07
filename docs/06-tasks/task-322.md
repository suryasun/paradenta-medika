# task-322: Apply Discount to Invoice

**Epic:** Billing Module Completion, Stage 1 (`docs/06-tasks/epic-billing-completion.md`)
**Module:** Billing
**Priority:** P1 - High

---

## Business Goal

Implement UC-BIL-005 "Apply Discount" (`docs/03-sad/16-module-billing.md` L1696–1713): let Cashier/Manager apply a discount to an Invoice before it's fully paid, sourced from Doctor/Promotion/Membership/Manual, recalculating `grandTotal`. Today `Invoice.discount`/`InvoiceItem.discount` columns exist in the schema but are hardcoded to `0` at every write site (`GenerateInvoiceUseCase.ts:71,90`, `SyncTreatmentToInvoiceUseCase.ts:60`) — no discount has ever actually been applicable.

## Depends On

- task-054 (Generate Invoice), task-057 (Create Payment — discount must respect payment state)

## Required Documents

- **SAD:** `docs/03-sad/16-module-billing.md` UC-BIL-005 (L1696–1713), §13 Validation Rules ("total discount ≤ authorization limit", L3089–3120), Part 4 `billing_discounts` table (L2125–2413, for reference — this task deliberately does not build a separate table, see Backend Scope)
- **Business Rules:** `docs/01-prd/business-rules.md` §5 "Discount" subsection

## Required Existing Code

`Invoice.discount`/`Invoice.grandTotal` fields (`apps/backend/prisma/schema.prisma`), `assertTreatmentEditable.ts` (pattern to mirror for "not once PAID/CLOSED" guard — this task needs its own equivalent `assertInvoiceEditable`-style check, not a reuse of that exact function since it's EMR/Treatment-specific), `GenerateInvoiceUseCase.ts`/`CreatePaymentUseCase.ts` (for how `grandTotal` is currently computed/consumed).

## Backend Scope

- `Invoice` model gains `discountReason: String?`, `discountSource: String?` (enum-like string: `DOCTOR`/`PROMOTION`/`MEMBERSHIP`/`MANUAL`, following the same "String not Prisma enum" convention already used for `InvoiceItem.referenceType`), `discountApprovedBy: String?`. **Not** a separate `InvoiceDiscount`/`billing_discounts` table — the SAD's flow doesn't describe multiple concurrent discounts per Invoice, so extending the existing flat `Invoice.discount` field (already present, just unused) is the minimal correct model; revisit only if a real multi-discount-per-invoice need surfaces later.
- New `ApplyDiscountUseCase.ts`: input `{ invoiceId, amount, source, reason, actorUserId }`. Guards: Invoice must exist, must not be PAID/CLOSED/CANCELLED/VOID (new statuses from task-324/325). Validates `amount <= subtotal` (discount can't exceed the pre-discount total — the SAD's "authorization limit" language likely maps to a permission-level cap; if a numeric per-role authorization limit is wanted beyond a simple permission gate, treat that as a follow-up, not silently invented here). Recomputes `grandTotal = subtotal - discount + tax`. Persists `discount`, `discountReason`, `discountSource`, `discountApprovedBy = actorUserId`. Audit-logs old/new `discount`/`grandTotal`.
- New `RemoveDiscountUseCase.ts`: clears the discount fields, recomputes `grandTotal = subtotal + tax`, same guards, audit-logged.
- New permission `billing.invoice.discount.apply` (added to `PERMISSION_KEYS` in `seed.ts`, granted to CASHIER/Manager-equivalent roles per the existing role-permission convention).
- New routes: `POST /billing/invoices/:id/discount` (apply), `DELETE /billing/invoices/:id/discount` (remove) — matches the SAD's documented endpoint shape (§ API Endpoints, L2700–2995).

## Frontend Scope

- `InvoiceDetailView.tsx`: show applied discount (amount/source/reason) in the summary; add an "Apply Discount" action (modal: amount, source select, reason) when UNPAID/PARTIALLY_PAID and permitted; "Remove Discount" action when a discount is present.
- `billing.service.ts`/`billing.types.ts`/a new `useInvoiceMutations.ts` hook (`useApplyDiscount`, `useRemoveDiscount`).

## Database Impact

Additive migration: `Invoice.discountReason`/`discountSource`/`discountApprovedBy` (nullable). No destructive change.

## API Impact

New `POST`/`DELETE /billing/invoices/:id/discount`. `GET /billing/invoices/:id` response gains the three new fields.

## Workflow Impact

None to the Invoice status state machine itself — a same-status mutation, like task-320's Treatment sync.

## Security Impact

New permission `billing.invoice.discount.apply`. If a numeric authorization-limit-per-role concept is wanted (SAD's "authorization limit" phrase), that's a follow-up decision, not assumed here.

## Testing Required

- Unit: `ApplyDiscountUseCase` — recomputes `grandTotal` correctly; rejects `amount > subtotal`; rejects once PAID/CLOSED/CANCELLED/VOID.
- Unit: `RemoveDiscountUseCase` — restores `grandTotal` to `subtotal + tax`.
- Integration: apply then remove a discount, confirm `grandTotal` round-trips correctly.

## Deliverables

Migration, `ApplyDiscountUseCase.ts`/`RemoveDiscountUseCase.ts`, routes, frontend UI, tests.

## Acceptance Criteria

- Applying a discount to an UNPAID/PARTIALLY_PAID Invoice reduces `grandTotal` by the discount amount and records source/reason/approver.
- A discount cannot exceed the Invoice's subtotal.
- Discount cannot be applied/removed once the Invoice is PAID, CLOSED, CANCELLED, or VOID.

## Definition of Done

Discount apply/remove shipped end-to-end, tests passing, `business-rules.md` §5 updated.

---

## Dependency Detail

- **Blocked By:** task-054, task-057
- **Required Before:** none
- **Can Run In Parallel With:** task-323, task-324
