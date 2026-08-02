# AI Contract 07 - Module Contract

This contract is extracted only from module documents `11-module-master-data.md` through `21-module-system.md`. The AI Agent MUST NOT infer a module interaction from a generic architecture diagram when the owning module document does not define it.

## Global Module Rules

**MOD-001** Every module MUST have one bounded-context responsibility and MUST preserve its data ownership boundary.

**MOD-002** A module MUST mutate only the entities it owns.

**MOD-003** A module MUST expose cross-module capabilities only through its documented public service, API, Repository Interface, Application Service, or Domain Event.

**MOD-004** A module MUST NOT query another module's private tables directly.

**MOD-005** A module MUST consume only events and services listed in its module document or this contract.

**MOD-006** A public service, internal service, event, API, entity, or shared component not explicitly listed by the owning module document MUST be treated as NOT DEFINED IN SAD.

**MOD-007** Every module API MUST use the common `/api/v1` API contract, JWT/RBAC protection, validation, audit, and standard response envelope where the module is protected.

**MOD-008** Every module MUST use Clean Architecture, Domain Driven Design, Modular Monolith boundaries, Repository Pattern, and module-local business logic.

**MOD-009** Cross-module communication MUST use stable contracts or Domain Events and MUST preserve source ownership.

**MOD-010** Shared components MUST be limited to Authentication/JWT, RBAC, branch scope, validation, audit trail, logging, event bus/outbox/inbox, notification, attachment metadata, background jobs, and other components explicitly shared by the module documents.

## Master Data Module

**MOD-011** Master Data MUST own centralized reference data and MUST NOT own Patient, Reservation, Queue, EMR, Billing, Finance, Warehouse transactions, HR transactions, or Reporting transactions.

**MOD-012** Master Data MUST provide reference storage, reference API, search, filtering, pagination, import, export, validation, audit trail, and soft delete.

**MOD-013** Master Data MUST own the documented entities: Clinic, Branch, Department, Room, Dental Chair, Doctor, Employee, Specialty, Treatment, Treatment Category, Medicine, Medical Item, Consumable, Supplier, Insurance, Payment Method, Bank, Tax, Discount, Promotion, Diagnosis Reference, Tooth Condition Reference, Procedure Code, Unit, Currency, Nationality, Religion, Occupation, and Education.

**MOD-014** Master Data database ownership MUST include the documented `mst_clinics`, `mst_branches`, `mst_departments`, `mst_rooms`, `mst_dental_chairs`, `mst_specialties`, `mst_doctors`, `mst_employees`, `mst_treatment_categories`, `mst_treatments`, `mst_medicines`, `mst_medical_items`, `mst_consumables`, `mst_suppliers`, `mst_insurances`, `mst_payment_methods`, `mst_banks`, `mst_taxes`, `mst_discounts`, `mst_promotions`, `mst_units`, `mst_currencies`, `mst_religions`, `mst_nationalities`, `mst_occupations`, and `mst_educations` where those table names apply.

**MOD-015** Master Data public services MUST include Branch Service, Doctor Service, Treatment Service, Medicine Service, Supplier Service, Payment Service, Promotion Service, and Tax Service.

**MOD-016** Master Data internal service names MUST be treated as NOT DEFINED IN SAD beyond the documented validation, import, export, search, filter, pagination, and audit capabilities.

**MOD-017** Master Data MUST consume Authentication, System Parameter, and Audit Trail capabilities.

**MOD-018** Master Data MUST publish `ClinicCreated`, `ClinicUpdated`, `BranchCreated`, `BranchUpdated`, `DoctorCreated`, `DoctorUpdated`, `TreatmentCreated`, `TreatmentUpdated`, `MedicineCreated`, `MedicineUpdated`, `PromotionActivated`, `PromotionExpired`, `DiscountUpdated`, and `PaymentMethodUpdated` when their documented changes occur.

**MOD-019** Master Data MUST consume `BranchUpdated` in Patient, `DoctorUpdated` in Reservation and EMR, `TreatmentUpdated` in EMR and Billing, `PromotionActivated` and `PaymentMethodUpdated` in Billing, and `SupplierUpdated` in Warehouse as documented consumers.

**MOD-020** Master Data MUST NOT perform billing, finance, EMR, or business transaction mutations.

## Patient Module

**MOD-021** Patient MUST own the patient identity, MRN, demographic, contact, address, emergency contact, patient photo, merge, archive, and patient audit data.

**MOD-022** Patient MUST be the single source of truth for patient identity and MUST generate a unique Medical Record Number.

**MOD-023** Patient MUST own the documented entities/tables: `patients`, `patient_addresses`, `patient_emergency_contacts`, `patient_photos`, `patient_merge_logs`, and `patient_audit_logs`.

**MOD-024** Patient public API ownership MUST include the documented patient list, detail, registration, update, archive, restore, merge, photo upload, history, and export endpoints.

**MOD-025** Patient public services MUST include patient registration, identity lookup, duplicate checking, patient search, patient detail, history retrieval, and patient information access for authorised modules.

**MOD-026** Patient internal services MUST include MRN generation, identity validation, duplicate prevention, merge handling, archive/restore handling, and audit coordination.

**MOD-027** Patient MUST consume Authentication, Master Data references, and authorised Reservation, Queue, EMR, Billing, and Reporting requests.

**MOD-028** Patient MUST publish `PatientRegistered`, `PatientUpdated`, `PatientMerged`, `PatientArchived`, and `PatientRestored`.

**MOD-029** Patient MUST publish `PatientRegistered` to Reservation and Reporting, `PatientUpdated` to Reporting, `PatientMerged` to Reservation/EMR/Billing, and archive/restore events to Reporting as documented.

**MOD-030** Patient MUST NOT own appointment, queue number, SOAP, odontogram, treatment, invoice, payment, or doctor-fee state.

**MOD-031** Patient records with clinical transactions MUST NOT be physically deleted.

## Reservation Module

**MOD-032** Reservation MUST own booking, appointment, walk-in registration, availability, doctor schedule validation, reschedule, cancellation, check-in, timeline, history, notes, and queue-generation handoff.

**MOD-033** Reservation MUST own the Reservation entity and its documented relationships to Patient, Doctor, Schedule, Queue, and User.

**MOD-034** Reservation database ownership MUST include the documented reservation, reservation service, reservation status history, reservation note, check-in, doctor timeslot, and reservation-related records.

**MOD-035** Reservation public API ownership MUST include the documented reservation list/detail/create/update, check-in, cancel, reschedule, soft-delete, doctor availability, and doctor time-slot endpoints.

**MOD-036** Reservation public services MUST include create, update, cancel, reschedule, search, availability, check-in, queue-generation handoff, timeline, and history capabilities.

**MOD-037** Reservation internal services MUST include schedule validation, slot-capacity validation, conflict detection, reservation-number generation, timeline recording, audit coordination, and lifecycle validation.

**MOD-038** Reservation MUST consume Patient identity/status, Master Data doctor/schedule/branch/chair references, Authentication, and Queue integration.

**MOD-039** Reservation MUST publish `ReservationCreated`, `ReservationUpdated`, `ReservationRescheduled`, `ReservationCancelled`, `PatientCheckedIn`, `QueueGenerated`, and `ReservationCompleted`.

**MOD-040** Reservation MUST publish its documented events to Queue, Reporting, and EMR according to the event subscriber table; it MUST NOT infer additional subscribers.

**MOD-041** Reservation MUST NOT own patient identity, queue state, clinical content, invoice, payment, or finance posting.

## Queue Module

**MOD-042** Queue MUST own queue number generation, check-in queue creation, reservation/walk-in/emergency/VIP queue tickets, calling, recall, skip, cancel, complete, waiting time, service time, dashboard, and queue history.

**MOD-043** Queue MUST own Queue Ticket and the documented queue calls, queue transfers, and queue histories.

**MOD-044** Queue public services MUST include queue-number generation, check-in, queue calling, recall, skip, cancel, complete, dashboard, waiting-time, service-time, and history capabilities.

**MOD-045** Queue internal services MUST include numbering, priority ordering, schedule/doctor configuration validation, queue state transition validation, concurrency control, and time tracking.

**MOD-046** Queue MUST consume Authentication, Master Data, Patient, Reservation, Branch, and Doctor data or events explicitly required by its module document.

**MOD-047** Queue MUST publish `QueueCreated`, `QueueCalled`, `QueueRecalled`, `QueueSkipped`, `QueueStarted`, `QueueCompleted`, `QueueCancelled`, and `QueueTransferred`.

**MOD-048** Queue MUST publish documented events to Reservation, EMR, Billing, Reporting, Notification, and Audit Log consumers where those integrations are defined.

**MOD-049** Queue MUST NOT own patient registration, reservation booking, examination, treatment input, payment, or stock management.

## EMR Module

**MOD-050** EMR MUST own Visit, SOAP, vital signs, medical history, allergy, clinical examination, diagnosis, odontogram, treatment, prescription, medical attachment, doctor notes, treatment progress, doctor discount, medical certificate, and visit history.

**MOD-051** EMR database ownership MUST include the documented `visits`, `soap_notes`, `vital_signs`, `odontograms`, `odontogram_teeth`, `diagnoses`, `visit_diagnoses`, `treatments`, `visit_treatments`, `treatment_materials`, `prescriptions`, `prescription_items`, `medical_attachments`, `doctor_notes`, `treatment_progress`, `doctor_discounts`, `medical_certificates`, and `visit_histories`.

**MOD-052** EMR MUST own the Visit aggregate root and MUST create a Visit from an eligible Queue state.

**MOD-053** EMR public API ownership MUST include the documented EMR/visit, SOAP, vital, odontogram, diagnosis, treatment, prescription, attachment, medical certificate, and clinical examination endpoints where specified by its module documents.

**MOD-054** EMR public services MUST include visit management, SOAP, vital signs, medical history, allergy, examination, diagnosis, odontogram, treatment, prescription, attachment, discount, follow-up, and clinical timeline capabilities defined by the module documents.

**MOD-055** EMR internal services MUST include clinical validation, treatment/material coordination, odontogram versioning, history generation, attachment metadata, timeline, audit, and domain event publication.

**MOD-056** EMR MUST consume Patient, Reservation, Queue, Master Data doctor/treatment/medicine references, Authentication, and authorised Warehouse/Billing integration.

**MOD-057** EMR MUST publish the documented clinical domain events, including odontogram condition/surface/version/history events, attachment events, treatment/material finalization, visit completion, and other event names explicitly defined by its module parts.

**MOD-058** EMR event consumers MUST include Billing, Warehouse, Reporting, Notification, Audit, Clinical Timeline, Data Warehouse, and AI Imaging only where explicitly listed by the relevant EMR document.

**MOD-059** EMR MUST NOT directly mutate Billing invoice/payment state or Warehouse stock balance.

## Billing Module

**MOD-060** Billing MUST own invoice, payment, discount, insurance, deposit, refund, receipt, doctor-fee source, invoice history, cashier-shift transaction, and billing audit responsibilities.

**MOD-061** Billing database ownership MUST include the documented `invoices`, `invoice_items`, `payments`, `payment_allocations`, `discounts`, `refunds`, `receipts`, `doctor_fees`, `invoice_histories`, and `cashier_shift_transactions`.

**MOD-062** Billing MUST use the Invoice Aggregate Root for invoice transaction changes.

**MOD-063** Billing public API ownership MUST include the documented invoice list/create/detail, payment, deposit, refund, discount, closing, and OpenAPI endpoints where specified.

**MOD-064** Billing public services MUST include invoice generation, invoice review, payment, split payment, discount, insurance, deposit, refund, receipt, close, void, and billing history capabilities defined by its module documents.

**MOD-065** Billing internal services MUST include charge calculation, payment allocation, outstanding calculation, refund validation, approval validation, audit, idempotency, and domain event publication.

**MOD-066** Billing MUST consume completed EMR/Visit/Treatment, Master Data treatment/discount/promotion/tax/payment method, Patient, Reservation, Queue, and Authentication references as documented.

**MOD-067** Billing MUST publish `InvoiceCreated`, `InvoicePaid`, `InvoiceClosed`, `PaymentReceived`, and `RefundCreated`.

**MOD-068** Finance, Reporting, and Notification MUST consume Billing events only where the Billing module explicitly defines those consumers.

**MOD-069** Billing MUST NOT own general-ledger journal posting, official Finance accounting, stock balance, patient identity, or clinical EMR state.

## Finance Module

**MOD-070** Finance MUST own financial recognition, general ledger, treasury, operational expenses, doctor-fee settlement, daily cash closing, financial periods, tax postings, and financial statements.

**MOD-071** Finance MUST own Account, JournalEntry/JournalDetail, CashAccount/CashMovement, Expense, DoctorFeeSettlement, FinancialPeriod, and the documented finance aggregates.

**MOD-072** Finance public services MUST include ledger, journal, posting, reversal, cash/bank movement, transfer, reconciliation, expense, doctor-fee settlement, daily closing, period close/reopen, and financial report capabilities defined by its document.

**MOD-073** Finance internal services MUST include source-event validation, account mapping, double-entry validation, period validation, idempotency, reconciliation, posting, reversal, and audit coordination.

**MOD-074** Finance MUST consume System/Master Data configuration, Billing payment/invoice/refund/close events, Warehouse purchase/stock events, and HR approved payroll events.

**MOD-075** Finance MUST publish posted journal, closing, settlement, and report snapshot events to Reporting and audit/notification services as documented.

**MOD-076** Finance MUST own financial statement outputs but MUST NOT mutate Billing payment/invoice state, Warehouse stock state, or HR payroll calculation state.

**MOD-077** Finance MUST use IDR, DECIMAL(18,2), decimal arithmetic, balanced double-entry, immutable posting, branch isolation, and period integrity as documented.

## Warehouse Module

**MOD-078** Warehouse MUST own item stock, batch, warehouse balance, purchase order, goods receipt, stock transaction, stock adjustment, stock opname, transfer, expiry, and stock alert responsibilities.

**MOD-079** Warehouse MUST own Item, Warehouse, StockBalance, StockTransaction, PurchaseOrder, GoodsReceipt, ItemBatch, StockOpname, Adjustment, and the documented warehouse aggregates.

**MOD-080** Warehouse public services MUST include item/stock query, purchase order, goods receipt, material consumption, stock transfer, stock adjustment, stock opname, expiry, and alert capabilities defined by its document.

**MOD-081** Warehouse internal services MUST include stock locking/concurrency, batch/expiry valuation, FEFO selection, event idempotency, balance calculation, adjustment validation, and outbox publication.

**MOD-082** Warehouse MUST consume Master Data item/supplier/medicine/consumable references and EMR material-consumption events.

**MOD-083** Warehouse MUST publish stock, purchase, receipt, consumption, expiry, transfer, adjustment, opname, and alert events defined by its module document.

**MOD-084** Finance and Reporting MUST consume Warehouse events only where their module documents define the integration.

**MOD-085** Warehouse MUST NOT own supplier payment, general ledger, official COGS posting, patient invoice, or EMR treatment state.

## Human Resource Module

**MOD-086** HR MUST own employee identity relationship, employment status, contracts, salary data, schedules, attendance, leave, overtime, payroll calculation, payroll items, and HR reports.

**MOD-087** HR MUST own Employee, EmploymentHistory, Contract, Salary, Schedule, Attendance, Leave, Overtime, Payroll, PayrollItem, and the documented HR aggregates.

**MOD-088** HR public services MUST include employee, employment, schedule, attendance, leave, overtime, payroll calculation, payroll approval, and HR reporting capabilities defined by its document.

**MOD-089** HR internal services MUST include eligibility, attendance validation, leave/overtime approval, payroll snapshot/calculation, payroll locking, adjustment, and event publication.

**MOD-090** HR MUST consume Master Data department/employee references and Authentication/System user-link or access events without creating credentials or roles.

**MOD-091** HR MUST publish employee activation/deactivation, employee identity, attendance, leave, overtime, `hr.payroll.approved.v1`, and payroll adjustment/reversal events defined by its document.

**MOD-092** Finance and Reporting MUST consume HR payroll and HR operational events only where explicitly defined.

**MOD-093** HR MUST NOT own user credentials, JWT, role assignment, Finance journal/payment, or source module transaction state.

## Reporting and Dashboard Module

**MOD-094** Reporting MUST be read-only and MUST NOT create or mutate Patient, Reservation, EMR, Invoice, Journal, Stock, Employee, or other source transactions.

**MOD-095** Reporting MUST own metric definitions, aggregates, report definitions, report jobs, report snapshots, dashboard summaries, projections, checkpoints, and export artifacts defined by its document.

**MOD-096** Reporting public API ownership MUST include dashboard read endpoints, report query endpoints, report jobs/export endpoints, report catalog, job status, and download capabilities explicitly documented by its module.

**MOD-097** Reporting public services MUST include dashboard, operational report, financial report, inventory report, HR report, clinical/quality report, snapshot, projection, query, export, and reconciliation capabilities defined by its document.

**MOD-098** Reporting internal services MUST include event projection, aggregation, freshness/watermark, checkpoint, replay/backfill, scope authorization, cache isolation, export artifact, and data-quality validation.

**MOD-099** Reporting MUST consume versioned events from Patient, Reservation, Queue, EMR, Billing, Finance, Warehouse, HR, and System where the Reporting data-source matrix defines them.

**MOD-100** Reporting MUST publish `reporting.data-quality-alert.v1` when its documented projection/reconciliation threshold is breached.

**MOD-101** Reporting MUST NOT publish operational domain mutation commands or directly write source module tables.

**MOD-102** Reporting MUST apply server-derived branch scope, detail/column restrictions, privacy classification, and stale/partial freshness state.

## System Administration Module

**MOD-103** System Administration MUST own user provisioning/deactivation, role/permission catalog and assignment, branch scope, parameters, feature flags, menus, notification templates/inbox, audit/activity records, attachments metadata, and background-job governance.

**MOD-104** System MUST own User Administration, Role, Permission, UserBranch, SystemParameter, FeatureFlag, Menu, Notification, NotificationTemplate, AuditLog, ActivityLog, AttachmentMetadata, BackgroundJob, JobLog, and the documented shared operational entities.

**MOD-105** System public services MUST include user administration, role/permission configuration, branch assignment, parameter, feature flag, menu, notification, audit/activity inspection, attachment metadata, and background-job operations defined by its document.

**MOD-106** System internal services MUST include schema/value validation, effective-scope resolution, versioning, approval, cache invalidation, notification queueing, job retry/dead-letter, audit integrity, and administrative policy enforcement.

**MOD-107** System MUST consume Authentication user/session/lock events, All Domain audit/activity/notification/job events, and Master Data clinic/branch/department references.

**MOD-108** System MUST publish user activation/deactivation, role/scope invalidation, `system.configuration.changed.v1`, audit/operational events, notification outcomes, and background-job events defined by its document.

**MOD-109** Authentication MUST consume System user activation/deactivation, role/scope invalidation, and revoke-session requests; all domain modules MUST consume resolved parameter/flag/menu and permission/scope changes where defined.

**MOD-110** System MUST NOT implement password, JWT, refresh-token, session, or authentication middleware mechanics owned by Authentication.

**MOD-111** System MUST NOT interpret a module-specific business parameter beyond generic schema, scope, version, and effective-value behavior.

## Cross-Module Communication Rules

**MOD-112** Every published event MUST include the documented event envelope: event ID, event type, occurred time, source, branch when applicable, correlation ID, schema version, and safe payload.

**MOD-113** Event consumers MUST deduplicate by event ID or documented business reference.

**MOD-114** Source transaction, audit, inbox/outbox, and local state MUST commit atomically in the owning module.

**MOD-115** Consumer failure MUST NOT cancel a valid committed source transaction.

**MOD-116** Transient consumer failures MUST retry through the documented durable event mechanism; permanent failures MUST enter dead-letter/worklist processing.

**MOD-117** Cross-module corrections MUST use linked compensation, reversal, refund, return, adjustment, or new workflow and MUST NOT directly mutate another module's finalized record.

**MOD-118** Public services MUST return stable contracts and MUST NOT expose private entity persistence details without an explicit module API contract.

**MOD-119** Internal services MUST remain inside the owning module's Application/Domain boundary and MUST NOT become undocumented cross-module APIs.

**MOD-120** API ownership MUST remain with the module that owns the resource; a consumer module MUST NOT expose a mutation endpoint for another module's resource.

**MOD-121** Database ownership MUST remain with the module that owns the entity; read projections MUST NOT become source-of-truth tables.

**MOD-122** Shared components MUST NOT contain module-specific business rules.

**MOD-123** The complete public-service list, internal-service list, event list, API list, and shared-component list not explicitly stated by each module document MUST be treated as NOT DEFINED IN SAD.

**MOD-124** The AI Agent MUST NOT infer a dependency, event subscriber, API owner, database owner, or module interaction from a diagram when the module document does not explicitly define it.

See `27-architecture-contract.md` rules `MOD-*` for the broader architecture contract. This file MUST be used for module contract generation.
