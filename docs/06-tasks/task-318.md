# task-318: EMR Frontend Editability Wiring + Addendum Test Closure

**Phase:** Queue Module Addendum #1 (post-roadmap)
**Epic:** QA. Queue Module Enhancement
**Feature:** QA8. Visit Workspace Editability UI
**Module:** EMR
**Priority:** P1 - High

---

## Business Goal

Surface task-316 and task-317's relaxed/tightened edit gates in the Visit Workspace UI: every section except Treatment becomes editable again once a Visit is COMPLETED, while Treatment independently locks the moment its Invoice is PAID — with a visible reason shown to the user rather than controls silently disabling. Also closes out the cross-cutting test debt for the whole addendum (task-311–317).

## Depends On

- task-316 (backend COMPLETED-editability gate)
- task-317 (backend Treatment payment lock)

## Required Documents

- **SAD:** `docs/03-sad/15-module-emr.md` §12.1
- **Business Rules:** `docs/01-prd/business-rules.md` "Queue Module Addendum #1"

## Required Existing Code

`apps/frontend/features/emr/components/VisitWorkspace.tsx` (`readOnly`/`OPEN_VISIT_STATUSES` computation), `apps/frontend/features/emr/components/TreatmentSection.tsx`, `apps/backend/src/modules/emr/application/use-cases/GetVisitDetailUseCase.ts`, `apps/backend/src/modules/emr/application/mappers/VisitMapper.ts`, `apps/backend/src/modules/emr/application/dtos/VisitResponseDto.ts`.

## Backend Scope

- `VisitResponseDto.ts` (detail variant): gains `isTreatmentLocked: boolean`.
- `GetVisitDetailUseCase.ts`: add `IInvoiceRepository` as a new constructor parameter (same shared instance wired for task-317's `RecordTreatmentUseCase`); fetch `invoiceRepository.findByVisitId(visitId)` alongside its existing data fan-out, compute `isTreatmentLocked = invoice?.status === 'PAID'`.
- `VisitMapper.ts`: `toVisitDetailResponse` gains an `isTreatmentLocked` parameter, sets it on the returned DTO.
- `emr.routes.ts`: wire the shared `InvoiceRepository` instance into `GetVisitDetailUseCase`'s constructor call.

## Frontend Scope

- `emr.types.ts`: `VisitDetail` type gains `isTreatmentLocked: boolean`.
- `VisitWorkspace.tsx`: `readOnly` computation changes from `!OPEN_VISIT_STATUSES.includes(visit.status)` to `["LOCKED", "ARCHIVED"].includes(visit.status)` — every section becomes editable on COMPLETED by default. `TreatmentSection` receives an independent `treatmentReadOnly = readOnly || visit.isTreatmentLocked` prop instead of the shared `readOnly`; every other section keeps the plain `readOnly`.
- `TreatmentSection.tsx`: add a visible "Locked — invoice paid" indicator when `isTreatmentLocked && !readOnly` (i.e. the Visit itself is still open but Treatment specifically is locked), so controls don't silently disable without explanation.

## Database Impact

None.

## API Impact

`GET /visits/:id` (Visit detail) response gains `isTreatmentLocked`.

## Workflow Impact

None — presentation of already-enforced backend rules (task-316/317).

## Security Impact

None — read-only field addition; write enforcement already lives server-side in task-316/317.

## Testing Required

- Unit: `GetVisitDetailUseCase`/`toVisitDetailResponse` — `isTreatmentLocked` true when invoice is PAID, false otherwise.
- Frontend component test: `VisitWorkspace` on a COMPLETED visit renders SOAP/Vital Sign sections as editable.
- Frontend component test: `TreatmentSection` renders locked (with the "invoice paid" indicator) when `isTreatmentLocked` is true, editable otherwise, independent of the Visit's own `readOnly` state.
- **Cross-cutting closure for the full addendum** — verify/update: `QueueTransitions.test.ts`, `RecallQueueUseCase.test.ts`, `TransferQueueUseCase.test.ts`, `CreateQueueUseCase.test.ts`, `QueueDashboardUseCase.test.ts`, `apps/backend/tests/fakes/queueFakes.ts`, `RecordTreatmentUseCase.test.ts` (new `IInvoiceRepository` constructor param — add/reuse a fake), and any integration test asserting on unscoped `/queues` list contents (needs a `UserBranch` fixture per task-311).

## Deliverables

`VisitResponseDto`/`GetVisitDetailUseCase`/`VisitMapper` changes, `VisitWorkspace.tsx`/`TreatmentSection.tsx` changes, full addendum test suite green.

## Acceptance Criteria

- On a COMPLETED visit with an unpaid invoice, SOAP/Vital Sign/etc. are editable and Treatment is also editable.
- On a COMPLETED visit with a PAID invoice, SOAP/Vital Sign/etc. remain editable but Treatment is locked with a visible reason.
- On a LOCKED/ARCHIVED visit, everything remains read-only regardless of invoice status.
- All existing and new tests across task-311–318 pass.

## Definition of Done

Frontend reflects the backend editability rules exactly, full addendum test suite green, docs (business-rules.md, SAD Queue/EMR) up to date.

---

## Dependency Detail

- **Blocked By:** task-316, task-317
- **Required Before:** none (final task of the addendum)
- **Can Run In Parallel With:** none
