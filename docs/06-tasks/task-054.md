# task-054: Generate Invoice from Completed Visit (POST /billing/invoices)

**Phase:** Phase 1 - Foundation (MVP)  
**Epic:** H. Billing Basic  
**Feature:** H1. Invoice Generation  
**Module:** Billing  
**Priority:** P0 - Blocking

---

## Business Goal

Automatically produce a billable Invoice from a completed Visit's Treatment entries, converting clinical work into a financial record the Cashier can collect payment against.

## Depends On

- task-052 (Close Visit)
- task-053 (Treatment Entry)
- task-013
- task-014
- task-006

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md
- **PRD:** docs/01-prd/features/billing.md, docs/01-prd/business-rules.md Section 5
- **SAD:** docs/03-sad/16-module-billing.md (POST /api/v1/billing/invoices, per grep-verified endpoint list); docs/03-sad/01-system-overview.md Section 23 (EMRFinished -> Generate Invoice)
- **Design:** No page-level spec exists yet (documented gap).

## Required Existing Code

task-003 (invoices table), task-052 (publishes the triggering event), task-053 (source of line items), task-025 (Treatment price reference).

## Backend Scope

- GenerateInvoiceUseCase, triggered by the EMRFinished event from task-052: read all visit_treatments for the Visit, create an Invoice with one line item per treatment (using the price snapshot from task-053), set initial status (e.g. Unpaid/Open).
- POST /billing/invoices controller for the event-triggered path; the same Use Case may also be exposed for manual invoice creation if the SAD's Billing workflow allows it -- verify against docs/03-sad/16-module-billing.md before adding a manual-create UI path.

## Frontend Scope

- Invoice auto-appears in the Cashier's Billing queue once generated; no manual creation form needed for the primary flow.

## Database Impact

- Inserts invoices and invoice_lines (or equivalent) rows.

## API Impact

- Adds POST /billing/invoices.

## Workflow Impact

This is the exact seam between Epic G (EMR) and Epic H (Billing): EMR Finished -> Generate Invoice -> (task-057) Payment.

## Security Impact

- Gated by billing.invoice.create permission (system-triggered path should not require interactive permission, only the event-consumer context).
- Audit Trail entry required.

## Testing Required

- Unit test: invoice line items match the Visit's recorded treatments and prices exactly.
- Integration test: closing a Visit (task-052) results in exactly one Invoice being created.

## Deliverables

- GenerateInvoiceUseCase, controller, route, DTOs, tests, event subscription wiring.

## Acceptance Criteria

- Every Completed Visit with at least one Treatment entry produces exactly one Invoice with matching line items and total.
- Invoice cannot be generated twice for the same Visit.

## Definition of Done

- Implemented, tested, permission-gated, audit-logged, cross-module event verified against task-052.

---

## Dependency Detail

- **Blocked By:** task-052, task-053, task-013, task-014, task-006.
- **Required Before:** task-057 (Payment).
- **Can Run In Parallel With:** task-055, task-056 can be developed in parallel once the invoices table exists.
