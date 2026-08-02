# task-002: Reservation Booking (CreateReservation Use Case)

**Phase:** Phase 1 - Foundation (MVP)  
**Epic:** E. Reservation Management  
**Feature:** E1. Booking  
**Module:** Reservation  
**Priority:** P0 - Blocking

---

## Business Goal

Implement the `CreateReservationUseCase` for the Reservation module so a Registration Staff can book a patient against a doctor's schedule (or register a walk-in), the second step of the Patient Journey.

## Depends On

- task-001 (Create Patient — a patient must exist to reserve against)
- task-013 (Authentication Middleware)
- task-014 (Authorization Middleware)
- task-023 (Doctor entity)

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md, docs/04-ai-contract/08-workflow-contract.md, docs/04-ai-contract/04-api-contract.md
- **PRD:** docs/01-prd/features/reservation.md, docs/01-prd/business-rules.md § 3
- **SAD:** docs/03-sad/13-module-reservation.md (full), docs/03-sad/03-clean-architecture.md Section 41 (Golden Reference pattern to follow)
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md).

## Required Existing Code

task-001 (Patient), task-013, task-014, task-023 (Doctor), task-003 (reservations table).

## Backend Scope

- Presentation layer: route, controller, request DTO, validator (per docs/03-sad/13-module-reservation.md Section 20 — API Specification, Section 21 — Request & Response DTO).
- Application layer: `CreateReservationUseCase` (Booking flow) and `WalkInRegistrationUseCase` (Walk-in flow), per docs/03-sad/13-module-reservation.md Sections 12 and 17.
- Domain layer: `Reservation` entity/aggregate with the status lifecycle and business rules in docs/01-prd/business-rules.md § 3, sourced from docs/03-sad/13-module-reservation.md Sections 6–7.
- Doctor Schedule Validation (docs/03-sad/13-module-reservation.md Section 15) — reservation must not be created if the doctor's schedule is full or inactive.
- Infrastructure layer: `ReservationRepository` implementing `IReservationRepository` via Prisma.
- Publish `ReservationCreated` domain event, consumed by the Queue module per docs/03-sad/02-system-architecture.md Section 24.1.

Out of scope: Update/Reschedule/Cancel Reservation (task-032/033/034), Check-In (task-035, which generates the Queue entry), Doctor Availability lookup (task-036).

## Frontend Scope

- Reservation Booking form (patient search + doctor/time-slot selection, ideally consuming task-036's availability endpoint) and a Walk-in registration variant.

## Database Impact

- Inserts into the reservations table (task-003 schema), FK to patients and doctors.

## API Impact

- Adds POST /api/v1/reservations.

## Workflow Impact

Second step of the Patient Journey (docs/03-sad/01-system-overview.md Section 21.1): Patient → Reservation → CheckIn → Queue → Doctor → EMR → Billing → Payment → Completed.

## Security Impact

- Gated by reservation.create permission.
- Audit Trail entry required for the Create action.

## Testing Required

- Unit tests for both Use Cases and the Entity (per docs/05-testing/unit-tests.md).
- Integration test for Controller/Repository (per docs/05-testing/api-tests.md).

## Deliverables

- `CreateReservationUseCase` and `WalkInRegistrationUseCase` (application/use-cases/)
- `CreateReservationRequest` / `ReservationResponse` DTOs
- `Reservation` entity/aggregate (domain/entities/)
- `IReservationRepository` interface + Prisma implementation
- Route + Controller wiring
- Unit + integration tests

## Acceptance Criteria

Per docs/03-sad/13-module-reservation.md Section 36 (Test Scenarios), reproduced in docs/01-prd/acceptance-criteria/reservation.md:

**Functional:**

- Create Reservation → Success
- Walk-in → Reservasi berhasil dibuat

**Validation (must be rejected):**

- Slot penuh (schedule full)
- Jadwal dokter tidak aktif (doctor schedule inactive)
- Tanggal di masa lalu (past date)
- Double booking
- Pasien tidak aktif (inactive patient)

**Integration:**

- Patient module: patient must be validated as active before a reservation can be created against them.
- Authentication/Authorization: request must be validated against RBAC before the Use Case runs.

**Performance target** (per docs/03-sad/13-module-reservation.md Section 36.4): Create Reservation < 2 seconds.

**Status lifecycle:** the new Reservation must be created in `BOOKED` status per docs/03-sad/01-system-overview.md Section 21.2, and the Reservation Timeline (docs/03-sad/01-system-overview.md Section 21.3) must record the Booking event with timestamp and user.

## Definition of Done

- Both Use Cases implemented, tested per Acceptance Criteria above, and conform to the response envelope.
- Audit Trail entry and ReservationCreated event verified.

---

## Dependency Detail

- **Blocked By:** task-001, task-013, task-014, task-023.
- **Required Before:** task-031 through task-036 (all other Reservation tasks), task-035 (Check-In).
- **Can Run In Parallel With:** task-007 through task-030 (different modules), once its own dependencies are satisfied.
