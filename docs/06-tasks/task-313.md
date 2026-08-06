# task-313: Patient MRN/Name on Queue List &amp; Detail

**Phase:** Queue Module Addendum #1 (post-roadmap)
**Epic:** QA. Queue Module Enhancement
**Feature:** QA3. Patient MRN/Name on Queue
**Module:** Queue
**Priority:** P1 - High

---

## Business Goal

Let staff identify which patient a Queue ticket belongs to directly from the board/list, without opening EMR or cross-referencing the Patient module. `QueueResponseDto` today only carries `patientId`; `QueueCard.tsx` already client-joins Doctor name via `useDoctors()` but has no equivalent for Patient. Mirrors the pattern already shipped for Reservation (`docs/06-tasks/task-295.md`).

## Depends On

- task-038 (Queue List), task-039 (Queue Detail)

## Required Documents

- **SAD:** `docs/03-sad/14-module-queue.md` §29.1.3
- **Business Rules:** `docs/01-prd/business-rules.md` "Queue Module Addendum #1"
- **Precedent:** `docs/06-tasks/task-295.md` (Reservation's identical addendum)

## Required Existing Code

`ReservationRepository.search()`'s Patient `include`/`ReservationResponseDto`/`ReservationMapper` (`apps/backend/src/modules/reservation/...`) as the exact pattern to mirror. `QueueRepository.ts`, `QueueResponseDto.ts`, `QueueMapper.ts`, `IQueueRepository.ts`.

## Backend Scope

- `IQueueRepository.ts`: new type `QueueWithOptionalPatient = Queue & { patient?: Pick<Patient, 'medicalRecordNo' | 'patientName'> }`; `search()` and `findById()` return this type. `patient` is optional so every other call site (create/call/recall/skip/start/complete/cancel/transfer) still satisfies the type unmodified.
- `QueueRepository.ts`: `search()`'s `findMany` and `findById()`'s `findFirst` both add `include: { patient: { select: { medicalRecordNo: true, patientName: true } } }`.
- `QueueResponseDto.ts`: gains `patientMrn: string | null` and `patientFullName: string | null`.
- `QueueMapper.ts`: `toQueueResponse` parameter type becomes `QueueWithOptionalPatient`; populates the two new fields from the joined relation, `null` when absent.
- Doctor name stays a client-side join (unchanged) — out of scope here, per this addendum's explicit decision to keep scope tight.

## Frontend Scope

- `queue.types.ts`: `QueueEntry` gains `patientMrn`/`patientFullName`.
- `QueueCard.tsx`: renders Patient Name + NRM on every card.

## Database Impact

None — a query-shape change only, no migration.

## API Impact

`GET /queues`, `GET /queues/:id` responses gain `patientMrn`/`patientFullName` on each item.

## Workflow Impact

None — read-only presentation change.

## Security Impact

None — exposed on the same response objects already gated by `queue.read`.

## Testing Required

- Unit: `toQueueResponse` populates `patientMrn`/`patientFullName` when the row carries a joined patient snapshot, `null` when it doesn't.
- Frontend component test: Queue card renders the patient's name and MRN when present.

## Deliverables

`QueueWithOptionalPatient` type + repository joins + DTO/mapper changes, frontend card rendering, tests.

## Acceptance Criteria

- A Queue entry whose patient still exists shows that patient's current name and MRN on the board/list and in Detail.
- Mutation endpoints (call/recall/skip/start/complete/cancel/transfer) are unaffected — they don't need to return the snapshot.

## Definition of Done

Queue board/list and Detail render Patient Name/MRN from real `GET /queues`/`GET /queues/:id` data, tests passing, no schema change.

---

## Dependency Detail

- **Blocked By:** task-038, task-039
- **Required Before:** task-314 (Detail view displays these fields)
- **Can Run In Parallel With:** task-311, task-312
