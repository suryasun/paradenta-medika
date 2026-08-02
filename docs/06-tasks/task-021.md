# task-021: Clinic Entity (CRUD)

**Phase:** Phase 1 - Foundation (MVP)  
**Epic:** C. Master Data Foundation  
**Feature:** C1. Clinic & Branch  
**Module:** Master Data  
**Priority:** P0 - Blocking

---

## Business Goal

Establish the Clinic master record, the top-level tenant entity every Branch, Doctor, and transaction is ultimately scoped under.

## Depends On

- task-013
- task-014
- task-006

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md
- **PRD:** docs/01-prd/features/master-data.md, docs/01-prd/business-rules.md Section 1
- **SAD:** docs/03-sad/11-module-master-data.md Section 11.1 (Clinic)
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md).

## Required Existing Code

task-003 (clinics table), task-013, task-014, task-006.

## Backend Scope

- Clinic entity, CreateClinicUseCase, UpdateClinicUseCase, ListClinicsUseCase, GetClinicUseCase.
- Endpoints following the documented REST convention: GET/POST /api/v1/clinics, GET/PUT /api/v1/clinics/{id} (route paths derived from the URL Convention in docs/04-ai-contract/04-api-contract.md -- the SAD's Master Data section does not enumerate literal endpoint paths for this entity, so this task applies the documented convention rather than inventing an undocumented one).

## Frontend Scope

- Clinic List/Detail/Edit pages (Administrator-only).

## Database Impact

- Reads/writes clinics table.

## API Impact

- Adds GET/POST /api/v1/clinics, GET/PUT /api/v1/clinics/{id}.

## Workflow Impact

Foundational reference data; Branch (task-022) is scoped under Clinic.

## Security Impact

- Gated by a masterdata.clinic.manage-equivalent permission (to be seeded alongside task-018).

## Testing Required

- Unit tests for each Use Case.
- Integration tests for each endpoint.

## Deliverables

- Entity, Use Cases, Repository, controller, routes, DTOs, tests.

## Acceptance Criteria

- Clinic can be created, listed, retrieved, and updated by an authorized user.
- Unauthorized users are rejected with 403.

## Definition of Done

- Implemented, tested, permission-gated, audit-logged.

---

## Dependency Detail

- **Blocked By:** task-013, task-014, task-006.
- **Required Before:** task-022 (Branch).
- **Can Run In Parallel With:** task-007 through task-020 (different module).
