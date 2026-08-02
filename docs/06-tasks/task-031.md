# task-031: Reservation List & Search (GET /api/v1/reservations)

**Phase:** Phase 1 - Foundation (MVP)  
**Epic:** E. Reservation Management  
**Feature:** E1. Booking  
**Module:** Reservation  
**Priority:** P0 - Blocking

---

## Business Goal

Allow Registration Staff and Clinic Managers to see and search all reservations for a given date/doctor/status, essential for daily front-desk operations.

## Depends On

- task-002 (Create Reservation -- already implemented)
- task-013
- task-014

## Required Documents

- **AI Contract:** docs/04-ai-contract/04-api-contract.md
- **PRD:** docs/01-prd/features/reservation.md
- **SAD:** docs/03-sad/13-module-reservation.md Section 20.1 (GET /api/v1/reservations) and Section 20.3 (Search Parameters: keyword, doctorId, status, reservationType, reservationSource, dateFrom, dateTo, page, limit)
- **Design:** No page-level spec exists yet (documented gap per docs/02-design/pages/overview.md).

## Required Existing Code

task-002 (Reservation entity/repository).

## Backend Scope

- ListReservationsUseCase implementing all documented search parameters.
- GET /api/v1/reservations controller.

## Frontend Scope

- Reservation List page (calendar or table view) with filters.

## Database Impact

- Read-only query; requires indexes on reservation date/status/doctor_id from task-003.

## API Impact

- Adds GET /api/v1/reservations.

## Workflow Impact

Front-desk daily operations; feeds into Check-In (task-035).

## Security Impact

- Gated by reservation.read permission.

## Testing Required

- Unit test: each documented filter narrows results correctly.
- Integration test: pagination per API Contract.

## Deliverables

- ListReservationsUseCase, controller, route, DTOs, tests, frontend list page.

## Acceptance Criteria

- All documented filters (keyword, doctorId, status, type, source, date range) work individually and combined.
- Performance target < 1 second per docs/03-sad/13-module-reservation.md Section 36.4.

## Definition of Done

- Implemented, tested, permission-gated.

---

## Dependency Detail

- **Blocked By:** task-002, task-013, task-014.
- **Required Before:** task-035 (Check-In needs to locate the reservation first).
- **Can Run In Parallel With:** task-032, task-033, task-034.
