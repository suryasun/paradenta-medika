# task-090: Create Follow Up (with Auto-Reservation)

**Phase:** Phase 2 - Core Clinical Operations  
**Epic:** T. Referral & Follow Up  
**Feature:** T2. Follow Up  
**Module:** EMR / Reservation  
**Priority:** P2 - Medium

---

## Business Goal

Allow the Doctor to schedule a follow-up (control visit), optionally auto-creating a Reservation for the recommended date, per the documented business rule 'Follow Up dapat membuat Reservation otomatis'.

## Depends On

- Phase 1 task-048
- Phase 1 task-002 (Create Reservation)

## Required Documents

- **AI Contract:** docs/04-ai-contract/08-workflow-contract.md
- **PRD:** docs/01-prd/features/emr.md, docs/01-prd/features/reservation.md
- **SAD:** docs/03-sad/15-module-emr.md Section 26 (Follow Up -- fields: jadwal kontrol berikutnya, catatan tindak lanjut, prioritas, reminder; Business Rules: can auto-create a Reservation, Reminder is Future/Notification-Module-dependent, history becomes part of Clinical Timeline)
- **Design:** No page-level spec exists yet (documented gap).

## Required Existing Code

Phase 1 task-048, task-002 (this task should invoke CreateReservationUseCase, not duplicate it, mirroring task-064's pattern).

## Backend Scope

- CreateFollowUpUseCase: persist follow-up date, note, priority, linked to Visit; if the staff opts to auto-schedule, invoke CreateReservationUseCase (Phase 1 task-002) with the follow-up date.
- Reminder delivery is explicitly out of scope per the source ('Reminder dikirim melalui Notification Module (Future)') -- do not build a notification/reminder mechanism here.
- Endpoint path convention-derived, e.g. POST /api/v1/emr/visits/{visitId}/follow-ups.

## Frontend Scope

- Follow Up scheduling form within the Visit/EMR screen, with an 'auto-book reservation' toggle.

## Database Impact

- New follow_ups table linked to Visit; optionally a new reservations row (reusing Phase 1 schema).

## API Impact

- Adds the Follow Up creation endpoint.

## Workflow Impact

Feeds the Clinical Timeline (Epic U) and, when auto-scheduled, the Reservation module.

## Security Impact

- Gated by emr.followup.create permission (Doctor role).
- Audit Trail entry required.

## Testing Required

- Unit test: auto-scheduling produces a valid Reservation passing the same validation as any Phase 1 booking.
- Unit test: follow-up without auto-scheduling persists without creating a Reservation.

## Deliverables

- CreateFollowUpUseCase, controller, route, DTOs, tests, frontend form.

## Acceptance Criteria

- Follow-up persists with date/note/priority.
- Auto-scheduled follow-up produces a correctly validated Reservation.
- No reminder/notification mechanism is built (explicitly deferred per source).

## Definition of Done

- Implemented, tested, permission-gated, audit-logged.

---

## Dependency Detail

- **Blocked By:** Phase 1 task-048, task-002.
- **Required Before:** None blocking.
- **Can Run In Parallel With:** task-086 through task-089.
