# task-323: Add Manual Charge to Invoice

**Epic:** Billing Module Completion, Stage 1 (`docs/06-tasks/epic-billing-completion.md`)
**Module:** Billing
**Priority:** P1 - High

---

## Business Goal

Implement UC-BIL-003 "Add Manual Charge" (`docs/03-sad/16-module-billing.md` L1654–1672): let Cashier add a line item to an Invoice for something that didn't come from an EMR Treatment — administration fee, medical certificate fee, photocopy, additional consultation, etc. Today the *only* way an `InvoiceItem` is ever created is via a Treatment (`GenerateInvoiceUseCase`/`SyncTreatmentToInvoiceUseCase`, both `referenceType: 'Treatment'`); `InvoiceItem.referenceType`'s comment already documents `ManualCharge` as one of five future reference types the SAD anticipates (`schema.prisma` ~L1876–1881) but no code path ever produces one.

## Depends On

- task-054 (Generate Invoice — an Invoice must already exist to add a charge to)

## Required Documents

- **SAD:** `docs/03-sad/16-module-billing.md` UC-BIL-003 (L1654–1672: "Business Rules: Harus memiliki alasan. Tercatat di Audit Trail.")
- **Business Rules:** `docs/01-prd/business-rules.md` §5

## Required Existing Code

`IInvoiceItemRepository`/`InvoiceItemRepository.ts` (`createMany`, already generic enough to accept a `ManualCharge` item — no repository change needed, only a new use-case that calls it with different data), `InvoiceRepository.updateTotals` (task-320/321 — reuse directly for recalculating `subtotal`/`grandTotal`).

## Backend Scope

- `InvoiceItem` model gains `reason: String? @db.Text` — mandatory for `ManualCharge` items specifically (validated in the use case, not a NOT NULL DB constraint, since `Treatment`-sourced items never set it).
- New `AddManualChargeUseCase.ts`: input `{ invoiceId, itemName, amount, reason, actorUserId }`. Guards: Invoice exists, not PAID/CLOSED/CANCELLED/VOID. Creates one `InvoiceItem` with `referenceType: 'ManualCharge'`, `referenceId: null`-equivalent (schema currently has `referenceId` as non-nullable `Char(36)` — this task needs to either make it nullable or generate a synthetic id; **recommend making `InvoiceItem.referenceId` nullable**, since a Manual Charge has no catalog entity to reference, and forcing a fake UUID would be misleading), `quantity: 1`, `unitPrice: amount`, `total: amount`, `reason`. Recalculates and persists `subtotal`/`grandTotal` via `updateTotals`. Audit-logs.
- New permission `billing.invoice.manual-charge.add`.
- New route `POST /billing/invoices/:id/items` (matches SAD's documented Invoice Item endpoint shape).

## Frontend Scope

- `InvoiceDetailView.tsx`: "Add Manual Charge" action (modal: item name, amount, reason — all required) when UNPAID/PARTIALLY_PAID and permitted; manual-charge rows render distinctly enough to be visually distinguishable from Treatment-sourced rows (e.g. a small "Manual" tag), reusing the existing items table rather than a separate table.

## Database Impact

Additive migration: `InvoiceItem.reason` (nullable), `InvoiceItem.referenceId` becomes nullable (existing rows unaffected — all currently non-null).

## API Impact

New `POST /billing/invoices/:id/items`. `GET /billing/invoices/:id` items already include whatever fields exist on `InvoiceItem`, so no response-shape change beyond the new `reason` field appearing (null for Treatment-sourced items).

## Workflow Impact

None to the Invoice status state machine — adds a line item the same way task-320's sync does, just from a direct Cashier action instead of an EMR event.

## Security Impact

New permission `billing.invoice.manual-charge.add`. Reason is mandatory and audit-logged, per the SAD's explicit rule for this use case.

## Testing Required

- Unit: `AddManualChargeUseCase` — creates the item with `referenceType: 'ManualCharge'`, recalculates totals; rejects missing `reason`; rejects once PAID/CLOSED/CANCELLED/VOID.
- Integration: add a manual charge alongside existing Treatment-sourced items, confirm both coexist correctly in `GET /billing/invoices/:id` and totals sum correctly.

## Deliverables

Migration, `AddManualChargeUseCase.ts`, route, frontend UI, tests.

## Acceptance Criteria

- A Manual Charge item can be added to an UNPAID/PARTIALLY_PAID Invoice with a mandatory reason, and `grandTotal` reflects it.
- Manual Charge items coexist correctly with Treatment-sourced items on the same Invoice.
- Cannot be added once the Invoice is PAID, CLOSED, CANCELLED, or VOID.

## Definition of Done

Manual Charge shipped end-to-end, tests passing, `business-rules.md` §5 updated.

---

## Dependency Detail

- **Blocked By:** task-054
- **Required Before:** none
- **Can Run In Parallel With:** task-322, task-324
