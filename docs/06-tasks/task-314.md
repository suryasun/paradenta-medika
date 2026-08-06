# task-314: Queue Detail View with Consolidated Actions

**Phase:** Queue Module Addendum #1 (post-roadmap)
**Epic:** QA. Queue Module Enhancement
**Feature:** QA4. Queue Detail Action Panel
**Module:** Queue
**Priority:** P1 - High

---

## Business Goal

Give staff a single place to see a Queue entry's full detail and take any available action, instead of relying solely on the small set of inline buttons the board card can fit. No dedicated Detail screen/modal exists today (confirmed: `docs/02-design/pages/queue.md` §6 flags this as a real gap, and `GetQueueDetailUseCase`/`GET /queues/:id` already exists as a plain read endpoint with no UI consumer of its own).

## Depends On

- task-311, task-312 (Detail must reflect correctly-scoped data)
- task-313 (Detail displays Patient MRN/Name)
- task-040–046, task-048 (existing Call/Recall/Skip/Start/Complete/Cancel/Transfer/Open Visit actions being consolidated)

## Required Documents

- **SAD:** `docs/03-sad/14-module-queue.md` (state machine, §21 Business Rules), `docs/03-sad/15-module-emr.md` §15 (Open Visit precondition)
- **Business Rules:** `docs/01-prd/business-rules.md` "Queue Module Addendum #1"
- **Design:** `docs/02-design/pages/queue.md` §6 (documented gap this task closes)

## Required Existing Code

`apps/frontend/features/queue/components/QueueCard.tsx` (existing per-status inline action buttons and their gating logic — lifted, not reimplemented), `QueueReasonModal.tsx`, `TransferQueueModal.tsx`, `apps/frontend/features/queue/hooks/useQueueMutations.ts`, `apps/frontend/features/emr/hooks/useOpenVisit.ts`.

## Backend Scope

None — reuses the existing `GET /queues/:id` endpoint (task-039, now returning patient snapshot per task-313 and scoped per task-311/312) and all existing action endpoints unchanged.

## Frontend Scope

- New `useQueueDetail(id)` hook (`apps/frontend/features/queue/hooks/useQueueDetail.ts`) wrapping `queueService.detail(id)`.
- New `QueueDetailModal.tsx` (`apps/frontend/features/queue/components/`), consistent with sibling `QueueReasonModal.tsx`/`TransferQueueModal.tsx`. Displays NRM, Patient Name, queue number, status, type, priority, timestamps, doctor name (client-joined via existing `useDoctors()`), and all seven actions — Start, Call, Recall, Skip, Cancel, Transfer, Open Visit — each visible/enabled per the same status-gating rules `QueueCard.tsx` already applies, reusing the same mutation hooks and `QueueReasonModal`/`TransferQueueModal` sub-modals.
- `QueueCard.tsx`: add a "Detail" button (always visible regardless of status) opening `QueueDetailModal`. Existing inline per-status action buttons on the card are kept as-is (additive, not replaced) to avoid regressing current board UX.

## Database Impact

None.

## API Impact

None — no new endpoints; reuses `GET /queues/:id` and existing action endpoints.

## Workflow Impact

None — no new state transitions; Open Visit's existing precondition (Queue must be CALLED, per task-048) is unchanged and remains available before payment (non-regression, explicitly verified in Testing below).

## Security Impact

None — Detail view actions are gated by the same permissions (`queue.call`, `queue.recall`, etc., `emr.visit.create` for Open Visit) already enforced on each endpoint.

## Testing Required

- Frontend component test: `QueueDetailModal` renders NRM/Patient Name and all seven actions, with each action's visibility matching the entry's current status.
- Frontend component test: triggering an action from `QueueDetailModal` calls the same mutation hook `QueueCard.tsx` uses.
- Regression test: Open Visit action remains available/functional on a CALLED entry with no Invoice yet created (confirms non-regression of pre-payment access).

## Deliverables

`QueueDetailModal.tsx`, `useQueueDetail.ts`, `QueueCard.tsx` Detail button, tests.

## Acceptance Criteria

- Every Queue entry has a Detail action opening a view with NRM, Patient Name, and all seven action buttons appropriate to its current status.
- Open Visit is accessible from Detail before any payment/invoice exists on the visit, unchanged from today's behavior.
- Existing inline card actions continue to work exactly as before.

## Definition of Done

Queue Detail view shipped and wired to real endpoints/mutations, tests passing, no backend changes required.

---

## Dependency Detail

- **Blocked By:** task-311, task-312, task-313, task-040, task-041, task-042, task-043, task-044, task-045, task-046, task-048
- **Required Before:** none
- **Can Run In Parallel With:** task-315
