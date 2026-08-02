# AI Contract 06 - Database Contract

This contract is extracted only from `06-database-design.md`, `07-data-dictionary.md`, and `08-erd.md`. The AI Agent MUST NOT resolve contradictions between these documents by assumption.

## Database Technology and Ownership

**DB-001** The database MUST be MySQL 8.x.

**DB-002** The ORM MUST be Prisma ORM.

**DB-003** Database access MUST occur through the Repository layer.

**DB-004** Controllers and business logic MUST NOT access the database directly.

**DB-005** Database design MUST be organized by bounded-context ownership.

**DB-006** Each module MUST own its tables and another module MUST NOT manipulate those tables directly.

**DB-007** Cross-module data access MUST use Application Service, Repository Interface, Domain Event, or Read Model according to the ERD contract.

**DB-008** The system MUST preserve referential integrity.

## Normalization and Entity Boundaries

**DB-009** Tables MUST satisfy First Normal Form, Second Normal Form, and Third Normal Form.

**DB-010** Denormalization MUST NOT be introduced unless a measurable performance requirement justifies it.

**DB-011** Each module MUST expose an Aggregate Root as the entry point for changes within that aggregate.

**DB-012** The complete Aggregate Root list for every module MUST be treated as NOT DEFINED IN SAD except for the Patient -> Reservation -> Queue -> Visit aggregate chain shown in the ERD.

## Table Naming

**DB-013** Database table names MUST use lowercase snake_case.

**DB-014** `06-database-design.md` MUST use plural nouns for table names where its naming section applies.

**DB-015** `07-data-dictionary.md` MUST use singular nouns for table names where its naming section applies.

**DB-016** Because `06-database-design.md` and `07-data-dictionary.md` conflict on singular versus plural table names, the canonical table plurality MUST be treated as NOT DEFINED IN SAD.

**DB-017** The AI Agent MUST NOT rename a table to resolve the singular/plural conflict without a SAD revision.

**DB-018** Pivot table names MUST combine related entity names in snake_case, including the documented forms `visit_treatments`, `patient_allergies`, and `role_permissions`.

## Column Naming

**DB-019** Column names MUST use snake_case.

**DB-020** Primary-key columns MUST be named `id`.

**DB-021** Foreign-key columns MUST use the `{entity}_id` pattern, including `patient_id`, `doctor_id`, `reservation_id`, `visit_id`, `invoice_id`, `branch_id`, and `employee_id` where those relationships exist.

**DB-022** Boolean columns MUST use the `is_` or `has_` prefix, including documented patterns such as `is_active`, `is_default`, `is_verified`, and `has_attachment`.

**DB-023** Date-only columns MUST use the `_date` suffix.

**DB-024** Time-only columns MUST use the `_time` suffix.

**DB-025** DateTime columns MUST use the `_at` suffix.

## UUID and Primary Keys

**DB-026** Every table primary key MUST use UUID.

**DB-027** UUID primary-key columns MUST use the `id` name.

**DB-028** The database representation of UUID primary keys MUST use `CHAR(36)` where the Data Dictionary defines the representation.

**DB-029** The AI Agent MUST NOT substitute an auto-increment integer primary key for a documented UUID primary key.

## Foreign Keys and Cascade Policy

**DB-030** Every defined relationship MUST use a foreign-key constraint.

**DB-031** Foreign keys MUST preserve referential integrity.

**DB-032** Cascade delete MUST be avoided for transactional data.

**DB-033** Transactional records MUST NOT be physically deleted through a cascade.

**DB-034** The exact foreign-key action for each relation MUST be treated as NOT DEFINED IN SAD unless explicitly specified by the table contract.

## Soft Delete Policy

**DB-035** Transactional records MUST use soft delete.

**DB-036** Soft delete MUST use `deleted_at` and `deleted_by` fields where the table is subject to the audit-column standard.

**DB-037** A record MUST be considered active when `deleted_at IS NULL`.

**DB-038** A record MUST be considered deleted when `deleted_at IS NOT NULL`.

**DB-039** Soft delete MUST preserve audit history, transaction history, and data relationships.

**DB-040** Master data MUST NOT be hard deleted after it has been used by a transaction.

**DB-041** The exact master-data hard-delete eligibility check MUST be treated as NOT DEFINED IN SAD.

## Audit Columns

**DB-042** Transactional tables MUST contain `created_at`, `created_by`, `updated_at`, `updated_by`, `deleted_at`, and `deleted_by` according to `06-database-design.md`.

**DB-043** Operational tables MUST contain the audit columns defined by `07-data-dictionary.md`.

**DB-044** The `created_at` column MUST record creation time.

**DB-045** The `created_by` column MUST record the creating user.

**DB-046** The `updated_at` column MUST record the last update time.

**DB-047** The `updated_by` column MUST record the last updating user when an update occurs.

**DB-048** The `deleted_at` column MUST record soft-delete time when a record is soft deleted.

**DB-049** The `deleted_by` column MUST record the user performing soft delete when a record is soft deleted.

**DB-050** Every important data change MUST remain traceable through audit data.

**DB-051** The Data Dictionary's `is_active` common-column requirement MUST be applied where the table definition includes that common standard.

## Timestamp Policy

**DB-052** Database timestamps MUST use UTC according to `06-database-design.md` and `08-erd.md`.

**DB-053** `06-database-design.md` MUST use `DATETIME(3)` and millisecond precision for timestamps.

**DB-054** `07-data-dictionary.md` MUST use `DATETIME` for its documented field definitions.

**DB-055** Because the SAD does not reconcile `DATETIME(3)` with `DATETIME`, the canonical timestamp precision MUST be treated as NOT DEFINED IN SAD.

**DB-056** Local timezone conversion MUST occur in the Application layer.

**DB-057** The exact application timezone source and storage conversion implementation MUST be treated as NOT DEFINED IN SAD.

## Unique Constraints

**DB-058** Unique constraints MUST be applied where the SAD explicitly defines a unique business identifier.

**DB-059** The documented unique constraints MUST include `username`, `email`, `medical_record_no`, `identity_type` with `identity_number`, `reservation_no`, `queue_number` with `queue_date`, `visit_no`, `invoice_no`, and `item_code` where those tables exist.

**DB-060** The `role_permissions` mapping MUST enforce uniqueness on `(role_id, permission_id)`.

**DB-061** Finance journal entries MUST satisfy `SUM(debit) = SUM(credit)` where the journal contract applies.

**DB-062** Check constraints MUST enforce non-negative `subtotal`, `discount`, `grand_total`, `qty`, and `stock` where those fields exist and the constraint is documented.

**DB-063** Unique constraints not explicitly listed in the three source documents MUST be treated as NOT DEFINED IN SAD.

## Index Strategy

**DB-064** Every table MUST have a primary index on `id`.

**DB-065** Tables MUST have indexes required by their documented query and relationship needs.

**DB-066** The documented secondary-index candidates MUST include `patient_id`, `doctor_id`, `branch_id`, `status`, and `created_at` where those fields exist and are queried.

**DB-067** The documented composite-index candidates MUST include `(patient_id, visit_date)`, `(branch_id, invoice_date)`, `(item_id, warehouse_id)`, and `(doctor_id, reservation_date)` where those fields exist and the query requires them.

**DB-068** The Patient table MUST index `patient_name`, `phone`, and `active` where the Patient table definition applies.

**DB-069** The Reservation table MUST index `patient_id`, `doctor_id`, `reservation_date`, and `status` where the Reservation table definition applies.

**DB-070** The Queue table MUST index `queue_date`, `status`, and `doctor_id` where the Queue table definition applies.

**DB-071** The Visit table MUST index `patient_id`, `doctor_id`, `visit_date`, and `status` where the Visit table definition applies.

**DB-072** The AI Agent MUST NOT add an index without a documented query need, relationship need, or explicit SAD index rule.

## Migration Policy

**DB-073** Database migrations MUST be generated from the approved database design, Data Dictionary, ERD, and Prisma schema.

**DB-074** Migrations MUST preserve primary keys, foreign keys, unique constraints, index rules, audit columns, and soft-delete policy defined by SAD.

**DB-075** The ERD MUST be used as a reference for migration and Prisma Schema implementation.

**DB-076** The exact migration tool command, migration naming convention, migration ordering policy, rollback strategy, and production approval process MUST be treated as NOT DEFINED IN SAD.

**DB-077** The AI Agent MUST NOT invent a migration rollback policy or destructive migration behavior.

## Transaction Boundaries

**TX-001** Database transactions MUST satisfy Atomicity, Consistency, Isolation, and Durability.

**TX-002** Business transactions MUST be managed in the Application layer.

**TX-003** Persistence transactions MUST be implemented through Repository abstractions.

**TX-004** Aggregate changes MUST enter through the Aggregate Root.

**TX-005** Cross-module changes MUST use Application Service, Repository Interface, Domain Event, or Read Model rather than direct table access.

**TX-006** The exact transaction boundary for each use case MUST be treated as NOT DEFINED IN SAD unless explicitly documented by the module.

**TX-007** The AI Agent MUST NOT introduce distributed transactions, cross-module direct writes, or transaction boundaries not defined by SAD.

## Archiving, Backup, and Database Security

**DB-078** Archived data MUST remain accessible through Reporting when the documented archive strategy is implemented.

**DB-079** The documented backup strategy MUST include daily full backup, hourly incremental backup, binary-log backup, offsite backup, and encrypted backup.

**DB-080** The documented recovery targets MUST be RPO less than or equal to 15 minutes and RTO less than or equal to 1 hour.

**DB-081** Database access MUST use a separate database user and least privilege.

**DB-082** Database connections MUST use TLS where the database security contract applies.

**DB-083** Password hashes MUST use bcrypt and backups MUST be encrypted where the documented security rules apply.

**DB-084** Important database changes MUST be recorded in `audit_logs` and `activity_logs`.

See `27-architecture-contract.md` rules `DB-*` and `TX-*` for the broader architecture contract. Any unresolved conflict above MUST remain `NOT DEFINED IN SAD` until the source SAD is revised.
