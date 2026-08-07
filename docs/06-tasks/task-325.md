# task-325: Void Invoice

**Epic:** Billing Module Completion, Stage 1 (`docs/06-tasks/epic-billing-completion.md`)
**Module:** Billing
**Priority:** P1 - High

---

## Business Goal

Implement UC-BIL-015 "Void Invoice" (`docs/03-sad/16-module-billing.md` L1871–1881): a stronger reversal than Cancel (task-324), for an Invoice that already has activity (payment recorded, or already Closed) but must still be undone — e.g. billed to the wrong patient, duplicate Invoice, fraud/error discovered after the fact. Per SAD: "Requires Approval + Reason + Audit Trail." Today no reversal path exists once an Invoice has any payment against it.

## Depends On

- task-324 (Cancel Invoice — Void is explicitly the escalation path once Cancel's "no payment yet" precondition no longer holds), task-326 (Refund Payment — see the open decision below)

## Required Documents

- **SAD:** `docs/03-sad/16-module-billing.md` UC-BIL-015 (L1871–1881), Part 2 §9 State Machine (`Draft → Void`, adapted to this codebase's model the same way task-324 adapts `Cancelled`)
- **AI Contract:** check `docs/04-ai-contract/` for whether a generic Approval Workflow mechanism is documented/implemented (Phase 3 roadmap names "Approval Workflow" as its own epic) before building a one-off approval gate — this is the open decision below, not assumed here.
- **Business Rules:** `docs/01-prd/business-rules.md` §5

## Required Existing Code

`InvoiceStatus` enum, `CancelInvoiceUseCase.ts` (task-324, closest precedent), Finance's `VoidJournalUseCase.ts` (the only other "void" implementation in the codebase — read it for whatever approval-gating pattern it already uses, since reusing an established pattern beats inventing a new one).

## Backend Scope — with one explicit open decision to resolve before/during implementation

**Open decision (do not assume silently):** Can a `PAID`/`PARTIALLY_PAID` Invoice be voided directly (leaving its Payments/refund handling as a separate concern), or must all its Payments be fully refunded (task-326) *first*, with Void only usable afterward once `paidAmount` is back to `0`? The SAD's UC-BIL-015 doesn't specify the ordering. Recommend resolving this by checking `VoidJournalUseCase.ts`'s own precondition pattern (Finance's only precedent for "void something with financial history") before deciding, rather than guessing here.

- `InvoiceStatus` enum gains `VOID`.
- New `VoidInvoiceUseCase.ts`: input `{ invoiceId, reason, actorUserId }` (request) — if a two-step approval pattern is adopted (see open decision), a second `ApproveVoidInvoiceUseCase.ts` input `{ invoiceId, approverUserId }`. Guards: Invoice exists, not already CLOSED-and-finalized-beyond-reach (decide during implementation whether CLOSED invoices can still be voided, or only UNPAID/PARTIALLY_PAID/PAID — CLOSED today is documented elsewhere as "immutable," so voiding a CLOSED invoice may need its own explicit carve-out or may simply be disallowed). Sets `status: 'VOID'`, records `reason`, `voidedBy`/`voidedAt`, and `voidApprovedBy` if approval is required. Mandatory reason + audit trail, per SAD.
- New permission(s): `billing.invoice.void` (request) and, if a two-step approval is built, `billing.invoice.void.approve` (approve) — distinct from the requester's permission, so a single cashier can't both request and approve their own void.
- New route(s): `POST /billing/invoices/:id/void` (and `POST /billing/invoices/:id/void/approve` if two-step).

## Frontend Scope

- `InvoiceDetailView.tsx`: "Void Invoice" action (confirm + mandatory reason) for eligible statuses/permissions; if two-step approval is built, a pending-approval state visible to approvers.

## Database Impact

Additive migration: `InvoiceStatus.VOID`, `Invoice.voidReason`/`voidedBy`/`voidedAt`/`voidApprovedBy` (nullable).

## API Impact

New `POST /billing/invoices/:id/void` (and possibly `.../void/approve`).

## Workflow Impact

New terminal status `VOID`. Interacts with task-326 (Refund) per the open decision above — resolve the ordering before finalizing this task's acceptance criteria.

## Security Impact

New permission(s) `billing.invoice.void`(`.approve`). Mandatory reason + audit trail, per SAD's explicit requirement — the most safety-critical operation in this epic (undoes a potentially-paid financial record), so the approval-separation (requester ≠ approver, if two-step is adopted) matters more here than anywhere else in Stage 1.

## Testing Required

- Unit: `VoidInvoiceUseCase` — voids an eligible Invoice with mandatory reason; rejects missing reason; rejects already-VOID/CANCELLED.
- Unit (if two-step): approval flow — request then approve, rejects self-approval.
- Integration: voided Invoice excluded from outstanding-balance aggregation and from any "active invoice" listing default filter.

## Deliverables

Migration, `VoidInvoiceUseCase.ts` (+ approval use case if adopted), route(s), frontend UI, tests.

## Acceptance Criteria

- An eligible Invoice can be voided with a mandatory reason, recorded in the audit trail.
- The Payment-refund ordering question (see open decision) is explicitly resolved and documented in this task's final implementation, not left ambiguous.
- VOID is terminal.

## Definition of Done

Void Invoice shipped end-to-end (including the resolved approval/refund-ordering decision), tests passing, `business-rules.md` §5 updated.

---

## Dependency Detail

- **Blocked By:** task-324, task-326 (for the refund-ordering decision — implement after or alongside, not before, task-326 is at least designed)
- **Required Before:** none
- **Can Run In Parallel With:** task-322, task-323
