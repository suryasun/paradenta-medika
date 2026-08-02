# task-056: Invoice Detail (GET /billing/invoices/{id})

**Phase:** Phase 1 - Foundation (MVP)  
**Epic:** H. Billing Basic  
**Feature:** H1. Invoice Generation  
**Module:** Billing  
**Priority:** P1 - High

---

## Business Goal

Allow the Cashier to view full invoice detail (line items, patient, totals) before collecting payment.

## Depends On

- task-054

## Required Documents

- **AI Contract:** docs/04-ai-contract/04-api-contract.md
- **PRD:** docs/01-prd/features/billing.md
- **SAD:** docs/03-sad/16-module-billing.md (GET /api/v1/billing/invoices/{id}, per grep-verified endpoint list at line 2812)
- **Design:** No page-level spec exists yet (documented gap).

## Required Existing Code

task-054.

## Backend Scope

- GetInvoiceDetailUseCase returning the invoice with its line items.

## Frontend Scope

- Invoice Detail page/panel, entry point for the Payment action (task-057).

## Database Impact

- Read-only query joining invoices and invoice_lines.

## API Impact

- Adds GET /billing/invoices/{id}.

## Workflow Impact

Precedes Payment (task-057) in the Cashier's flow.

## Security Impact

- Gated by billing.invoice.read (BILLING_VIEW).

## Testing Required

- Unit test: detail returns correct line items and total.
- Integration test: 404 for non-existent invoice.

## Deliverables

- GetInvoiceDetailUseCase, controller, route, DTOs, tests, frontend detail page.

## Acceptance Criteria

- Detail matches the treatments recorded in task-053 exactly.

## Definition of Done

- Implemented, tested, permission-gated.

---

## Dependency Detail

- **Blocked By:** task-054.
- **Required Before:** task-057 (Cashier typically views detail before taking payment).
- **Can Run In Parallel With:** task-055.
