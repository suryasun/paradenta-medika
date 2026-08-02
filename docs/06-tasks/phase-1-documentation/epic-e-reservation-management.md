# Epic E: Reservation Management — Documentation (task-002, 031–036)

> Retroactive documentation, per the template in `epic-j-foundational-infrastructure.md`'s header note.

---

## Documentation Reviewed

- `docs/06-tasks/task-002.md`, `task-031.md`–`task-036.md`
- `docs/03-sad/13-module-reservation.md` (Sections 15–16 for Doctor Schedule placement)
- `docs/01-prd/business-rules.md` Section 3

## Task List

| Task | Name |
|---|---|
| task-002 | Create Reservation (re-implemented from scratch, same basis as task-001) |
| task-031 | Reservation List & Search |
| task-032 | Update Reservation |
| task-033 | Reschedule Reservation |
| task-034 | Cancel Reservation |
| task-035 | Check-In Patient |
| task-036 | Doctor Availability & Time Slots |

## Implementation Plan

Built the Reservation lifecycle (Booked → Confirmed → Check-In → ... → Completed/Cancelled/No-Show) plus doctor availability/time-slot computation against a distinct `DoctorSchedule` table (resolved per Ambiguity #5 in `phase-1-plan.md`). task-035 (Check-In) was initially deferred mid-epic because it required task-037 (Create Queue) from Epic F, which didn't exist yet — flagged to the user at Epic E's checkpoint and completed at the start of Epic F once Queue existed, via the `PatientCheckedIn` event rather than a direct cross-module call.

## Files Created

`apps/backend/src/modules/reservation/`: `application/{dtos,mappers,services,use-cases}/*`, `domain/{entities,events,exceptions,repositories}/*`, `infrastructure/repositories/*`, `presentation/{controllers,routes}/*`.

## Files Modified

`apps/backend/src/app.ts` (mounted `buildReservationModule`, passed the shared `eventBus`).

## Database Changes

None beyond Epic J's initial migration (`Reservation`, `ReservationTimeline` already scaffolded there).

## API Changes

| Endpoint | Permission |
|---|---|
| `GET /reservations` | `reservation.read` |
| `POST /reservations` | (CreateReservationUseCase) |
| `GET /reservations/:id` | `reservation.read` |
| `PUT /reservations/:id` | (UpdateReservationUseCase) |
| `PATCH /reservations/:id/reschedule` | (RescheduleReservationUseCase) |
| `PATCH /reservations/:id/cancel` | (CancelReservationUseCase) |
| `PATCH /reservations/:id/check-in` | `reservation.check-in` |
| `GET /reservations/doctor-availability` | (GetDoctorAvailabilityUseCase) |
| `GET /reservations/time-slots` | (GetDoctorTimeSlotsUseCase) |

## Frontend Changes

None. Reservation booking/list/reschedule screens are not built.

## Security Validation

- Double-booking prevention (`countActiveAtSlot`) and same-patient-same-day conflict checks (`countActiveForPatientOnDate`) enforced server-side in the use case, not just as a UI convenience.
- Check-in only transitions a Reservation in a valid pre-check-in status; publishes `PatientCheckedIn` only on success.

## Architecture Validation

- `CheckInPatientUseCase` publishes `PatientCheckedIn` via `IEventBus` rather than calling Queue's `CreateQueueUseCase` directly — the cross-module seam is event-only, per `docs/04-ai-contract/07-module-contract.md`. Verified end-to-end (not just per-module-in-isolation) by `tests/integration/checkInToQueue.test.ts` using the real `InMemoryEventBus`.
- `DoctorScheduleValidator` kept as an `application/services/` domain-adjacent service (pure logic, no I/O beyond the injected repository interface).
