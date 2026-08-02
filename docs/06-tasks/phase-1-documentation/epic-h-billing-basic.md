# Epic H: Billing Basic — Documentation (task-054–058)

> Retroactive documentation, per the template in `epic-j-foundational-infrastructure.md`'s header note.

---

## Documentation Reviewed

- `docs/06-tasks/task-054.md`–`task-058.md`
- `docs/03-sad/16-module-billing.md` Sections 6 (API), 7 (Invoice endpoints/schema), 9 (State Machine), 10 (Business Rules), 11 (Domain Validation Rules), 12 (Billing Status)
- `docs/01-prd/business-rules.md` Section 5

## Task List

| Task | Name |
|---|---|
| task-054 | Generate Invoice from Completed Visit |
| task-055 | Invoice List |
| task-056 | Invoice Detail |
| task-057 | Create Payment |
| task-058 | Close Invoice |

## Implementation Plan

Invoice auto-generates from `EMRFinished`, one line item per Visit Treatment using its price snapshot; exactly one Invoice per Visit, enforced by conflict check. Payment supports multi-line/split payment against a single Invoice, validated against outstanding balance and active Payment Method; Invoice status progresses `UNPAID → PARTIALLY_PAID → PAID → CLOSED`. Close is only reachable from `PAID` and is terminal (immutable thereafter). Corrected Epic J's originally-scaffolded two-field status model (`status` + `paymentStatus`) into this single enum once the actual task docs were read — see Database Changes.

## Files Created

`apps/backend/src/modules/billing/`: `application/{dtos,mappers,services,use-cases}/*`, `domain/{events,exceptions,repositories}/*`, `infrastructure/repositories/*`, `presentation/{controllers,routes}/*`.

## Files Modified

- `apps/backend/prisma/schema.prisma` — see Database Changes.
- `apps/backend/src/app.ts` (mounted `buildBillingModule`, passed the shared `eventBus`).

## Database Changes

- Replaced the `DRAFT/ISSUED/CANCELLED/CLOSED` enum + separate `paymentStatus` field (Epic J's pre-task-doc scaffold) with a single `InvoiceStatus` enum: `UNPAID | PARTIALLY_PAID | PAID | CLOSED`, matching task-054/057/058's literal language.
- Added `Invoice.paidAmount` (running total, outstanding computed as `grandTotal - paidAmount`).
- Added `InvoiceItem` model (line items — `referenceType`, `referenceId`, `itemName`, `quantity`, `unitPrice`, `discount`, `tax`, `total`) per `billing_invoice_items` in the SAD.

## API Changes

| Endpoint | Permission |
|---|---|
| `GET /billing/invoices` | `billing.invoice.read` |
| `POST /billing/invoices` | `billing.invoice.create` |
| `GET /billing/invoices/:id` | `billing.invoice.read` |
| `POST /billing/invoices/:id/close` | `billing.invoice.close` |
| `POST /billing/payments` | `billing.payment.create` |

## Frontend Changes

None. Cashier billing queue, invoice detail, and payment form are not built.

## Security Validation

- `PaymentExceedsOutstandingException` hard-blocks overpayment server-side.
- `InvoiceAlreadyClosedException` blocks any further payment/mutation once Closed.
- `PaymentMethodNotActiveException` blocks payment against a deactivated Payment Method (task-026 dependency).
- Financial mutations (`GenerateInvoiceUseCase`, `CreatePaymentUseCase`, `CloseInvoiceUseCase`) are all audit-logged, flagged in the task docs as high-sensitivity.

## Architecture Validation

- `EMRFinished` subscription registered inside `buildBillingModule()`, wrapped in try/catch — unlike Queue's subscription to `PatientCheckedIn`, a Billing-side failure here must never propagate back through the shared event bus and fail the Visit-closing transaction that triggered it (Billing is strictly downstream of EMR).
- `GenerateInvoiceUseCase` reads EMR's `IVisitRepository`/`IVisitTreatmentRepository` and Master Data's `ITreatmentRepository` directly — consistent with the established cross-module read-repository-reuse pattern (Epic F did the same with Patient/Doctor repositories), not a raw database access violation.
- Publishes `PaymentCompleted` even though no Phase 1 module consumes it yet, honoring the event contract for Phase 3's Finance module per task-057's explicit forward-compatibility requirement.
