# task-025: Treatment Entity (CRUD)

**Phase:** Phase 1 - Foundation (MVP)  
**Epic:** C. Master Data Foundation  
**Feature:** C3. Treatment Catalog  
**Module:** Master Data  
**Priority:** P0 - Blocking

---

## Business Goal

Establish the Treatment catalog (the priced services a clinic offers) that EMR treatment entries (Epic G) and Billing invoice lines (Epic H) directly select from.

## Depends On

- task-024

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md
- **PRD:** docs/01-prd/features/master-data.md, docs/01-prd/business-rules.md Section 1
- **SAD:** docs/03-sad/11-module-master-data.md Section 11.10 (Treatment) -- Business Rules: belongs to one Category, has a Default Price, can use Inventory, can compute Doctor Fee, can receive a Discount, can be deactivated without deleting transaction history.
- **Design:** No page-level spec exists yet (documented gap).

## Required Existing Code

task-024 (Treatment Category).

## Backend Scope

- Treatment entity: code, name, category_id, duration, price, doctor_fee_type, doctor_fee_value, active flag (per docs/03-sad/11-module-master-data.md Section 11.10 Main Attributes).
- CRUD Use Cases; deactivation must be a soft flag (active=false), never a hard delete, to preserve transaction history per the documented business rule.
- GET/POST /api/v1/treatments, GET/PUT /api/v1/treatments/{id} (endpoint path derived from documented URL convention).

## Frontend Scope

- Treatment List/Detail/Edit pages with category filter.

## Database Impact

- Reads/writes treatments table (FK to treatment_categories).

## API Impact

- Adds GET/POST /api/v1/treatments, GET/PUT /api/v1/treatments/{id}.

## Workflow Impact

Directly consumed by task-053 (EMR Treatment Entry) and task-054 (Generate Invoice) -- an invoice line item's price and doctor fee calculation trace back to this entity.

## Security Impact

- Gated by a masterdata.treatment.manage-equivalent permission.

## Testing Required

- Unit test: deactivating a Treatment does not delete or break existing references to it from historical EMR/Billing records.
- Integration tests for CRUD endpoints.

## Deliverables

- Entity, Use Cases, Repository, controller, routes, DTOs, tests.

## Acceptance Criteria

- Treatment can be created (with a valid category), listed, retrieved, updated, deactivated.
- Deactivated treatments remain referenceable by historical records but are excluded from active-selection lists.

## Definition of Done

- Implemented, tested, permission-gated, audit-logged.

---

## Dependency Detail

- **Blocked By:** task-024.
- **Required Before:** task-053 (EMR Treatment Entry), task-054 (Generate Invoice).
- **Can Run In Parallel With:** task-021, task-022, task-023, task-026.
