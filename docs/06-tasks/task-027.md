# task-027: Patient List & Search (GET /patients)

**Phase:** Phase 1 - Foundation (MVP)  
**Epic:** D. Patient Management  
**Feature:** D1. Patient Registration & Profile  
**Module:** Patient  
**Priority:** P0 - Blocking

---

## Business Goal

Allow Registration Staff to find an existing patient by name/identity so they can book a reservation or check in without re-registering.

## Depends On

- task-001 (Create Patient -- already implemented)
- task-013
- task-014

## Required Documents

- **AI Contract:** docs/04-ai-contract/04-api-contract.md (Pagination, Filtering and Searching)
- **PRD:** docs/01-prd/features/patient.md
- **SAD:** docs/03-sad/12-module-patient.md Section 20.2 (GET /patients) and Section 20.3 (Query Parameters)
- **Design:** docs/02-design/pages/patient.md (Patient List page spec)

## Required Existing Code

task-001 (Patient entity/repository already exist from CreatePatientUseCase).

## Backend Scope

- ListPatientsUseCase supporting the documented query parameters (keyword/name search, pagination, filters per docs/03-sad/12-module-patient.md Section 20.3).
- GET /patients controller.

## Frontend Scope

- Patient List page per docs/02-design/pages/patient.md Section 12.1 (Patient List page, with List Actions per Section 12.3: View, Edit, Register Reservation, View History, Upload Photo, Export, Archive).

## Database Impact

- Read-only query against patients table; requires the search/name index from task-003.

## API Impact

- Adds GET /patients.

## Workflow Impact

First step of the Patient Journey (docs/03-sad/01-system-overview.md Section 21.1) when the patient already exists.

## Security Impact

- Gated by patient.read (or equivalent) permission.

## Testing Required

- Unit test: search by keyword returns matching patients.
- Integration test: pagination parameters behave per the API Contract.

## Deliverables

- ListPatientsUseCase, controller, route, DTOs, tests, frontend Patient List page.

## Acceptance Criteria

- Search by name/keyword returns correctly filtered, paginated results.
- Response conforms to the standard list/pagination envelope.

## Definition of Done

- Implemented, tested, permission-gated.

---

## Dependency Detail

- **Blocked By:** task-001, task-013, task-014.
- **Required Before:** task-002 (Create Reservation UI flow needs to search for an existing patient first).
- **Can Run In Parallel With:** task-028, task-029, task-030.
