# Pages

Index of page-level design specs for all 11 modules. Only Patient (`patient.md`) has a source-verbatim spec from the SAD; the other 10 are **Proposed Design** documents derived from `docs/01-prd/features/` and `docs/01-prd/acceptance-criteria/`, per the resolution recorded in `docs/02-design/design-system.md`.

---

## 1. Page Specs

| Module | File | Status |
|---|---|---|
| Master Data | [master-data.md](./master-data.md) | Proposed — derived from features + business rules |
| Patient | [patient.md](./patient.md) | Source-specified (`docs/03-sad/12-module-patient.md` §12) |
| Reservation | [reservation.md](./reservation.md) | Proposed |
| Queue | [queue.md](./queue.md) | Proposed |
| EMR | [emr.md](./emr.md) | Proposed — Odontogram flagged for a dedicated hi-fi pass |
| Billing | [billing.md](./billing.md) | Proposed |
| Finance | [finance.md](./finance.md) | Proposed |
| Warehouse | [warehouse.md](./warehouse.md) | Proposed |
| Human Resource | [hr.md](./hr.md) | Proposed |
| Reporting & Dashboard | [reporting.md](./reporting.md) | Proposed |
| System Administration | [system.md](./system.md) | Proposed |

## 2. Visual references built this pass

- `Parakita - Design System.dc.html` — tokens + component gallery (light/dark)
- `Parakita - Key Screens.dc.html` — Dashboard, Patient List, Patient Detail (Profile tab), Queue Board — with Owner/Dokter/Kasir role switching

The remaining modules (Master Data, Reservation, EMR, Billing, Finance, Warehouse, HR, Reporting, System Admin) have page inventories but no visual mockup yet — flag to the user as a next step, prioritized by what Claude Code will implement first.
