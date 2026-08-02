# Features

Index of feature specifications, one file per module (Bounded Context), derived from `docs/03-sad/11-module-master-data.md` through `docs/03-sad/21-module-system.md` per the module list in `docs/03-sad/01-system-overview.md` Section 3.1.

| # | Module | File | Source SAD Document |
|---|--------|------|----------------------|
| 1 | Master Data | [master-data.md](./master-data.md) | 03-sad/11-module-master-data.md |
| 2 | Patient | [patient.md](./patient.md) | 03-sad/12-module-patient.md |
| 3 | Reservation | [reservation.md](./reservation.md) | 03-sad/13-module-reservation.md |
| 4 | Queue | [queue.md](./queue.md) | 03-sad/14-module-queue.md |
| 5 | EMR | [emr.md](./emr.md) | 03-sad/15-module-emr.md |
| 6 | Billing | [billing.md](./billing.md) | 03-sad/16-module-billing.md |
| 7 | Finance | [finance.md](./finance.md) | 03-sad/17-module-finance.md |
| 8 | Warehouse | [warehouse.md](./warehouse.md) | 03-sad/18-module-warehouse.md |
| 9 | Human Resource | [hr.md](./hr.md) | 03-sad/19-module-hr.md |
| 10 | Reporting & Dashboard | [reporting.md](./reporting.md) | 03-sad/20-module-report.md |
| 11 | System Administration | [system.md](./system.md) | 03-sad/21-module-system.md |

Authentication & Authorization is not listed as a separate feature file here because it is fully specified as a cross-cutting contract in `docs/04-ai-contract/05-auth-contract.md` and `docs/03-sad/10-authentication.md`; refer to those documents directly rather than duplicating them here.

Each feature file follows the same structure: Scope (in/out of scope per the SAD) and Use Cases / Functional Flow (the business process the module implements). Detailed data model, API specification, and error handling for each module remain in the corresponding `docs/03-sad/` document and are intentionally not duplicated here to avoid drift between the PRD and the SAD.
