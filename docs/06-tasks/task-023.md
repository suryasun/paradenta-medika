# task-023: Doctor Entity (CRUD)

**Phase:** Phase 1 - Foundation (MVP)  
**Epic:** C. Master Data Foundation  
**Feature:** C2. Doctor & Schedule Reference  
**Module:** Master Data  
**Priority:** P0 - Blocking

---

## Business Goal

Establish the Doctor master record that Reservation (doctor assignment), Queue (doctor call), and EMR (visit ownership) all depend on.

## Depends On

- task-022

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md
- **PRD:** docs/01-prd/features/master-data.md, docs/01-prd/business-rules.md Section 1
- **SAD:** docs/03-sad/11-module-master-data.md Section 11.6 (Doctor)
- **Design:** No page-level spec exists yet (documented gap).

## Required Existing Code

task-022 (Branch), task-015 (a Doctor is also typically a User -- this task should link to an existing user_id rather than duplicating identity, per docs/03-sad/21-module-system.md's separation of 'Authentication owns credential lifecycle; System manages admin state').

## Backend Scope

- Doctor entity (linked to a User via user_id), CRUD Use Cases, fields per docs/03-sad/11-module-master-data.md Section 11.6.
- GET/POST /api/v1/doctors, GET/PUT /api/v1/doctors/{id} (endpoint path derived from documented URL convention).

## Frontend Scope

- Doctor List/Detail/Edit pages.

## Database Impact

- Reads/writes doctors table (FK to users, branches).

## API Impact

- Adds GET/POST /api/v1/doctors, GET/PUT /api/v1/doctors/{id}.
- Note: GET /api/v1/doctors/{id}/availability and .../time-slots are Reservation-module endpoints (task-036), not part of this task.

## Workflow Impact

Reservation (task-002, task-031-036), Queue (Epic F), and EMR (Epic G) all reference doctor_id.

## Security Impact

- Gated by a masterdata.doctor.manage-equivalent permission.

## Testing Required

- Unit + integration tests for CRUD.

## Deliverables

- Entity, Use Cases, Repository, controller, routes, DTOs, tests.

## Acceptance Criteria

- Doctor can be created (linked to an existing user), listed, retrieved, updated.
- Creating a Doctor with a non-existent user_id fails validation.

## Definition of Done

- Implemented, tested, permission-gated, audit-logged.

---

## Dependency Detail

- **Blocked By:** task-022, task-015.
- **Required Before:** task-002 (Create Reservation, already implemented -- verify it references this Doctor entity), task-036 (Doctor Availability), Epic F (Queue), Epic G (EMR).
- **Can Run In Parallel With:** task-024 through task-026.
