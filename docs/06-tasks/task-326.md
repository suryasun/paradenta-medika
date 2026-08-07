# task-326: Refund Payment

**Epic:** Billing Module Completion, Stage 1 (`docs/06-tasks/epic-billing-completion.md`)
**Module:** Billing
**Priority:** P1 - High

---

## Business Goal

Implement UC-BIL-016 "Refund Payment" (`docs/03-sad/16-module-billing.md` L1883–1895): let staff reverse a Payment, fully or partially, when money was collected in error or a service wasn't delivered as billed. Per SAD: "validation: Payment Success, not already fully refunded." Today there is no refund capability anywhere in the codebase — payments only ever increase `Invoice.paidAmount`, never decrease it.

## Depends On

- task-057 (Create Payment — a Payment must exist to refund)

## Required Documents

- **SAD:** `docs/03-sad/16-module-billing.md` UC-BIL-016 (L1883–1895), Part 4 `billing_refunds` table (L2125–2413, the entity this task's new `Refund` model mirrors), Payment Status enum (§12, L536–544: documents a `Refunded` payment status)

## Required Existing Code

`CreatePaymentUseCase.ts` (the exact pattern this task's `RefundPaymentUseCase` mirrors in reverse: validates amount against outstanding, updates `Invoice.paidAmount`/`status`, publishes an event), `IPaymentRepository`/`PaymentRepository.ts`, `PAYMENT_COMPLETED_EVENT` (`BillingEvents.ts` — this task adds a sibling `PAYMENT_REFUNDED_EVENT`, since Finance's `RecordBillingPaymentUseCase.ts` already subscribes to Billing payment events to post journal entries, and a refund needs the same downstream Finance treatment as the original payment, just reversed).

## Backend Scope

- New `Refund` model (table `refunds`, matching the SAD's `billing_refunds`): `id`, `paymentId` (FK), `invoiceId` (FK, denormalized for query convenience), `amount`, `reason`, `approvedBy`, `createdBy`, `createdAt`. A `Payment` can have multiple partial `Refund` rows; "not already fully refunded" is validated as `sum(existing refunds for this payment) + newAmount <= payment.amount`.
- New `IRefundRepository`/`RefundRepository.ts`: `create`, `findByPaymentId`, `sumByPaymentId`.
- New `RefundPaymentUseCase.ts`: input `{ paymentId, amount, reason, actorUserId }`. Guards: Payment exists, Invoice not CLOSED (a closed/finalized invoice's payments are immutable — align with the existing "Invoice tidak boleh diedit setelah Paid... Perubahan dilakukan melalui Void atau Refund" business rule, meaning Refund is itself one of the two sanctioned "correction after Paid" paths, so it must remain possible on a PAID-but-not-yet-CLOSED invoice), `amount <= (payment.amount - already-refunded)`. Creates the `Refund` row. Decrements `Invoice.paidAmount` by `amount`; recomputes `status` (may move `PAID → PARTIALLY_PAID` or `PARTIALLY_PAID → UNPAID` if `paidAmount` drops to `0`) via a new/reused repository method (extend `updatePayment`'s shape or add a dedicated `applyRefund` method — decide based on whichever keeps `InvoiceRepository` cleanest during implementation). Publishes new `PAYMENT_REFUNDED_EVENT` (mirrors `PAYMENT_COMPLETED_EVENT`'s payload shape) so Finance's journal-posting pattern (`RecordBillingPaymentUseCase.ts`) can be mirrored with a `RecordBillingRefundUseCase.ts` in a Finance-side follow-up (out of this task's scope — Billing only needs to publish the event correctly; wiring Finance's subscriber is Finance's task).
- New permission `billing.payment.refund` (approval-relevant per SAD's UC-BIL-017 sibling "Deposit Refund" naming an explicit approval requirement — decide during implementation whether Payment Refund needs the same two-step approval as Void, since both are "money leaves the clinic" operations; the SAD's UC-BIL-016 itself doesn't say "Requires Approval" as explicitly as UC-BIL-015/017 do, so a single-permission gate is the literal reading unless evidence suggests otherwise).
- New route `POST /billing/payments/:id/refund` (matches SAD's documented endpoint).

## Frontend Scope

- `InvoiceDetailView.tsx`: each Payment row in the payments table gets a "Refund" action (modal: amount up to remaining refundable, reason) when the Invoice isn't CLOSED and permitted; refunded amount/remaining shown per payment.

## Database Impact

New `Refund` table (additive migration, no changes to existing tables beyond whatever `InvoiceRepository` method is added for the paidAmount/status adjustment — no new columns needed on `Invoice`/`Payment` themselves if the refund total is always derived by summing `Refund` rows rather than cached).

## API Impact

New `POST /billing/payments/:id/refund`. `GET /billing/invoices/:id` payments should surface each payment's refunded total (sum of its `Refund` rows) so the frontend can compute "remaining refundable" without a second call.

## Workflow Impact

`Invoice.paidAmount`/`status` can now move backward (PAID→PARTIALLY_PAID→UNPAID), which is new — every other place in the codebase that currently assumes `paidAmount` only increases (if any) must be checked during implementation, not assumed safe.

## Security Impact

New permission `billing.payment.refund`. Whether it needs two-step approval is an explicit decision to make during implementation (see Backend Scope) — resolve and document, don't leave ambiguous.

## Testing Required

- Unit: `RefundPaymentUseCase` — full refund moves Invoice back to UNPAID; partial refund moves PAID→PARTIALLY_PAID; rejects over-refunding (sum exceeds original payment amount); rejects on a CLOSED invoice.
- Unit: publishes `PAYMENT_REFUNDED_EVENT` with correct payload.
- Integration: refund then re-payment on the same invoice behaves correctly (status transitions both directions cleanly).

## Deliverables

Migration (`Refund` table), `IRefundRepository`/`RefundRepository.ts`, `RefundPaymentUseCase.ts`, `PAYMENT_REFUNDED_EVENT`, route, frontend UI, tests.

## Acceptance Criteria

- A Payment can be refunded fully or partially, up to its original amount minus any prior refunds.
- Refunding correctly moves the Invoice's `paidAmount`/`status` backward.
- Refund is blocked once the Invoice is CLOSED.
- `PAYMENT_REFUNDED_EVENT` is published for Finance's eventual downstream consumption (wiring that consumer is out of this task's scope).

## Definition of Done

Refund Payment shipped end-to-end, tests passing, `business-rules.md` §5 updated.

---

## Dependency Detail

- **Blocked By:** task-057
- **Required Before:** task-325 (Void's refund-ordering decision needs this to exist first)
- **Can Run In Parallel With:** task-322, task-323, task-324
