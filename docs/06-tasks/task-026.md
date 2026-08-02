# task-026: Payment Method Entity (CRUD)

**Phase:** Phase 1 - Foundation (MVP)  
**Epic:** C. Master Data Foundation  
**Feature:** C4. Payment Method  
**Module:** Master Data  
**Priority:** P1 - High

---

## Business Goal

Establish the Payment Method catalog (Cash, Debit, Credit Card, Transfer, etc.) that task-057 (Create Payment) must select from.

## Depends On

- task-013
- task-014
- task-006

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md
- **PRD:** docs/01-prd/features/master-data.md
- **SAD:** docs/03-sad/11-module-master-data.md Section 11.16 (Payment Method)
- **Design:** No page-level spec exists yet (documented gap).

## Required Existing Code

task-013, task-014, task-006.

## Backend Scope

- PaymentMethod entity, CRUD Use Cases.
- GET/POST /api/v1/payment-methods, GET/PUT /api/v1/payment-methods/{id} (endpoint path derived from documented URL convention).

## Frontend Scope

- Payment Method List/Edit (settings page).

## Database Impact

- Reads/writes payment_methods table.

## API Impact

- Adds GET/POST /api/v1/payment-methods, GET/PUT /api/v1/payment-methods/{id}.

## Workflow Impact

Directly consumed by task-057 (Create Payment) in Epic H.

## Security Impact

- Gated by a masterdata.payment-method.manage-equivalent permission.

## Testing Required

- Unit + integration tests for CRUD.

## Deliverables

- Entity, Use Cases, Repository, controller, routes, DTOs, tests.

## Acceptance Criteria

- Payment Method can be created, listed, retrieved, updated.

## Definition of Done

- Implemented, tested, permission-gated, audit-logged.

---

## Dependency Detail

- **Blocked By:** task-013, task-014, task-006.
- **Required Before:** task-057 (Create Payment).
- **Can Run In Parallel With:** task-021 through task-025.
