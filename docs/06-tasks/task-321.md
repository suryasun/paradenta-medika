# task-321: Edit/Remove Treatment Entries (Before Invoice PAID)

**Phase:** Queue Module Addendum #1 (post-roadmap)
**Epic:** QA. Queue Module Enhancement
**Feature:** QA11. Edit/Remove Treatment List
**Module:** EMR (cross-module with Billing)
**Priority:** P1 - High

---

## Business Goal

Let staff correct a Treatment entry recorded by mistake — Quantity, Tooth Reference, Unit Price, or Notes — or remove it entirely, at any point before the Visit's Invoice is fully paid, and keep the Invoice in sync automatically (the same "Tambah Item" sync task-320 already built for newly-added Treatment, now extended to Edit and Remove, completing the rest of `docs/03-sad/16-module-billing.md`'s UC-BIL-004 "Update Invoice"). Reuses task-317's exact `assertTreatmentEditable` gate — no new business rule for "when is Treatment locked," only new actions gated by the existing rule.

## Depends On

- task-053 (Record Treatment), task-317 (Treatment lock on Invoice PAID), task-320 (Invoice sync on Treatment add)

## Required Documents

- **SAD:** `docs/03-sad/16-module-billing.md` UC-BIL-004 ("Tambah Item" already implemented by task-320; this task implements "Hapus Item" and "Edit Qty" — "Edit Catatan" is covered incidentally since Notes is one of the editable fields)
- **Business Rules:** `docs/01-prd/business-rules.md` §5 Billing (Invoice)

## Required Existing Code

`assertTreatmentEditable.ts` (task-317, reused as-is for both Edit and Remove), `RecordTreatmentUseCase.ts` (the create-side sibling these two use cases mirror), `SyncTreatmentToInvoiceUseCase.ts` (task-320, the sync-on-add sibling `SyncTreatmentUpdateToInvoiceUseCase`/`SyncTreatmentRemovalToInvoiceUseCase` mirror).

## Backend Scope

**Schema** (migration `20260807013158_task321_treatment_edit_remove`, purely additive):
- `VisitTreatment`: `updatedAt`, `updatedBy`, `deletedAt`, `deletedBy` — Remove is a soft delete only, per the EMR-wide "operasi DELETE disarankan sebagai Soft Delete" policy.
- `InvoiceItem`: `visitTreatmentId` (nullable FK), `updatedAt`, `updatedBy` — precise correlation back to the originating `VisitTreatment` row. Previously `InvoiceItem.referenceId` only stored the catalog `treatmentId`, which is ambiguous when the same catalog Treatment is recorded more than once on a Visit (confirmed reachable in practice during task-320's manual verification).

**EMR:**
- `IVisitTreatmentRepository`: new `findById`, `update`, `softDelete`; existing `findByVisitId`/`findByVisitIdWithMaterials`/`findUnsettledDoctorFeeSources` now filter `deletedAt: null`.
- New `UpdateTreatmentUseCase.ts` / `RemoveTreatmentUseCase.ts`: both call `assertVisitOpen` + `assertTreatmentEditable`, then look up the entry (404 `VisitTreatmentNotFoundException` if it doesn't belong to the given visit), then update/soft-delete, publish a new event, audit-log.
- New events `emr.treatment-updated.v1` / `emr.treatment-removed.v1` (`EmrEvents.ts`), published by the two new use cases.
- New `PATCH`/`DELETE /emr/visits/:id/treatments/:treatmentEntryId`, permissions `emr.treatment.update`/`emr.treatment.delete` (added to the permission catalog and DOCTOR's role in `seed.ts`, re-seeded).

**Billing:**
- `IInvoiceItemRepository`: new `findByVisitTreatmentId`, `update`, `deleteById`.
- `GenerateInvoiceUseCase`/`SyncTreatmentToInvoiceUseCase` (task-320) now populate `visitTreatmentId` on every item they create, so later Edit/Remove can find it precisely.
- New `SyncTreatmentUpdateToInvoiceUseCase` / `SyncTreatmentRemovalToInvoiceUseCase`, subscribed in `billing.routes.ts` to the two new events — same no-op guards as task-320's add-sync (no Invoice yet; Invoice already PAID/CLOSED) plus a third: no matching `InvoiceItem` found by `visitTreatmentId` (an Invoice generated before this feature shipped has no FK to match against — no-op rather than guessing).

## Frontend Scope

- `emr.service.ts`/`emr.types.ts`: `updateTreatment`/`removeTreatment` API calls, `UpdateTreatmentInput` type.
- `useVisitMutations.ts`: `useUpdateTreatment`/`useRemoveTreatment` hooks.
- `TreatmentSection.tsx`: each row gets Edit (inline form: Tooth/Qty/Unit Price/Notes, Save/Cancel) and Remove (two-step inline confirm) actions, both hidden when `readOnly` (which already folds in the payment lock, same gating as "Add Treatment").

## Database Impact

Additive migration only (see Backend Scope) — no data loss, no destructive change.

## API Impact

New `PATCH`/`DELETE /emr/visits/:id/treatments/:treatmentEntryId`. `GET /billing/invoices/:id` response reflects Edit/Remove the same way it already reflects Add (task-320) — no shape change, just correct data.

## Workflow Impact

None to the Visit/Queue/Invoice state machines — purely extends what's editable within the already-existing "before Invoice PAID" window.

## Security Impact

Two new permission codes (`emr.treatment.update`, `emr.treatment.delete`), granted to DOCTOR (mirroring `emr.treatment.record`) and ADMINISTRATOR (automatic, catalog-wide).

## Testing Required

- Unit: `UpdateTreatmentUseCase` (recomputes subtotal, keeps unspecified fields unchanged, publishes event, rejects cross-visit access, rejects once PAID), `RemoveTreatmentUseCase` (soft-deletes not hard-deletes, excluded from `findByVisitId`, publishes event, rejects cross-visit access, rejects once PAID).
- Unit: `SyncTreatmentUpdateToInvoiceUseCase` / `SyncTreatmentRemovalToInvoiceUseCase` (no-op: no Invoice, PAID/CLOSED, no matching item; else updates/removes the item and recalculates totals).
- Frontend: Edit and Remove interactions in `VisitWorkspace.test.tsx`.

## Deliverables

Schema migration, `IVisitTreatmentRepository`/`VisitTreatmentRepository` changes, `UpdateTreatmentUseCase.ts`/`RemoveTreatmentUseCase.ts`, `IInvoiceItemRepository`/`InvoiceItemRepository` changes, `SyncTreatmentUpdateToInvoiceUseCase.ts`/`SyncTreatmentRemovalToInvoiceUseCase.ts`, route/controller/DTO wiring, seed.ts permission additions, frontend changes, tests.

## Acceptance Criteria

- Editing Quantity/Unit Price/Tooth Reference/Notes on an existing Treatment entry, before the Invoice is PAID, updates both the entry and the matching Invoice line item + totals.
- Removing a Treatment entry, before the Invoice is PAID, soft-deletes the entry (excluded from all reads) and deletes the matching Invoice line item, recalculating totals.
- Both actions are rejected once the Invoice is PAID or CLOSED (same gate as adding new Treatment).
- A removed entry's audit trail (`VisitTreatment` row + `Invoice` audit log) is preserved, not physically erased.

## Definition of Done

Edit/Remove shipped end-to-end (backend + frontend), tests passing, docs updated.

---

## Dependency Detail

- **Blocked By:** task-053, task-317, task-320
- **Required Before:** none
- **Can Run In Parallel With:** none
