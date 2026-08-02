# Epic F: Queue Management — Documentation (task-037–047)

> Retroactive documentation, per the template in `epic-j-foundational-infrastructure.md`'s header note.

---

## Documentation Reviewed

- `docs/06-tasks/task-037.md`–`task-047.md`
- `docs/03-sad/14-module-queue.md` Section 23 (Queue State Transition diagram — treated as the single exhaustive authority for every transition, not just Skip/Start, per that section's own closing statement), Sections 26–27 (Waiting/Service Time formulas, Dashboard Metrics)

## Task List

| Task | Name |
|---|---|
| task-037 | Create Queue |
| task-038 | Queue List |
| task-039 | Queue Detail |
| task-040 | Call Queue |
| task-041 | Recall Queue |
| task-042 | Skip Queue |
| task-043 | Start Service |
| task-044 | Complete Queue |
| task-045 | Cancel Queue |
| task-046 | Transfer Queue |
| task-047 | Queue Dashboard |

## Implementation Plan

Full Queue state machine (Waiting → Called → In Service → Completed, plus Skip/Cancel/Transfer/No-Show side paths) driven by a single shared `queueTransitions.ts` table so every use case validates against the same authoritative diagram rather than re-deriving rules per endpoint. Subscribes to Reservation's `PatientCheckedIn` event to auto-create Queue entries (completing task-035's cross-epic dependency). Dashboard aggregates status counts, per-doctor counts, and average waiting/service time.

## Files Created

`apps/backend/src/modules/queue/`: `application/{dtos,mappers,services,use-cases}/*`, `domain/{events,exceptions,repositories}/*`, `infrastructure/repositories/*`, `presentation/{controllers,routes}/*`.

## Files Modified

`apps/backend/src/app.ts` (mounted `buildQueueModule`, passed the shared `eventBus`).

## Database Changes

None beyond Epic J's initial migration (`Queue`, `QueueHistory`, `QueueCall` already scaffolded there).

## API Changes

| Endpoint | Permission |
|---|---|
| `GET /queues` | `queue.read` |
| `POST /queues` | `queue.create` |
| `GET /queues/:id` | `queue.read` |
| `PATCH /queues/:id/call` | `queue.call` |
| `PATCH /queues/:id/recall` | `queue.recall` |
| `PATCH /queues/:id/skip` | `queue.skip` |
| `PATCH /queues/:id/start` | `queue.start` |
| `PATCH /queues/:id/complete` | `queue.complete` |
| `PATCH /queues/:id/cancel` | `queue.cancel` |
| `PATCH /queues/:id/transfer` | `queue.transfer` |
| `GET /queues/dashboard` | `queue.dashboard.read` |

## Frontend Changes

None. The Queue call/display board is arguably the single most visually distinctive Phase 1 screen and has no design spec at all — flagged, not built.

## Security Validation

- Every transition endpoint re-validates the current status server-side against `queueTransitions.ts` before mutating — the API is the actual authority, not client-side sequencing.
- `queue.dashboard.read` is a distinct permission from `queue.read`, since the dashboard exposes aggregate/cross-patient data.

## Architecture Validation

- `queueTransitions.ts` / `performQueueTransition.ts` centralize the state machine in `application/services/`, consumed by every transition use case (`CallQueueUseCase`, `SkipQueueUseCase`, `StartServiceUseCase`, `CompleteQueueUseCase`, `CancelQueueUseCase`) — one authoritative implementation, not seven independent copies.
- `eventBus.subscribe(PATIENT_CHECKED_IN_EVENT, ...)` registered inside `buildQueueModule()`, not inside Reservation's module — the subscriber owns its own subscription, consistent with the event-only cross-module contract. Verified by `tests/integration/checkInToQueue.test.ts`.
