# task-316: COMPLETED-Visit Editability for Non-Treatment EMR Sections

**Phase:** Queue Module Addendum #1 (post-roadmap)
**Epic:** QA. Queue Module Enhancement
**Feature:** QA6. Completed Visit Edit
**Module:** EMR
**Priority:** P1 - High

---

## Business Goal

Once a Queue reaches COMPLETED, its linked Visit's SOAP Note, Vital Sign, Diagnosis, and other non-Treatment clinical documentation should remain editable so staff can correct entry errors — today the system locks *all* Visit data (including these) the moment `Visit.status` becomes `COMPLETED`, requiring a full Administrator-authorized unlock even for a trivial vital-sign typo. Only `LOCKED`/`ARCHIVED` should remain hard-locked.

## Depends On

- task-052 (Close Visit — the transition into COMPLETED being relaxed here)

## Required Documents

- **AI Contract:** `docs/04-ai-contract/07-module-contract.md` MOD-050/052 (EMR ownership of Visit/SOAP/Vital Signs)
- **SAD:** `docs/03-sad/15-module-emr.md` §12.1 (this addendum), §11 EMR Lifecycle
- **Business Rules:** `docs/01-prd/business-rules.md` "Queue Module Addendum #1"

## Required Existing Code

`apps/backend/src/modules/emr/application/services/assertVisitOpen.ts` (the single shared gate all clinical-documentation use-cases delegate to), `apps/backend/src/modules/emr/application/use-cases/CloseVisitUseCase.ts` (its separate, untouched "can't re-close an already-closed visit" inline check).

## Backend Scope

- `assertVisitOpen.ts`: `CLOSED_STATUSES` changes from `['COMPLETED', 'LOCKED', 'ARCHIVED']` to `['LOCKED', 'ARCHIVED']`. Every use-case that already delegates to this shared function (SOAP, Vital Sign, Diagnosis, Consent, Referral, Follow-up, Prescription, Treatment Plan, Periodontal, Tooth Condition, Attachment, Medical Certificate) automatically becomes writable on COMPLETED visits with zero per-file changes.
- `RecordTreatmentUseCase.ts` also delegates to `assertVisitOpen` and would become writable on COMPLETED by this change alone — task-317 layers the additional payment-based lock on top so Treatment specifically stays governed by Invoice status rather than Visit status.
- `CloseVisitUseCase.ts`'s own inline "visit already closed" guard for the close-transition itself is explicitly **not** modified — that is a different rule (idempotency of the close action) unaffected by this task.

## Frontend Scope

None in this task — `VisitWorkspace.tsx`'s `readOnly` computation change is task-318 (depends on this task's backend change already being in place).

## Database Impact

None — no schema/enum change; `VisitStatus.COMPLETED` still exists and still means the same thing operationally, only the write-gate changes.

## API Impact

None — no new endpoints; existing write endpoints for SOAP/Vital Sign/etc. simply stop rejecting requests against a COMPLETED visit.

## Workflow Impact

Changes when clinical documentation write-endpoints reject requests, without changing the Visit status state machine itself.

## Security Impact

None — same permission checks (`emr.soap.write` etc.) still apply; only the visit-status precondition relaxes.

## Testing Required

- Unit: `assertVisitOpen` — COMPLETED no longer throws; LOCKED/ARCHIVED still throw.
- Unit (regression): `CloseVisitUseCase` — "already closed" rejection still functions on a second close attempt.
- Integration: `PUT`/`PATCH` on a SOAP Note or Vital Sign for a COMPLETED visit succeeds where it previously returned `VisitNotOpenException`.

## Deliverables

`assertVisitOpen.ts` change, tests.

## Acceptance Criteria

- SOAP Note, Vital Sign, Diagnosis, and other non-Treatment clinical documentation can be edited on a COMPLETED visit.
- LOCKED and ARCHIVED visits remain fully read-only, unchanged.
- Re-closing an already-COMPLETED/LOCKED/ARCHIVED visit still fails exactly as before.

## Definition of Done

COMPLETED visits editable for non-Treatment sections at the backend, tests passing.

---

## Dependency Detail

- **Blocked By:** task-052
- **Required Before:** task-317 (Treatment lock layers on top of this relaxed gate), task-318 (frontend wiring depends on this backend change)
- **Can Run In Parallel With:** none (sequenced before task-317 to avoid merge conflicts in `RecordTreatmentUseCase.ts`)
