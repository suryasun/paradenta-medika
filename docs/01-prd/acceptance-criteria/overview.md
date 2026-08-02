# Acceptance Criteria

Index of acceptance criteria per module, mirroring `docs/01-prd/features/overview.md`.

| Module | File | Status |
|--------|------|--------|
| Master Data | [master-data.md](./master-data.md) | Missing dedicated source section — flagged |
| Patient | [patient.md](./patient.md) | Missing dedicated source section — flagged |
| Reservation | [reservation.md](./reservation.md) | Derived from SAD Section 36 (Test Scenarios) |
| Queue | [queue.md](./queue.md) | Missing dedicated source section — flagged |
| EMR | [emr.md](./emr.md) | Partially derived (Odontogram sub-module); other sub-modules referenced, not duplicated |
| Billing | [billing.md](./billing.md) | Derived from SAD Part 10 (Test Scenario & Acceptance Criteria) |
| Finance | [finance.md](./finance.md) | Derived from SAD Section 11 (Test Scenarios and Acceptance Criteria) |
| Warehouse | [warehouse.md](./warehouse.md) | Derived from SAD Section 11 |
| Human Resource | [hr.md](./hr.md) | Derived from SAD Section 11 |
| Reporting & Dashboard | [reporting.md](./reporting.md) | Derived from SAD Section 11 |
| System Administration | [system.md](./system.md) | Derived from SAD Section 11 |

Three modules (Master Data, Patient, Queue) do not currently have a dedicated Test Scenario / Acceptance Criteria section in their source SAD document. This is reported explicitly in each corresponding file rather than invented, per project policy. Closing this gap requires updating the source `docs/03-sad/` documents first — not fabricating criteria at the PRD layer.
