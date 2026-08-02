# task-268: Patient Self-Check-In & QR Code Check-In

**Phase:** Phase 6 - Healthcare Ecosystem
**Epic:** DG. Patient Mobile App
**Feature:** DG1. Self-Service Check-In
**Module:** Reservation
**Priority:** P2 - Medium

---

## Business Goal

Implement Self Check-in and QR Code Check-in per docs/03-sad/13-module-reservation.md Section 37.2's literal Phase 3 mobile-roadmap items, letting a patient check in for an existing reservation without staff intervention — a concrete, buildable slice of the roadmap 'Patient Mobile App' item, distinct from a full native mobile application.

## Depends On

- Phase 1 Reservation's Check-In flow (task-035)
- task-013 (Authentication Middleware)
- task-014 (Authorization Middleware)
- task-006 (Audit Trail Service)

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md, docs/04-ai-contract/04-api-contract.md, docs/04-ai-contract/06-database-contract.md, docs/04-ai-contract/09-security-contract.md
- **PRD:** docs/01-prd/features/reservation.md, docs/01-prd/business-rules.md § 3
- **SAD:** docs/03-sad/13-module-reservation.md (Section 37.2 Phase 3 (Mobile Application, Doctor Mobile App, Self Check-in, QR Code Check-in, Digital Queue Display, Waiting List Management))
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

Phase 1's Check-In use case (task-035), task-013, task-014, task-006.

## Backend Scope

- Application layer: `SelfCheckInUseCase`, reachable via a short-lived QR code generated per confirmed reservation (encoding the reservation id, not raw patient data) that a patient scans to trigger the existing Check-In flow (task-035) themselves.
- Presentation layer: route, controller for `GET /reservations/{id}/checkin-qr` (generate) and `POST /reservations/checkin/{qrToken}` (consume) — both convention-derived.

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

No schema change beyond a short-lived QR token store (or signed-token approach requiring no persistence).

## API Impact

Adds GET /reservations/{id}/checkin-qr, POST /reservations/checkin/{qrToken}.

## Workflow Impact

Reuses Phase 1's existing Check-In → Queue entry generation (task-035) unchanged; this task only adds a self-service trigger path.

## Security Impact

QR token is short-lived and single-use; it encodes a reservation reference, not patient PII, and does not bypass the same validation task-035 already performs (e.g. cannot check in a reservation for the wrong date).

## Testing Required

- Unit tests for the Use Case/Entity (per docs/05-testing/unit-tests.md).
- Integration test for Controller/Repository (per docs/05-testing/api-tests.md).

## Deliverables

- `SelfCheckInUseCase`, QR token generation/validation, routes, controllers, tests

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/reservation.md:

- A generated QR code successfully triggers the exact same Check-In outcome as staff-assisted check-in (task-035).
- An expired or already-used QR token is rejected.

## Definition of Done

Self-check-in flow implemented and tested, reusing task-035's validation without duplication.

---

## Dependency Detail

- **Blocked By:** Phase 1 Reservation Check-In (task-035)
- **Required Before:** See phase-6-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
