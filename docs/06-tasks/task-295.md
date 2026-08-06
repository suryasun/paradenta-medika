# task-295: Patient MRN/Name on Reservation List

**Phase:** Reservation Module Addendum #2 (post-roadmap)
**Epic:** RE. Reservation Module Enhancement
**Feature:** RE6. Patient MRN/Name on Reservation List
**Module:** Reservation
**Priority:** P1 - High

---

## Business Goal

Let staff identify which patient a reservation belongs to directly from the Reservation List and History screens, without opening each row or cross-referencing the Patient module separately. Closes a documented gap: `docs/03-sad/13-module-reservation.md` §33.3 already specs Patient Name and Medical Record Number as List columns, and `ReservationListView.tsx`'s own long-standing comment flags this exact gap — `ReservationResponseDto` has only ever carried `patientId`.

## Depends On

- task-031 (Reservation List & Search)
- task-294 (Reservation History)

## Required Documents

- **AI Contract:** `docs/04-ai-contract/06-database-contract.md` DB-010 (denormalization/derived-field justification — the join here is per-query, not a stored derived column, so DB-010 doesn't strictly apply, but the "don't duplicate cross-module entities beyond what's needed" principle in `ReservationMapper.ts`'s own comment does)
- **PRD:** `docs/01-prd/features/reservation.md` RSV-005/RSV-018
- **SAD:** `docs/03-sad/13-module-reservation.md` §40.2, §33.3
- **Design:** `docs/02-design/pages/reservation.md` §2.1 (existing gap note)

## Required Existing Code

`ReservationRepository.search()` (`apps/backend/src/modules/reservation/infrastructure/repositories/ReservationRepository.ts`), `ReservationMapper.ts`, `ReservationResponseDto.ts`. `ReservationListView.tsx`'s existing client-side Doctor-name join (`useDoctors()`) as the precedent this task explicitly does *not* follow for Patient (Patient is unbounded, unlike the small Doctor roster) — a server-side join is used instead.

## Backend Scope

- `ReservationRepository.search()` adds a Prisma `include: { patient: { select: { medicalRecordNo: true, patientName: true } } }` to its `findMany` call — a lightweight snapshot, not a full Patient embed.
- New type `ReservationWithOptionalPatient = Reservation & { patient?: Pick<Patient, 'medicalRecordNo' | 'patientName'> }` in `IReservationRepository.ts`, used as `search()`'s return type and `toReservationResponse`'s parameter type. `patient` is optional so every other call site (create/update/cancel/checkIn/findById) still satisfies the type unmodified.
- `ReservationResponseDto` gains `patientMrn: string | null` and `patientFullName: string | null`, populated from the joined relation when present, `null` otherwise.
- No changes to `findById`, `create`, `update`, `cancel`, `checkIn`, or `findAllInDateRange` — this task is scoped to the List/History read path only.

## Frontend Scope

- `Reservation` type gains `patientMrn`/`patientFullName`.
- `ReservationListView.tsx` adds a Patient column (name + MRN) between Reservation No. and Date.
- `ReservationHistoryPage.tsx`'s card shows the patient name/MRN as its primary line, with the reservation number moved to the secondary detail line.

## Database Impact

None — no schema/migration change, a query-shape change only.

## API Impact

`GET /reservations` response shape gains `patientMrn`/`patientFullName` on each item. No new query params, no new endpoint.

## Workflow Impact

None — read-only presentation change.

## Security Impact

None — exposed on the same response objects already gated by `reservation.read`; no new permission code.

## Testing Required

- Unit test: `toReservationResponse` populates `patientMrn`/`patientFullName` when the row carries a joined patient snapshot, and returns `null` for both when it doesn't.
- Frontend component test: Reservation List renders the patient's name and MRN when present.
- Frontend component test: Reservation History card renders the patient's name and MRN when present.

## Deliverables

- `ReservationWithOptionalPatient` type + `search()` join + `ReservationResponseDto`/`ReservationMapper` changes.
- Frontend column/card changes on both screens.
- Tests.

## Acceptance Criteria

- A reservation whose patient still exists shows that patient's current name and MRN on both the List and History screens.
- A response from any non-`search()` code path (create/update/cancel/checkIn/detail) is unaffected — `patientMrn`/`patientFullName` are simply `null`, not an error.

## Definition of Done

Reservation List and History both render Patient Name/MRN from real `GET /reservations` data, tests passing, no schema change.

---

## Dependency Detail

- **Blocked By:** task-031, task-294
- **Required Before:** task-299 (Completed Reservations Report table reuses this join)
- **Can Run In Parallel With:** task-296, task-297, task-298
