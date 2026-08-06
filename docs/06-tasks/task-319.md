# task-319: View Visit Link on Queue Detail/Card

**Phase:** Queue Module Addendum #1 (post-roadmap)
**Epic:** QA. Queue Module Enhancement
**Feature:** QA9. View Existing Visit from Queue
**Module:** Queue
**Priority:** P1 - High

---

## Business Goal

task-316 made a COMPLETED Visit's SOAP/Vital Sign/etc. editable again, but nothing in the Queue UI could actually navigate to that Visit: "Open Visit" (task-048) only *creates* a Visit and is gated to `CALLED`. Once a queue entry reaches COMPLETED (or any later status), staff had no way to reach the Visit they were meant to be able to edit — a gap discovered post-implementation, not covered by task-311–318. This task closes it: the Queue response now surfaces the linked Visit's id (if any exists), and the Queue Detail/Card UI gains a status-independent "View Visit" link.

## Depends On

- task-314 (Queue Detail view), task-316 (COMPLETED editability), task-048 (Open Visit)

## Required Documents

- **Business Rules:** `docs/01-prd/business-rules.md` "Queue Module Addendum #1"

## Required Existing Code

`Queue.visit` Prisma relation (already exists, unique on `queueId`), `IVisitRepository.findByQueueId` (existing, unused here — the join happens via the same Prisma `include` pattern already used for the `patient` snapshot per task-313, not a separate repository call).

## Backend Scope

- `IQueueRepository.ts`: `QueueWithOptionalPatient` gains `visit?: { id: string } | null`.
- `QueueRepository.ts`: `search()`/`findById()` add `visit: { select: { id: true } }` to the existing `include`.
- `QueueResponseDto.ts`/`QueueMapper.ts`: gain `visitId: string | null`, populated from `queue.visit?.id ?? null`.

## Frontend Scope

- `queue.types.ts`: `QueueEntry` gains `visitId: string | null`.
- `QueueDetailModal.tsx`/`QueueCard.tsx`: a "View Visit" link (`emr.visit.read`-gated) appears whenever `visitId` is present, regardless of Queue status, navigating to `/emr/visits/:visitId`. The existing CALLED-only "Open Visit" (create) button is additionally hidden once `visitId` already exists, to prevent attempting to create a second Visit for the same Queue (which the backend already rejects via `QueueAlreadyHasVisitException`, but shouldn't be offered as a dead-end action).

## Database Impact

None — a query-shape change only (existing `visit` relation).

## API Impact

`GET /queues`, `GET /queues/:id` responses gain `visitId`.

## Workflow Impact

None — navigation-only; no new state transitions.

## Security Impact

None — gated by the existing `emr.visit.read` permission already enforced on `GET /emr/visits/:id`.

## Testing Required

- Unit: `toQueueResponse` populates `visitId` when a Visit is joined, `null` otherwise.
- Frontend: "View Visit" renders when `visitId` is present and navigates correctly; "Open Visit" is hidden once `visitId` exists.

## Deliverables

Repository/DTO/mapper changes, frontend link, tests.

## Acceptance Criteria

- A COMPLETED (or any status) Queue entry with an existing Visit shows a "View Visit" link that opens that Visit for editing.
- A CALLED Queue entry with no Visit yet still shows "Open Visit" (create); once created, that queue's card/detail switches to "View Visit".

## Definition of Done

Completed (and any other) Queue entries with an existing Visit are reachable and editable from the Queue UI, tests passing.

---

## Dependency Detail

- **Blocked By:** task-314, task-316, task-048
- **Required Before:** none
- **Can Run In Parallel With:** none
