# task-058: Close Invoice (POST /billing/invoices/{id}/close)

**Phase:** Phase 1 - Foundation (MVP)  
**Epic:** H. Billing Basic  
**Feature:** H2. Payment  
**Module:** Billing  
**Priority:** P1 - High

---

## Business Goal

Explicitly close an invoice once fully paid, locking it from further modification and completing the Patient Journey's Billing step.

## Depends On

- task-057

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md
- **PRD:** docs/01-prd/business-rules.md § 5
- **SAD:** docs/03-sad/16-module-billing.md (POST /billing/invoices/{id}/close, per grep-verified endpoint list at line 2844; permission table line 5419 BILLING_CLOSE)
- **Design:** No page-level spec exists yet (documented gap).

## Required Existing Code

task-057 (invoice must be fully paid before close, per the business rule 'Invoice Paid tidak dapat diubah' documented in docs/01-prd/acceptance-criteria/billing.md).

## Backend Scope

- CloseInvoiceUseCase: validate invoice status is Paid before allowing close; lock the invoice from further edits.
- POST /billing/invoices/{id}/close controller.

## Frontend Scope

- 'Close' action on the Invoice Detail page, enabled only when the invoice is fully paid.

## Database Impact

- Updates invoices.status to Closed.

## API Impact

- Adds POST /billing/invoices/{id}/close.

## Workflow Impact

Completes the critical Patient Journey (docs/03-sad/01-system-overview.md Section 21.1: ... Payment -> Completed).

## Security Impact

- Gated by billing.invoice.close (BILLING_CLOSE).
- Once Closed, the invoice cannot be modified (per docs/01-prd/acceptance-criteria/billing.md: 'Invoice Closed tidak dapat dimodifikasi').

## Testing Required

- Unit test: closing an unpaid or partially-paid invoice is rejected.
- Unit test: a closed invoice rejects any further update attempt.

## Deliverables

- CloseInvoiceUseCase, controller, route, DTOs, tests.

## Acceptance Criteria

- Only a fully-paid invoice can be closed.
- A closed invoice is immutable thereafter.

## Definition of Done

- Implemented, tested, permission-gated, audit-logged.

---

## Dependency Detail

- **Blocked By:** task-057.
- **Required Before:** None blocking.
- **Can Run In Parallel With:** None specific.
