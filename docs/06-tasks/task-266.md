# task-266: Telemedicine Appointment & Consent

**Phase:** Phase 6 - Healthcare Ecosystem
**Epic:** DF. Telemedicine
**Feature:** DF1. Appointment Type
**Module:** Reservation
**Priority:** P2 - Medium

---

## Business Goal

Implement Telemedicine as a Reservation appointment type per docs/03-sad/13-module-reservation.md's literal 'Telemedicine Appointment' scope-2 category, paired with EMR's 'Persetujuan telemedicine' (telemedicine consent) requirement, giving Telemedicine a real data model even though the actual video-call mechanism (task-289) remains a design spike.

## Depends On

- Phase 1 Reservation's CreateReservationUseCase
- task-013 (Authentication Middleware)
- task-014 (Authorization Middleware)
- task-006 (Audit Trail Service)

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md, docs/04-ai-contract/04-api-contract.md, docs/04-ai-contract/06-database-contract.md, docs/04-ai-contract/09-security-contract.md
- **PRD:** docs/01-prd/features/reservation.md, docs/01-prd/business-rules.md § 3
- **SAD:** docs/03-sad/13-module-reservation.md (Section (Scope, listing 'Telemedicine Appointment' as an in-scope reservation category)) and docs/03-sad/15-module-emr.md Section (Consent, 'Persetujuan telemedicine')
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

Phase 1's CreateReservationUseCase, task-013, task-014, task-006.

## Backend Scope

- Domain layer: extend the `Reservation` entity's appointment-type enum to include `telemedicine`, per the literal in-scope category.
- Application layer: `CreateTelemedicineReservationUseCase`, requiring a linked telemedicine-specific consent record (extending Phase 3's Consent Management module, EMR Epic R) before the reservation can be confirmed.

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

Extends the reservations table's appointment-type field; links to the existing consent table.

## API Impact

Extends POST /api/v1/reservations to accept `appointmentType: telemedicine` (no new route; existing endpoint extension).

## Workflow Impact

Establishes the data model for telemedicine bookings; the actual video session (task-289) is a separate, more heavily-gapped capability.

## Security Impact

Telemedicine consent is mandatory before confirmation — reuses the existing Consent Management module's enforcement pattern (Phase 3), not a new consent mechanism.

## Testing Required

- Unit tests for the Use Case/Entity (per docs/05-testing/unit-tests.md).
- Integration test for Controller/Repository (per docs/05-testing/api-tests.md).

## Deliverables

- Reservation entity extension
- `CreateTelemedicineReservationUseCase`, tests

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/reservation.md:

- A telemedicine reservation cannot be confirmed without a linked consent record.

## Definition of Done

Extension implemented and tested against the consent-required rule.

---

## Dependency Detail

- **Blocked By:** Phase 1 Reservation module, Phase 3 Consent Management (EMR Epic R)
- **Required Before:** See phase-6-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
