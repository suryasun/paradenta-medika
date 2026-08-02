# AI Contract 08 - Workflow Contract

This contract is extracted only from `22-workflow.md` and `23-sequence-diagram.md`. Every workflow MUST be deterministic: the AI Agent MUST use only transitions, events, guards, and ordering explicitly defined in those documents.

## Ownership and Determinism

**FLOW-001** Each business object MUST be mutated only by its owning module.

**FLOW-002** A command MUST request a change from the owning module.

**FLOW-003** An event MUST communicate a committed change and MUST NOT request an uncommitted source mutation.

**FLOW-004** Aggregate state, required audit, inbox/outbox, and related local state MUST commit atomically inside the owner module transaction.

**FLOW-005** Cross-module handoff MUST be event-driven and idempotent where the workflow defines a handoff.

**FLOW-006** Queries, reports, and jobs MUST NOT mutate source domain records.

**FLOW-007** Every workflow command MUST validate authentication, authorization, branch scope, lifecycle state, referential validity, and idempotency guards defined for that command.

**FLOW-008** A transition not explicitly listed in this contract or the owning module SAD MUST be rejected.

**FLOW-009** The AI Agent MUST NOT infer a missing transition, event order, retry count, rollback behavior, or compensation behavior.

**FLOW-010** The exact transition for a state mentioned by SAD without an explicit source and target MUST be treated as NOT DEFINED IN SAD.

## End-to-End Ordering

**FLOW-011** The primary patient journey MUST follow Reservation -> Check In -> Queue -> Doctor -> EMR -> Billing -> Payment -> Completed.

**FLOW-012** The clinical workflow MUST follow Open Visit -> Vital Sign -> SOAP -> Odontogram -> Diagnosis -> Treatment -> Prescription -> Save EMR -> Generate Invoice.

**FLOW-013** EMR MUST complete clinical state before Billing generates an invoice from the visit.

**FLOW-014** Billing MUST complete payment state before Finance posts the corresponding payment accounting event.

**FLOW-015** Finance MUST post the accounting event before Reporting consumes the posted financial projection.

**FLOW-016** Warehouse material consumption MUST be requested from finalized EMR treatment and MUST be posted by Warehouse, not by EMR.

**FLOW-017** Reporting MUST consume committed source events and MUST remain downstream/read-only.

## Event Contract and Ordering

**FLOW-018** Every cross-module event MUST contain `eventId`, `eventType`, `occurredAt`, `source`, `branchId` when relevant, `correlationId`, `schemaVersion`, and safe payload.

**FLOW-019** Every consumer MUST persist `eventId` or business reference for deduplication.

**FLOW-020** Event retry MUST produce the same business result and MUST NOT create duplicate records.

**FLOW-021** The owner MUST commit the source transaction and outbox event before the event is delivered to a consumer.

**FLOW-022** A consumer MUST validate event schema, version, source reference, branch, lifecycle state, and idempotency before mutation.

**FLOW-023** A consumer failure MUST NOT roll back a valid committed source transaction.

**FLOW-024** A transient consumer failure MUST use retry/backoff as defined by the runtime implementation.

**FLOW-025** A permanent consumer business/configuration failure MUST be recorded in a dead-letter or worklist with the source reference.

**FLOW-026** A dead-letter event MUST be replayed only after authorised correction and MUST preserve the original event identity/reference.

**FLOW-027** Retry count, backoff duration, dead-letter retention, and replay command MUST be treated as NOT DEFINED IN SAD.

**FLOW-028** The event delivery abstraction MUST support an in-process modular-monolith bus or worker/queue implementation without changing event contract, transaction boundary, or idempotency.

**FLOW-029** The following event names MUST be used exactly where their workflow is implemented: `reservation.created.v1`, `reservation.patient-checked-in.v1`, `queue.generated.v1`, `emr.visit-opened.v1`, `emr.treatment-material-finalized.v1`, `warehouse.material-consumed.v1`, `warehouse.material-consumption-failed.v1`, `emr.visit.completed.v1`, `billing.invoice.created.v1`, `billing.payment.received.v1`, `billing.invoice.paid.v1`, `finance.journal.posted.v1`, `finance.daily-closing.approved.v1`, `billing.refund.approved.v1`, `finance.journal.reversed.v1`, `warehouse.goods-receipt.posted.v1`, `warehouse.stock-opname-approved.v1`, `hr.payroll.approved.v1`, `system.configuration.changed.v1`, and `system.user-access-changed.v1`.

**FLOW-030** An event name not listed by the source SAD MUST be treated as NOT DEFINED IN SAD and MUST NOT be invented by the AI Agent.

## Reservation State Machine

**FLOW-031** Reservation MUST support the documented states `Draft`, `Confirmed`, `Rescheduled`, `CheckedIn`, `InQueue`, `InTreatment`, `Completed`, and `Cancelled`.

**FLOW-032** `Draft -> Confirmed` MUST be allowed only after slot validation succeeds.

**FLOW-033** `Confirmed -> Rescheduled` MUST be allowed only when a new valid slot is selected.

**FLOW-034** `Rescheduled -> Confirmed` MUST be allowed only after the new slot is confirmed.

**FLOW-035** `Confirmed -> CheckedIn` MUST be allowed only after patient arrival and check-in validation.

**FLOW-036** `CheckedIn -> InQueue` MUST be allowed only after Queue generates a queue record.

**FLOW-037** `InQueue -> InTreatment` MUST be allowed only after service begins and the EMR visit handoff is eligible.

**FLOW-038** `InTreatment -> Completed` MUST be allowed only after the documented treatment/visit completion workflow succeeds.

**FLOW-039** `Draft -> Cancelled` MUST be allowed only with the cancellation workflow.

**FLOW-040** `Confirmed -> Cancelled` MUST be allowed only before check-in and with the required reason.

**FLOW-041** A reservation after check-in MUST NOT use the ordinary reservation-cancellation transition.

**FLOW-042** No-show handling MUST create audit/activity records and MUST NOT create a clinical visit or invoice.

**FLOW-043** The exact no-show source state, transition, cutoff, and configuration MUST be treated as NOT DEFINED IN SAD.

**FLOW-044** Reservation status changes MUST create activity data containing date/time, user, previous status, new status, and note where those fields apply.

**FLOW-045** A reservation notification failure MUST NOT invalidate a committed confirmed reservation.

**FLOW-046** A reservation MUST NOT be created, rescheduled, checked in, or cancelled without branch, permission, patient, schedule, and lifecycle validation.

## Queue State Machine

**FLOW-047** Queue MUST be created after patient check-in.

**FLOW-048** Queue MUST support the documented states `waiting`, `called`, `in_service`, `completed`, `skipped`, `no_show`, and `cancelled` where those states are used by the workflow.

**FLOW-049** A `waiting` queue MUST allow only the documented call, cancel, or skip actions.

**FLOW-050** A `called` queue MUST allow only the documented start-service, recall, or skip actions.

**FLOW-051** An `in_service` queue MUST allow only the documented complete-service action.

**FLOW-052** A `completed` queue MUST be read-only for ordinary queue operations.

**FLOW-053** A `skipped`, `no_show`, or `cancelled` queue MUST be requeued only through an authorised policy.

**FLOW-054** Queue generation MUST allocate one unique queue number for the branch/date/service reference.

**FLOW-055** A retry after check-in MUST use the reservation reference and MUST NOT create a second queue number.

**FLOW-056** Queue MUST NOT create clinical content; EMR MUST own visit state.

**FLOW-057** A queue state transition not listed in `FLOW-049` through `FLOW-053` MUST be rejected.

## EMR and Material Workflow

**FLOW-058** A visit MUST be opened only from an eligible queue/reservation and the documented called state.

**FLOW-059** EMR MUST validate mandatory clinical data, treatment state, authorization, and configured material/exception conditions before visit completion.

**FLOW-060** `emr.visit.completed.v1` MUST be emitted after a successful EMR completion commit and MUST include the references required by Billing and Reporting.

**FLOW-061** EMR MUST NOT create an invoice or mark an invoice paid.

**FLOW-062** Treatment material consumption MUST validate active item, branch/warehouse, unexpired batch where applicable, and sufficient available stock.

**FLOW-063** Warehouse MUST post the treatment stock-out and MUST NOT allow negative stock from a material event.

**FLOW-064** `emr.treatment-material-finalized.v1` MUST be idempotent per treatment/material reference.

**FLOW-065** Failed material consumption MUST publish `warehouse.material-consumption-failed.v1` with an exception reference and MUST NOT silently mutate stock.

**FLOW-066** A material reversal MUST be represented by an EMR reversal and a linked Warehouse `RETURN` transaction.

**FLOW-067** A final clinical transaction MUST be corrected through an authorised amendment, adjustment, return, refund, reversal, or linked workflow and MUST NOT be directly deleted.

## Billing and Payment Workflow

**FLOW-068** Billing MUST consume a completed/eligible visit or authorised billing command before invoice generation.

**FLOW-069** Billing MUST deduplicate invoice generation by visit/reference and MUST NOT create a duplicate invoice.

**FLOW-070** A new invoice MUST begin in `draft`.

**FLOW-071** `draft -> pending_payment` MUST be allowed only after review and calculation validation.

**FLOW-072** `pending_payment -> partially_paid` MUST be allowed only after a valid partial payment.

**FLOW-073** `partially_paid -> partially_paid` MUST be allowed only after a valid additional payment that does not reach full settlement.

**FLOW-074** `pending_payment -> paid` MUST be allowed only when full payment is valid.

**FLOW-075** `partially_paid -> paid` MUST be allowed only when the outstanding balance reaches zero.

**FLOW-076** `paid -> closed` MUST be allowed only through the close workflow.

**FLOW-077** `draft -> cancelled` MUST be allowed only before payment and through the cancellation policy.

**FLOW-078** `paid -> refunded` MUST be allowed only through an approved refund policy.

**FLOW-079** `draft -> voided` MUST be allowed only through authorised void policy.

**FLOW-080** `paid` and `closed` invoices MUST NOT be edited through ordinary update operations.

**FLOW-081** Payment MUST validate invoice branch, outstanding amount, active payment method, positive amount, reference uniqueness where required, and allocation rules.

**FLOW-082** Payment, allocation, invoice balance/status, receipt/audit, and outbox event MUST commit atomically in Billing.

**FLOW-083** Finance posting failure after a valid Billing payment commit MUST create a retryable posting exception and MUST NOT automatically invalidate the payment.

**FLOW-084** A refund MUST require successful payment, refundable amount, approval, and a linked Finance reversal where applicable.

**FLOW-085** Original invoice, payment, and journal records MUST remain intact after refund, void, credit, adjustment, or reversal.

**FLOW-086** Cashier closing MUST reconcile payment method totals and physical/clearing cash; a variance MUST include reason and approval.

## Finance, Warehouse, and HR Workflow

**FLOW-087** Finance MUST validate source event schema, final source state/reference, branch, accounting period, account mapping, and event idempotency before posting.

**FLOW-088** Finance journal, journal details, source-event idempotency, outbox, and audit MUST commit atomically.

**FLOW-089** A journal correction MUST create a linked reversal journal and MUST NOT edit a posted journal.

**FLOW-090** A closed financial period MUST reject new posting.

**FLOW-091** Reopening a closed period MUST require Owner authorization, reason, audit, and the documented reopen workflow.

**FLOW-092** Warehouse purchase workflow MUST follow PO draft -> submitted -> approved/rejected -> goods receipt -> purchase stock transaction.

**FLOW-093** Warehouse MUST reject over-receipt, invalid batch, expired goods, or duplicate receipt unless an authorised policy explicitly permits it.

**FLOW-094** Warehouse transfer MUST follow draft -> submitted -> approved/rejected -> dispatched -> received or dispatched -> cancelled.

**FLOW-095** Source and destination warehouses MUST differ for a transfer.

**FLOW-096** Warehouse dispatch and receipt MUST create a traceable pair of movement references.

**FLOW-097** Stock adjustment and opname MUST create immutable linked `ADJUSTMENT` or `OPNAME` transactions after required approval.

**FLOW-098** HR payroll MUST snapshot eligible employee/source inputs, calculate, review exceptions, approve, lock the snapshot, and publish `hr.payroll.approved.v1` in that order.

**FLOW-099** HR MUST own payroll calculation and snapshot; Finance MUST own payroll journal, payable, and payment.

**FLOW-100** Approved payroll MUST NOT be edited; correction MUST create a linked adjustment or reversal.

## Reporting and System Workflow

**FLOW-101** Reporting MUST consume committed source outbox events, validate schema/version/branch/idempotency, and update a read model/checkpoint.

**FLOW-102** Reporting projection failure MUST NOT block the source transaction.

**FLOW-103** Reporting output MUST expose freshness/data-as-of state where the workflow provides that field.

**FLOW-104** Large report/export operations MUST be asynchronous when implemented and MUST return a job reference after accepted creation.

**FLOW-105** Configuration changes MUST pass typed schema and semantic validation before activation.

**FLOW-106** High-risk configuration changes MUST require independent approval where the workflow identifies high risk.

**FLOW-107** A configuration change MUST invalidate or reload consumer caches after its committed event.

**FLOW-108** Configuration and menu flags MUST NOT bypass server-side authorization or domain policy.

**FLOW-109** User role/branch changes MUST validate scope, default branch, protected administrator rules, and anti-self-escalation before commit.

**FLOW-110** Effective access changes MUST create audit and access-change event data and MUST invalidate/reload authentication claims or sessions according to policy.

## Rollback, Compensation, and Forbidden Transitions

**FLOW-111** A valid committed source transaction MUST NOT be rolled back solely because a downstream consumer failed.

**FLOW-112** Transient consumer failure MUST be handled by retry/backoff and permanent failure MUST be handled by dead-letter/worklist/replay.

**FLOW-113** Final transaction correction MUST use return, refund, reversal, adjustment, or a linked new workflow and MUST NOT use direct update/delete of the final record.

**FLOW-114** A posted journal MUST NOT be edited or deleted to correct a financial result.

**FLOW-115** A stock ledger transaction MUST NOT be edited or deleted to correct stock; a linked return, adjustment, or opname transaction MUST be used.

**FLOW-116** A successful payment MUST NOT be changed to simulate a refund; an approved refund/reversal MUST be used.

**FLOW-117** An approved payroll MUST NOT be edited to correct payroll; a linked adjustment/reversal MUST be used.

**FLOW-118** An audit event MUST NOT be deleted or overwritten; a supplemental correction record MUST be used.

**FLOW-119** No module MUST write another module's aggregate or source table directly.

**FLOW-120** Database rollback commands, retry count, backoff algorithm, dead-letter retention, and replay authorization details not explicitly stated by the two source documents MUST be treated as NOT DEFINED IN SAD.

**FLOW-121** Every command/state pair MUST have one deterministic outcome: allowed transition, validation rejection, authorization rejection, idempotent existing result, retryable exception, or permanent exception.

**FLOW-122** The AI Agent MUST NOT create a transition, state, event, participant, or rollback path that is absent from `22-workflow.md` and `23-sequence-diagram.md`.

See `27-architecture-contract.md` rules `FLOW-*` for the broader architecture contract. This file MUST be used for workflow contract generation.
