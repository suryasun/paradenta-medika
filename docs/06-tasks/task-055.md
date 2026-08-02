# task-055: Invoice List (GET /billing/invoices)

**Phase:** Phase 1 - Foundation (MVP)  
**Epic:** H. Billing Basic  
**Feature:** H1. Invoice Generation  
**Module:** Billing  
**Priority:** P1 - High

---

## Business Goal

Allow the Cashier to see all outstanding and paid invoices for the day/branch.

## Depends On

- task-054

## Required Documents

- **AI Contract:** docs/04-ai-contract/04-api-contract.md
- **PRD:** docs/01-prd/features/billing.md
- **SAD:** docs/03-sad/16-module-billing.md (GET /billing/invoices, per grep-verified endpoint list at line 2820)
- **Design:** No page-level spec exists yet (documented gap).

## Required Existing Code

task-054.

## Backend Scope

- ListInvoicesUseCase with pagination and status/date filters per the standard list-endpoint contract.

## Frontend Scope

- Billing/Cashier queue list page.

## Database Impact

- Read-only query against invoices.

## API Impact

- Adds GET /billing/invoices.

## Workflow Impact

Cashier's daily operational entry point.

## Security Impact

- Gated by billing.invoice.read (BILLING_VIEW per docs/03-sad/16-module-billing.md permission table).

## Testing Required

- Unit + integration tests for list/filter/pagination.

## Deliverables

- ListInvoicesUseCase, controller, route, DTOs, tests, frontend list page.

## Acceptance Criteria

- Invoices list correctly filtered by status/date, paginated per the API Contract.

## Definition of Done

- Implemented, tested, permission-gated.

---

## Dependency Detail

- **Blocked By:** task-054.
- **Required Before:** None blocking.
- **Can Run In Parallel With:** task-056, task-057, task-058.
