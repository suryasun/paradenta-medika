# task-279: Calendar Synchronization (Google/Outlook)

**Phase:** Phase 6 - Healthcare Ecosystem
**Epic:** DM. Smart Scheduling
**Feature:** DM2. External Calendar Sync
**Module:** Reservation
**Priority:** P3 - Low

---

## Business Goal

Implement Calendar Synchronization per docs/03-sad/13-module-reservation.md Section 37.3's literal 'Calendar Synchronization', 'Google Calendar Integration', and 'Outlook Calendar Integration' Phase 4 roadmap items, letting a doctor's Parakita schedule appear in their external calendar.

## Depends On

- Phase 1 Reservation's Doctor Schedule (task-023)
- task-013 (Authentication Middleware)
- task-014 (Authorization Middleware)
- task-006 (Audit Trail Service)

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md, docs/04-ai-contract/04-api-contract.md, docs/04-ai-contract/06-database-contract.md, docs/04-ai-contract/09-security-contract.md
- **PRD:** docs/01-prd/features/reservation.md, docs/01-prd/business-rules.md § 3
- **SAD:** docs/03-sad/13-module-reservation.md (Section 37.3 Phase 4 (Calendar Synchronization, Google Calendar Integration, Outlook Calendar Integration))
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

Phase 1's Doctor entity/schedule (task-023), task-013, task-014, task-006.

## Backend Scope

- Infrastructure layer: OAuth2 connectors for Google Calendar API and Microsoft Graph (Outlook) — provider credentials sourced from Secret Management (Phase 5 task-252).
- Application layer: `SyncDoctorCalendarUseCase`, a one-way (Parakita → external calendar) sync of confirmed reservations as calendar events, triggered on Create/Update/Cancel Reservation, per Phase 5's Message Broker (task-236) event flow.

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

Adds a doctor_calendar_connections table storing OAuth tokens (via Secret Management, not plaintext) per doctor per provider.

## API Impact

Adds POST /doctors/{doctorId}/calendar-connections (convention-derived, OAuth callback flow).

## Workflow Impact

A doctor's external calendar reflects their Parakita schedule without manual duplicate entry.

## Security Impact

OAuth tokens are never stored in plaintext; a doctor can disconnect at any time, immediately halting sync.

## Testing Required

- Unit tests for the Use Case/Entity (per docs/05-testing/unit-tests.md).
- Integration test for Controller/Repository (per docs/05-testing/api-tests.md).

## Deliverables

- Google Calendar and Outlook OAuth connectors
- `SyncDoctorCalendarUseCase`, routes, controllers, tests

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/reservation.md:

- Creating a reservation for a connected doctor produces a corresponding external calendar event within a reasonable delay.
- Cancelling a reservation removes/updates the corresponding external event.
- Disconnecting immediately halts further sync with no residual token retained in plaintext.

## Definition of Done

Both provider connectors and the sync use case implemented and tested against the create/update/cancel/disconnect flows.

---

## Dependency Detail

- **Blocked By:** Phase 1 Reservation module
- **Required Before:** See phase-6-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
