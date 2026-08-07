# task-320: Sync Treatment Recorded After Invoice Generation

**Phase:** Queue Module Addendum #1 (post-roadmap) — bug fix
**Epic:** QA. Queue Module Enhancement
**Feature:** QA10. Invoice Stays in Sync with Post-Close Treatment
**Module:** Billing (cross-module with EMR)
**Priority:** P1 - High (data-correctness bug)

---

## Business Goal

Fix a reported bug: after Close Visit, a Treatment recorded on the same Visit (now reachable/editable via Queue's "View Visit" link, task-319, per task-316/task-317's relaxed EMR write-gate) was recorded successfully in EMR but never appeared on the Invoice. Root cause: `GenerateInvoiceUseCase` only ever snapshots `VisitTreatment` rows once, at the moment `CloseVisitUseCase` publishes `EMRFinished` — there was no mechanism anywhere to keep an already-generated Invoice in sync with Treatment entries added afterward. This is precisely the "Tambah Item" half of `docs/03-sad/16-module-billing.md`'s already-documented but never-built UC-BIL-004 "Update Invoice", and the already-cataloged-but-unimplemented `TreatmentSaved | EMR | Billing` event in `docs/03-sad/02-system-architecture.md` §24.1.

## Depends On

- task-054 (Generate Invoice), task-053 (Record Treatment), task-316, task-317, task-319

## Required Documents

- **SAD:** `docs/03-sad/02-system-architecture.md` §24.1 (Event Catalog — `TreatmentSaved` row), `docs/03-sad/16-module-billing.md` UC-BIL-004
- **Business Rules:** `docs/01-prd/business-rules.md` §5 Billing (Invoice)

## Required Existing Code

`GenerateInvoiceUseCase.ts` (the one-time snapshot logic this task doesn't change, only supplements), `CloseVisitUseCase.ts`'s `EMRFinished` publish + `billing.routes.ts`'s subscriber (the exact pattern this task's new subscriber mirrors), `RecordTreatmentUseCase.ts`, `assertTreatmentEditable.ts` (task-317 — already guarantees a Treatment can't be recorded once the Invoice is PAID, so this task's handler only needs a defensive re-check, not new enforcement).

## Backend Scope

- `apps/backend/src/modules/emr/domain/events/EmrEvents.ts`: new `TREATMENT_RECORDED_EVENT = 'emr.treatment-recorded.v1'` + `TreatmentRecordedPayload`.
- `apps/backend/src/modules/emr/application/use-cases/RecordTreatmentUseCase.ts`: publishes the new event after every successful Treatment entry creation (not only post-Invoice ones — the handler itself decides whether action is needed).
- `apps/backend/src/modules/billing/domain/repositories/IInvoiceRepository.ts` / `InvoiceRepository.ts`: new `updateTotals(id, { subtotal, grandTotal, updatedBy })`.
- New `apps/backend/src/modules/billing/application/use-cases/SyncTreatmentToInvoiceUseCase.ts`: no-ops when no Invoice exists yet for the visit (normal case, `GenerateInvoiceUseCase` will pick the row up at Close); no-ops when the Invoice is already PAID/CLOSED (defensive race guard); otherwise appends a matching `InvoiceItem` and recalculates `subtotal`/`grandTotal`.
- `apps/backend/src/modules/billing/presentation/routes/billing.routes.ts`: subscribes to `TREATMENT_RECORDED_EVENT`, same try/catch-log discipline as the existing `EMRFinished` subscriber.

## Frontend Scope

None — `InvoiceDetailView.tsx` already renders `invoice.items` from `GET /billing/invoices/:id`; once the backend keeps that data correct, the existing UI is correct on next fetch.

## Database Impact

None — no schema change, `InvoiceItem`/`Invoice` rows are just written to more than once now.

## API Impact

None — no new endpoints; existing `POST /emr/visits/:id/treatments` and `GET /billing/invoices/:id` behavior changes (the latter now reflects post-Close Treatment additions).

## Workflow Impact

Closes the gap between EMR's Treatment-editability rule (task-316/317) and Billing's Invoice-generation rule (task-054) — the two were never reconciled when the EMR-side gate was relaxed.

## Security Impact

None — same permissions already enforce who can record Treatment / read Invoices; this only fixes what data ends up on the Invoice.

## Testing Required

- Unit: `SyncTreatmentToInvoiceUseCase` — no-op (no Invoice), no-op (PAID), no-op (CLOSED), appends+recalculates (UNPAID), appends+recalculates (PARTIALLY_PAID).
- Unit: `RecordTreatmentUseCase` — publishes `emr.treatment-recorded.v1` with correct payload after a successful create.
- Integration: Close Visit (Invoice generated) → record a new Treatment on the same visit → `GET`-equivalent on the Invoice shows the new item and updated `grandTotal` (exact bug reproduction).

## Deliverables

`EmrEvents.ts`/`RecordTreatmentUseCase.ts`/`IInvoiceRepository.ts`/`InvoiceRepository.ts`/`SyncTreatmentToInvoiceUseCase.ts`/`billing.routes.ts` changes, SAD/business-rules updates, tests.

## Acceptance Criteria

- A Treatment recorded after Close Visit, while the Invoice is UNPAID or PARTIALLY_PAID, appears on that Invoice with correct `subtotal`/`grandTotal`.
- A Treatment recorded while the Invoice is PAID or CLOSED is already blocked at the EMR layer (task-317); this task's handler defensively no-ops rather than corrupting the Invoice if that race is ever hit.
- A Treatment recorded before Close Visit is unaffected — still picked up normally by `GenerateInvoiceUseCase` at Close time.

## Definition of Done

The reported bug no longer reproduces; tests passing; SAD/business-rules reflect the fix and flag the remaining unimplemented UC-BIL-004 items (Remove Item/Edit Qty/Edit Notes) as still-open gaps.

---

## Dependency Detail

- **Blocked By:** task-054, task-053, task-316, task-317
- **Required Before:** none
- **Can Run In Parallel With:** none
