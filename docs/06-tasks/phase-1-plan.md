# Phase 1 Implementation Plan -- Foundation (MVP)

> Source: `docs/03-sad/26-roadmap.md` Section 4 ("Phase 1 -- Foundation (MVP)", lines 1158-1216). Scope: Authentication, User Management, Master Data, Patient, Reservation, Queue, EMR (basic), Billing (basic), Dashboard (simple). Read in the required order: `docs/04-ai-contract/` -> `docs/01-prd/` -> `docs/03-sad/` -> `docs/02-design/` -> `docs/03-sad/26-roadmap.md`.

This document is the Phase 1 index: Task List, Dependencies, Implementation Order, Definition of Done, and Acceptance Criteria at the Phase level. Each individual task has its own full specification file (`docs/06-tasks/task-0XX.md`) per the required per-task template (Task ID, Business Goal, Module, Priority, Depends On, Required Documents, Backend/Frontend/Database/API/Workflow/Security Impact, Testing Required, Deliverables, Acceptance Criteria, Definition of Done, Dependency Detail).

**Per the instruction to never invent missing requirements:** every task below cites the exact SAD/AI-Contract section it is grounded in. Where a detail was not explicit in source (e.g. some Master Data CRUD endpoint paths, the exact EMR-008/009 vs Odontogram boundary, the Diagnosis Reference master data gap), this is flagged inline in the task file rather than guessed.

---

## 1. Ambiguities / Gaps Reported (per "If the roadmap is ambiguous, report the ambiguity")

1. **Master Data endpoint paths are not enumerated in the SAD.** `docs/03-sad/11-module-master-data.md` Section 8 lists 20 master-data catalog entities but does not give literal REST paths for any of them (unlike Patient, Reservation, Queue, Billing, Finance, Warehouse, HR, Reporting, System, which all have an explicit API Specification section). Tasks 021-026 apply the documented URL convention from `docs/04-ai-contract/04-api-contract.md` rather than inventing undocumented literal paths -- this is noted in every affected task.
2. **Phase 1 vs Phase 2 EMR boundary.** The roadmap doesn't give a field-level cutoff between "EMR dasar" (Phase 1) and "Digital Medical Record lengkap" (Phase 2). This plan draws the line using Phase 2's explicit "New Capabilities" list (Odontogram, Prescription, Clinical Attachment, full Treatment Planning) as *excluded* from Phase 1, keeping only Open/Close Visit, Vital Sign, SOAP, Diagnosis, and a basic Treatment entry. This is a judgment call bridging roadmap module names to concrete scope, flagged in `docs/03-sad/26-roadmap.md`-referencing tasks (048-053), not asserted as directly SAD-specified.
3. **Diagnosis Reference master data.** task-051 (Record Diagnosis) references a `Diagnosis Reference` master data catalog entity (`docs/03-sad/11-module-master-data.md` Section 8.1) that has no corresponding CRUD task in this Phase 1 list (Master Data scope was limited to the 6 entities other Phase 1 modules directly depend on). This is flagged as an open scope gap in task-051 rather than silently assumed away.
4. **Queue state machine detail for Skip/Start.** tasks 042-043 reference `docs/03-sad/14-module-queue.md` Section 23 ("Queue State Transition") for the exact transition rules rather than asserting a transition table, since the Use Case Matrix summary alone does not fully specify it.
5. **Doctor Schedule entity.** task-036 (Doctor Availability) notes that Phase 1 does not have a separate "Doctor Schedule" master-data task; whether schedule data lives on the Doctor entity (task-023) or a distinct `doctor_schedules` table must be confirmed against `docs/03-sad/13-module-reservation.md` Sections 15-16 before implementation.

---

## 2. Task List by Epic

### Epic J. Foundational Infrastructure

| Task ID | Task Name | Priority | File |
|---|---|---|---|
| task-003 | Initial Database Schema Migration (Phase 1 Entities) | P0 - Blocking (must complete first) | [task-003.md](./task-003.md) |
| task-004 | Environment & Secret Configuration | P0 - Blocking | [task-004.md](./task-004.md) |
| task-005 | Backend Application Scaffold (Express + Middleware Pipeline) | P0 - Blocking | [task-005.md](./task-005.md) |
| task-006 | Audit Trail Service (Cross-Cutting) | P0 - Blocking | [task-006.md](./task-006.md) |

### Epic A. Authentication & Authorization

| Task ID | Task Name | Priority | File |
|---|---|---|---|
| task-007 | Login (POST /api/v1/auth/login) | P0 - Blocking | [task-007.md](./task-007.md) |
| task-008 | Refresh Token (POST /api/v1/auth/refresh) | P0 - Blocking | [task-008.md](./task-008.md) |
| task-009 | Logout (POST /api/v1/auth/logout) | P1 - High | [task-009.md](./task-009.md) |
| task-010 | Change Password (POST /api/v1/auth/change-password) | P1 - High | [task-010.md](./task-010.md) |
| task-011 | Forgot Password (POST /api/v1/auth/forgot-password) | P2 - Medium | [task-011.md](./task-011.md) |
| task-012 | Reset Password (POST /api/v1/auth/reset-password) | P2 - Medium | [task-012.md](./task-012.md) |
| task-013 | Authentication Middleware (JWT + Session Verification) | P0 - Blocking | [task-013.md](./task-013.md) |
| task-014 | Authorization Middleware (RBAC Permission Check) | P0 - Blocking | [task-014.md](./task-014.md) |

### Epic B. User & Access Administration

| Task ID | Task Name | Priority | File |
|---|---|---|---|
| task-015 | User List & Create (GET/POST /system/users) | P0 - Blocking | [task-015.md](./task-015.md) |
| task-016 | User Detail, Update, Activate/Deactivate | P1 - High | [task-016.md](./task-016.md) |
| task-017 | Role List & Create (GET/POST /system/roles) | P0 - Blocking | [task-017.md](./task-017.md) |
| task-018 | Assign Permissions to Role (PATCH /system/roles/{roleId}/permissions) | P0 - Blocking | [task-018.md](./task-018.md) |
| task-019 | Assign Role to User (POST /system/users/{userId}/roles) | P0 - Blocking | [task-019.md](./task-019.md) |
| task-020 | Revoke User Sessions (POST /system/users/{userId}/revoke-sessions) | P2 - Medium | [task-020.md](./task-020.md) |

### Epic C. Master Data Foundation

| Task ID | Task Name | Priority | File |
|---|---|---|---|
| task-021 | Clinic Entity (CRUD) | P0 - Blocking | [task-021.md](./task-021.md) |
| task-022 | Branch Entity (CRUD) | P0 - Blocking | [task-022.md](./task-022.md) |
| task-023 | Doctor Entity (CRUD) | P0 - Blocking | [task-023.md](./task-023.md) |
| task-024 | Treatment Category Entity (CRUD) | P1 - High | [task-024.md](./task-024.md) |
| task-025 | Treatment Entity (CRUD) | P0 - Blocking | [task-025.md](./task-025.md) |
| task-026 | Payment Method Entity (CRUD) | P1 - High | [task-026.md](./task-026.md) |

### Epic D. Patient Management

| Task ID | Task Name | Priority | File |
|---|---|---|---|
| task-001 | Create Patient (CreatePatientUseCase) | P0 - Blocking | [task-001.md](./task-001.md) (Already implemented (see docs/06-tasks/task-001.md)) |
| task-027 | Patient List & Search (GET /patients) | P0 - Blocking | [task-027.md](./task-027.md) |
| task-028 | Patient Detail (GET /patients/{id}) | P1 - High | [task-028.md](./task-028.md) |
| task-029 | Update Patient (PUT /patients/{id}) | P1 - High | [task-029.md](./task-029.md) |
| task-030 | Archive / Restore Patient | P2 - Medium | [task-030.md](./task-030.md) |

> **Addendum (post-launch, Patient Module Enhancement):** task-284–289 extend this epic with 6 new capabilities — profile fields (insurance number, social media handles), patient photo, regional address (real Province/Regency/District/Village catalog, replacing the single free-text `address` column with a proper multi-address `patient_addresses` table), referral source tracking, emergency contacts, and Quick Add Patient (reduced-field registration from the Reservation booking screen). These are documented as a separate ad-hoc epic ("PE. Patient Module Enhancement") outside this phase's own numbering, not inserted here, since Phase 1 is already complete — see `docs/06-tasks/task-284.md`–`task-289.md` and `docs/03-sad/12-module-patient.md`'s corresponding updates.

### Epic E. Reservation Management

| Task ID | Task Name | Priority | File |
|---|---|---|---|
| task-002 | Create Reservation (CreateReservationUseCase) | P0 - Blocking | [task-002.md](./task-002.md) (Already implemented (see docs/06-tasks/task-002.md)) |
| task-031 | Reservation List & Search (GET /api/v1/reservations) | P0 - Blocking | [task-031.md](./task-031.md) |
| task-032 | Update Reservation (PUT /api/v1/reservations/{id}) | P1 - High | [task-032.md](./task-032.md) |
| task-033 | Reschedule Reservation (PATCH .../{id}/reschedule) | P1 - High | [task-033.md](./task-033.md) |
| task-034 | Cancel Reservation (PATCH .../{id}/cancel) | P1 - High | [task-034.md](./task-034.md) |
| task-035 | Check-In Patient (PATCH .../{id}/check-in) | P0 - Blocking | [task-035.md](./task-035.md) |
| task-036 | Doctor Availability & Time Slots | P0 - Blocking | [task-036.md](./task-036.md) |

### Epic F. Queue Management

| Task ID | Task Name | Priority | File |
|---|---|---|---|
| task-037 | Create Queue (POST /api/v1/queues) | P0 - Blocking | [task-037.md](./task-037.md) |
| task-038 | Queue List (GET /api/v1/queues) | P0 - Blocking | [task-038.md](./task-038.md) |
| task-039 | Queue Detail (GET /api/v1/queues/{id}) | P1 - High | [task-039.md](./task-039.md) |
| task-040 | Call Queue (PATCH .../{id}/call) | P0 - Blocking | [task-040.md](./task-040.md) |
| task-041 | Recall Queue (PATCH .../{id}/recall) | P2 - Medium | [task-041.md](./task-041.md) |
| task-042 | Skip Queue (PATCH .../{id}/skip) | P2 - Medium | [task-042.md](./task-042.md) |
| task-043 | Start Service (PATCH .../{id}/start) | P0 - Blocking | [task-043.md](./task-043.md) |
| task-044 | Complete Queue (PATCH .../{id}/complete) | P0 - Blocking | [task-044.md](./task-044.md) |
| task-045 | Cancel Queue (PATCH .../{id}/cancel) | P1 - High | [task-045.md](./task-045.md) |
| task-046 | Transfer Queue (PATCH .../{id}/transfer) | P2 - Medium | [task-046.md](./task-046.md) |
| task-047 | Queue Dashboard (GET /api/v1/queues/dashboard) | P1 - High | [task-047.md](./task-047.md) |

### Epic G. EMR Basic

| Task ID | Task Name | Priority | File |
|---|---|---|---|
| task-048 | Open Visit (EMR-001) | P0 - Blocking | [task-048.md](./task-048.md) |
| task-049 | Record Vital Sign (EMR-002) | P1 - High | [task-049.md](./task-049.md) |
| task-050 | Record SOAP Note (EMR-003) | P0 - Blocking | [task-050.md](./task-050.md) |
| task-051 | Record Diagnosis (EMR-007) | P0 - Blocking | [task-051.md](./task-051.md) |
| task-052 | Close Visit (EMR-015) | P0 - Blocking | [task-052.md](./task-052.md) |
| task-053 | Record Treatment Entry (basic, EMR-008/009 combined) | P0 - Blocking | [task-053.md](./task-053.md) |

### Epic H. Billing Basic

| Task ID | Task Name | Priority | File |
|---|---|---|---|
| task-054 | Generate Invoice from Completed Visit (POST /billing/invoices) | P0 - Blocking | [task-054.md](./task-054.md) |
| task-055 | Invoice List (GET /billing/invoices) | P1 - High | [task-055.md](./task-055.md) |
| task-056 | Invoice Detail (GET /billing/invoices/{id}) | P1 - High | [task-056.md](./task-056.md) |
| task-057 | Create Payment (POST /billing/payments) | P0 - Blocking | [task-057.md](./task-057.md) |
| task-058 | Close Invoice (POST /billing/invoices/{id}/close) | P1 - High | [task-058.md](./task-058.md) |

### Epic I. Dashboard (Simple)

| Task ID | Task Name | Priority | File |
|---|---|---|---|
| task-059 | Operations Dashboard (GET /reports/dashboards/operations, simplified) | P2 - Medium | [task-059.md](./task-059.md) |

---

## 3. Implementation Order

Tasks must be implemented in the following order to respect dependencies. Tasks within the same numbered group have no dependency on each other and **can run in parallel**.

1. **Foundation (sequential, blocking everything):** task-003, task-004 -> task-005, task-006
2. **Auth core (parallel within group, after group 1):** task-007 -> task-013 -> task-014; then task-008, task-009, task-010, task-011 -> task-012 in parallel
3. **User/Role Admin (parallel within group, after task-014):** task-015 -> task-016; task-017 -> task-018, task-019, task-020 in parallel
4. **Master Data (parallel within group, after task-014):** task-021 -> task-022 -> task-023; task-024 -> task-025; task-026 (all can overlap with group 3)
5. **Patient (parallel, after task-001 which pre-exists):** task-027, task-028, task-029, task-030
6. **Reservation (parallel, after task-002 which pre-exists, and after task-023 for task-036):** task-031, task-032, task-033, task-034, task-036 in parallel; task-035 requires task-031 AND task-037 (Queue) so it is a cross-epic sync point
7. **Queue (parallel, after task-037):** task-037 first (blocking), then task-038 through task-047 in parallel, except task-043 requires task-040, task-044 requires task-043
8. **EMR Basic (mostly sequential):** task-048 (after task-040) -> task-049, task-050 in parallel -> task-051 -> task-053 (after task-025) -> task-052 (after task-050, task-051, task-053)
9. **Billing Basic (sequential from EMR):** task-054 (after task-052, task-053) -> task-055, task-056 in parallel -> task-057 (after task-026) -> task-058
10. **Dashboard (last):** task-059 (after Queue, Reservation List, and Payment all exist)

**Critical path** (longest dependency chain, determines minimum Phase 1 duration): task-003 -> task-005 -> task-006 -> task-007 -> task-013 -> task-014 -> task-023 -> task-037 -> task-040 -> task-035/task-048 -> task-050 -> task-051 -> task-053 -> task-052 -> task-054 -> task-057 -> task-058 -> task-059.

---

## 4. Phase-Level Dependencies

- **Blocked By (Phase level):** Nothing -- Phase 1 is the first phase.
- **Required Before (Phase level):** Phase 2 (Core Clinical Operations) cannot begin until the full EMR/Billing critical path (tasks 048-058) is complete, since Phase 2 explicitly extends EMR (Odontogram, Prescription, Attachment) and Billing is assumed to already exist.
- **Can Run In Parallel (Phase level):** None -- Phase 2 depends on Phase 1's foundation per the roadmap's sequential phase structure (`docs/03-sad/26-roadmap.md` Section 3, Phase Overview table).

---

## 5. Phase 1 Definition of Done

Per `docs/03-sad/26-roadmap.md` Section 4 (Phase 1 Expected Outcomes: "Operasional tanpa pencatatan manual", "Seluruh transaksi terdokumentasi", "Pengurangan kesalahan administrasi") and the roadmap's Exit Criteria section, Phase 1 is done when:

- Every task in Section 2 above is implemented, unit/integration tested, and merged.
- The full critical path (Section 3) is demonstrably walkable end-to-end in a single manual test: create a user with the Registration Staff role -> register a patient -> book a reservation -> check in -> queue call -> doctor opens visit -> records SOAP/diagnosis/treatment -> closes visit -> invoice auto-generates -> cashier takes payment -> invoice closes -> dashboard reflects the transaction.
- No task has an open, unresolved ambiguity flag from Section 1 above without an explicit decision recorded.
- Every write operation across every module produces an Audit Trail entry (task-006 consumed correctly by all Create/Update/Delete tasks).
- RBAC is enforced end-to-end: a user without the correct permission cannot invoke any protected endpoint (task-013/task-014 correctly applied to every route).

## 6. Phase 1 Acceptance Criteria

- All Primary Goals from `docs/03-sad/26-roadmap.md` Section 4 are met: Registrasi pasien, Reservasi, Queue Management, EMR dasar, Billing dasar, Pembayaran, Dashboard sederhana.
- All Included Modules are present and functioning: Authentication, User Management, Master Data, Patient, Reservation, Queue, EMR, Billing, Dashboard.
- The system passes the E2E critical-path test in `docs/05-testing/e2e-tests.md` Section 1 (Primary Critical Flow) using only Phase 1 modules/data.
- No task's implementation violates any rule in `docs/04-ai-contract/` (Priority 1 per `CLAUDE.md`).
