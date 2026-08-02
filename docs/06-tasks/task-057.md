# task-057: Create Payment (POST /billing/payments)

**Phase:** Phase 1 - Foundation (MVP)  
**Epic:** H. Billing Basic  
**Feature:** H2. Payment  
**Module:** Billing  
**Priority:** P0 - Blocking

---

## Business Goal

Allow the Cashier to record a payment (full or partial) against an invoice, the final step of the core Patient Journey critical path.

## Depends On

- task-054
- task-026 (Payment Method)
- task-013
- task-014
- task-006

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md
- **PRD:** docs/01-prd/features/billing.md, docs/01-prd/business-rules.md Section 5
- **SAD:** docs/03-sad/16-module-billing.md (POST /billing/payments, per grep-verified endpoint list at line 2870); permission table line 5416 (PAYMENT_CREATE)
- **Design:** No page-level spec exists yet (documented gap).

## Required Existing Code

task-054 (Invoice to pay against), task-026 (Payment Method reference).

## Backend Scope

- CreatePaymentUseCase: accept invoiceId, paymentMethodId, amount; support full and partial payment (per Phase 1 roadmap 'Pembayaran' goal and docs/03-sad/01-system-overview.md Business Function list including partial/multiple payment types, though full Split/Multiple-payment orchestration detail belongs to docs/03-sad/16-module-billing.md and should be read in full before implementation, not assumed here); update invoice paid-amount and status (Partially Paid / Paid).
- POST /billing/payments controller.

## Frontend Scope

- Payment form on the Invoice Detail page (amount, payment method selection).

## Database Impact

- Inserts a payments row; updates invoices.paid_amount and .status.

## API Impact

- Adds POST /billing/payments.

## Workflow Impact

Final step of the critical Patient Journey (Patient -> Reservation -> CheckIn -> Queue -> Doctor -> EMR -> Billing -> Payment -> Completed, per docs/03-sad/01-system-overview.md Section 21.1).

## Security Impact

- Gated by billing.payment.create (PAYMENT_CREATE).
- Audit Trail entry required -- financial transaction, high sensitivity.

## Testing Required

- Unit test: full payment marks invoice Paid.
- Unit test: partial payment marks invoice Partially Paid and correctly tracks remaining balance.
- Unit test: payment exceeding the invoice balance is rejected.

## Deliverables

- CreatePaymentUseCase, controller, route, DTOs, tests, frontend Payment form.

## Acceptance Criteria

- Full payment transitions invoice to Paid.
- Partial payment updates paid_amount without prematurely closing the invoice.
- Over-payment is rejected.
- Publishes PaymentCompleted event consumed by Finance/Reporting per docs/03-sad/02-system-architecture.md Section 24.1 (Finance module itself is out of Phase 1 scope, but the event contract should still be honored for forward compatibility).

## Definition of Done

- Implemented, tested, permission-gated, audit-logged.

---

## Dependency Detail

- **Blocked By:** task-054, task-026.
- **Required Before:** task-058 (Close Invoice).
- **Can Run In Parallel With:** task-055, task-056.
