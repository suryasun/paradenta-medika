# task-317: Treatment Lock on Invoice PAID

**Phase:** Queue Module Addendum #1 (post-roadmap)
**Epic:** QA. Queue Module Enhancement
**Feature:** QA7. Treatment Payment Lock
**Module:** EMR
**Priority:** P1 - High

---

## Business Goal

Once a Visit's Invoice is fully paid, its Treatment entries must stop being editable — treatment that has already been billed and paid should not silently change afterward. No such lock exists today (the only existing lock is Visit-status-driven, per task-316, and is independent of Billing entirely). This introduces a new, narrower rule: Treatment specifically locks on `Invoice.status === 'PAID'`, regardless of the Visit's own status.

## Depends On

- task-316 (relaxes the Visit-status gate that Treatment shares with other sections; this task adds the payment-specific gate on top)
- task-059 (Billing Basic — `Invoice`/`InvoiceStatus` model)

## Required Documents

- **AI Contract:** `docs/04-ai-contract/07-module-contract.md` MOD-056 (EMR consumes authorised Billing integration), MOD-059 (EMR must not mutate Billing state — read-only here), MOD-117 (finalized-record correction rules — not triggered by a read)
- **SAD:** `docs/03-sad/15-module-emr.md` §12.1 (this addendum)
- **Business Rules:** `docs/01-prd/business-rules.md` "Queue Module Addendum #1"

## Required Existing Code

`RecordTreatmentUseCase.ts` already injects a sibling module's repository directly (Warehouse's `IItemRepository`) as a constructor collaborator — this is the exact precedent reused here for Billing's `IInvoiceRepository`. `apps/backend/src/modules/billing/domain/repositories/IInvoiceRepository.ts` (`findByVisitId` already exists, read-only, public interface).

## Backend Scope

- New `apps/backend/src/modules/emr/application/services/assertTreatmentEditable.ts`: `assertTreatmentEditable(visitId, invoiceRepository: IInvoiceRepository): Promise<void>` — calls `invoiceRepository.findByVisitId(visitId)`, throws if `invoice?.status === 'PAID'`.
- New `TreatmentLockedException` in `apps/backend/src/modules/emr/domain/exceptions/EmrExceptions.ts`, following the file's existing exception-class conventions (409/422).
- `RecordTreatmentUseCase.ts`: add `IInvoiceRepository` as a new constructor parameter; call `assertTreatmentEditable(input.visitId, this.invoiceRepository)` immediately after the existing `assertVisitOpen(visit)` call.
- `apps/backend/src/modules/emr/presentation/routes/emr.routes.ts`: import and instantiate `InvoiceRepository` from Billing's infrastructure layer, wire into `RecordTreatmentUseCase`'s constructor call (import-order safe regardless of `app.ts` module-builder sequencing — same as the existing Warehouse `ItemRepository` import).
- No other Treatment-mutating use case exists (`IVisitTreatmentRepository` exposes only `create`) — `RecordTreatmentUseCase` is the sole call site needing this gate.

## Frontend Scope

None in this task — surfacing the lock state in the UI (`isTreatmentLocked`) is task-318.

## Database Impact

None — reuses existing `Invoice.status`/`Invoice.visitId`.

## API Impact

`POST` (Treatment recording endpoint) now returns an error when the linked Invoice is `PAID`. No new endpoints.

## Workflow Impact

Adds a new precondition to Treatment recording independent of the Visit status machine; does not alter Billing's own Invoice lifecycle.

## Security Impact

None new — same `emr.treatment.write`-style permission continues to gate the endpoint; this adds a business-rule precondition on top.

## Testing Required

- Unit: `assertTreatmentEditable` — throws `TreatmentLockedException` when invoice status is `PAID`; passes when no invoice exists or status is not `PAID`.
- Unit: `RecordTreatmentUseCase` — rejects when the linked invoice is `PAID`; succeeds on a COMPLETED visit whose invoice is unpaid or doesn't yet exist (covers the task-316 + task-317 interplay together).

## Deliverables

`assertTreatmentEditable.ts`, `TreatmentLockedException`, `RecordTreatmentUseCase.ts`/`emr.routes.ts` wiring, tests.

## Acceptance Criteria

- Recording/editing Treatment on a Visit whose Invoice is `PAID` is rejected.
- Recording Treatment on a Visit whose Invoice is unpaid, partially paid, or doesn't exist yet still succeeds (including on COMPLETED visits, per task-316).
- No change to Billing's own Invoice state or lifecycle.

## Definition of Done

Treatment lock enforced on Invoice PAID, tests passing.

---

## Dependency Detail

- **Blocked By:** task-316, task-059
- **Required Before:** task-318 (frontend needs `isTreatmentLocked` exposed, sourced from this same check)
- **Can Run In Parallel With:** none (sequenced after task-316 to avoid conflicting edits to `RecordTreatmentUseCase.ts`)
