# task-024: Treatment Category Entity (CRUD)

**Phase:** Phase 1 - Foundation (MVP)  
**Epic:** C. Master Data Foundation  
**Feature:** C3. Treatment Catalog  
**Module:** Master Data  
**Priority:** P1 - High

---

## Business Goal

Establish the grouping structure for Treatments (e.g. Preventive, Restorative, Surgical), which every individual Treatment record must belong to.

## Depends On

- task-013
- task-014
- task-006

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md
- **PRD:** docs/01-prd/features/master-data.md
- **SAD:** docs/03-sad/11-module-master-data.md Section 11.9 (Treatment Category)
- **Design:** No page-level spec exists yet (documented gap).

## Required Existing Code

task-013, task-014, task-006.

## Backend Scope

- TreatmentCategory entity, CRUD Use Cases.
- GET/POST /api/v1/treatment-categories, GET/PUT /api/v1/treatment-categories/{id} (endpoint path derived from documented URL convention).

## Frontend Scope

- Treatment Category List/Edit (likely a simple settings page).

## Database Impact

- Reads/writes treatment_categories table.

## API Impact

- Adds GET/POST /api/v1/treatment-categories, GET/PUT /api/v1/treatment-categories/{id}.

## Workflow Impact

Prerequisite for task-025 (Treatment), which must reference a category.

## Security Impact

- Gated by a masterdata.treatment-category.manage-equivalent permission.

## Testing Required

- Unit + integration tests for CRUD.

## Deliverables

- Entity, Use Cases, Repository, controller, routes, DTOs, tests.

## Acceptance Criteria

- Category can be created, listed, retrieved, updated.

## Definition of Done

- Implemented, tested, permission-gated, audit-logged.

---

## Dependency Detail

- **Blocked By:** task-013, task-014, task-006.
- **Required Before:** task-025 (Treatment).
- **Can Run In Parallel With:** task-021, task-022, task-023, task-026.
