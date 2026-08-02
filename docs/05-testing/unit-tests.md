# Unit Tests

> Source: `docs/03-sad/03-clean-architecture.md` Section 40.2–40.4 (Test Layer, Coverage Target, Unit Test Principle) and Section 21 (Use Case Pattern). Per-module use case lists are in `docs/01-prd/features/*.md`.

---

# 1. Scope

Unit Tests apply to the **Domain** and **Use Case** layers only (per `docs/03-sad/03-clean-architecture.md` Section 40.2). They must not depend on Database, HTTP, Prisma, Redis, or any External API — dependencies must be mocked or stubbed (Section 40.4).

# 2. Coverage Target

| Layer | Target |
|--------|-------|
| Domain | 90% |
| Use Case | 90% |

# 3. What Must Be Unit Tested Per Module

Every Use Case listed in each module's feature file must have a corresponding unit test that exercises its business rules from `docs/01-prd/business-rules.md`. This table maps modules to where their use cases and rules are documented:

| Module | Use Cases | Business Rules |
|---|---|---|
| Master Data | `docs/01-prd/features/master-data.md` | `docs/01-prd/business-rules.md` § 1 |
| Patient | `docs/01-prd/features/patient.md` | `docs/01-prd/business-rules.md` § 2 |
| Reservation | `docs/01-prd/features/reservation.md` | `docs/01-prd/business-rules.md` § 3 |
| Queue | `docs/01-prd/features/queue.md` | `docs/01-prd/business-rules.md` § 4 |
| EMR | `docs/01-prd/features/emr.md` | See `docs/01-prd/business-rules.md` "Note on EMR" — rules are distributed across `docs/03-sad/15-module-emr.md`; read the relevant sub-section directly |
| Billing | `docs/01-prd/features/billing.md` | `docs/01-prd/business-rules.md` § 5 |
| Finance | `docs/01-prd/features/finance.md` | `docs/01-prd/business-rules.md` § 6 |
| Warehouse | `docs/01-prd/features/warehouse.md` | `docs/01-prd/business-rules.md` § 7 |
| Human Resource | `docs/01-prd/features/hr.md` | `docs/01-prd/business-rules.md` § 8 |
| Reporting & Dashboard | `docs/01-prd/features/reporting.md` | `docs/01-prd/business-rules.md` § 9 |
| System Administration | `docs/01-prd/features/system.md` | `docs/01-prd/business-rules.md` § 10 |

# 4. Naming Convention

Per `docs/03-sad/03-clean-architecture.md` Section 21.2, Use Cases follow `<Verb><Entity>UseCase` naming (e.g. `CreatePatientUseCase`, `CheckInPatientUseCase`). Unit test files should mirror this: `<verb>-<entity>.usecase.spec.ts`.

# 5. Golden Reference

`docs/03-sad/03-clean-architecture.md` Section 41 designates the **Patient Module** as the golden reference implementation (folder structure, request flow, use case example, module checklist). New modules' unit tests should follow the same structure until each module has its own fully worked example.
