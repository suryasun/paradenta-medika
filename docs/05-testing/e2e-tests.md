# E2E Tests

> Source: `docs/03-sad/01-system-overview.md` Sections 21–24 (End-to-End Business Workflow, Clinical Workflow, Internal Business Event, Integration Overview) and `docs/03-sad/22-workflow.md` (End-to-End Workflow, 12 sections). Per-module Test Scenario sections supplement the critical flows below.

---

# 1. Primary Critical Flow (Patient Journey)

Per `docs/03-sad/01-system-overview.md` Section 21.1, the core E2E flow every patient-facing release must exercise is:

```
Patient → Reservation → CheckIn → Queue → Doctor → EMR → Billing → Payment → Completed
```

This single flow touches 7 of the 11 core modules (Patient, Reservation, Queue, EMR, Billing, Finance via Payment) and should be the first E2E test written and kept green at all times.

# 2. Reservation Sub-Flow

Per `docs/03-sad/01-system-overview.md` Section 21.2 (Reservation Status lifecycle):

```
BOOKED → CHECK_IN → WAITING → CALLED → IN_SERVICE → COMPLETED
```

With `CANCELLED` and `NO_SHOW` as alternate terminal states that must also be covered by E2E tests (not just the happy path).

# 3. Clinical Sub-Flow

Per `docs/03-sad/01-system-overview.md` Section 22 (Clinical Workflow):

```
Open Visit → Vital Sign → SOAP → Odontogram → Diagnosis → Treatment → Prescription → Save EMR → Generate Invoice
```

# 4. Internal Event Chain (cross-module consistency)

Per `docs/03-sad/01-system-overview.md` Section 23, an E2E test of the full patient journey must also assert that these internal domain events fire in order and produce the expected side effects in downstream modules:

```
Patient Checked In → Queue Updated → Doctor Called → Visit Started → Treatment Saved
  → EMR Completed → Generate Invoice → Reduce Inventory → Calculate Doctor Fee
  → Finance Updated → Dashboard Updated
```

Each arrow above is a candidate assertion point: e.g. "Reduce Inventory" should be verified against Warehouse stock levels, "Finance Updated" against Finance journal entries, "Dashboard Updated" against Reporting module aggregates.

# 5. Additional Critical Flows by Module

These are documented end-to-end (not just unit-level) in `docs/03-sad/22-workflow.md`:

- Reservation / Queue workflow
- EMR / Treatment / Material consumption workflow
- Billing / Payment / Refund workflow
- Finance / Closing workflow
- Warehouse workflow (Purchase → Goods Receipt → Stock Opname)
- HR / Payroll workflow
- Reporting / System Administration workflow
- Exception & compensation matrix (E2E-001 through E2E-014 acceptance criteria)

Refer to `docs/03-sad/22-workflow.md` directly for the full detail behind each of these before writing the corresponding E2E test; they are not duplicated here to avoid drift.

# 6. Module-Level Test Scenarios Feeding Into E2E

Where a module has a dedicated Test Scenario section, its scenarios represent the integration-level building blocks that E2E tests compose:

| Module | Test Scenario Source |
|---|---|
| Reservation | `docs/03-sad/13-module-reservation.md` Section 36 |
| Billing | `docs/03-sad/16-module-billing.md` Part 10 |
| Finance | `docs/03-sad/17-module-finance.md` Section 11 |
| Warehouse | `docs/03-sad/18-module-warehouse.md` Section 11 |
| Human Resource | `docs/03-sad/19-module-hr.md` Section 11 |
| Reporting & Dashboard | `docs/03-sad/20-module-report.md` Section 11 |
| System Administration | `docs/03-sad/21-module-system.md` Section 11 |
| EMR (Odontogram sub-module) | `docs/03-sad/15-module-emr.md` Section 39 |

Master Data, Patient, and Queue currently lack a dedicated Test Scenario section — see `docs/01-prd/acceptance-criteria/master-data.md`, `patient.md`, and `queue.md` for the documented gap.
