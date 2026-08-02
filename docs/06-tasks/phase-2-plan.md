# Phase 2 Implementation Plan -- Core Clinical Operations

> Source: `docs/03-sad/26-roadmap.md` Section 5 ("Phase 2 -- Core Clinical Operations", lines 1218-1252). Scope: Appointment Management, Digital Medical Record lengkap, Treatment Planning, Prescription Management, Odontogram, Clinical Attachment, Laboratory Request, Radiology Request, Consent Management. Read in the required order: `docs/04-ai-contract/` -> `docs/01-prd/` -> `docs/03-sad/` -> `docs/02-design/` -> `docs/03-sad/26-roadmap.md`.

This document is the Phase 2 index: Task List, Dependencies, Implementation Order, Definition of Done, and Acceptance Criteria at the Phase level. Each individual task has its own full specification file (`docs/06-tasks/task-0XX.md`) following the same template established in Phase 1 (`docs/06-tasks/phase-1-plan.md`).

Phase 2 builds entirely on top of Phase 1's Foundation (Authentication, RBAC, Patient, Reservation, Queue, basic EMR, basic Billing) -- no Phase 2 task duplicates Phase 1 infrastructure; every task below either extends an existing Phase 1 entity/workflow or adds a new EMR sub-feature that Phase 1 explicitly deferred.

---

## 1. Ambiguities / Gaps Reported (per "If the roadmap is ambiguous, report the ambiguity")

1. **'Appointment Management' has little genuinely new SAD content for Phase 2.** docs/03-sad/13-module-reservation.md's full Booking/Walk-in/Check-in/Reschedule/Cancel workflow was already built in Phase 1. The only new material found is the Analytics/KPI section (task-060). 'Appointment Reminder' is explicitly listed under Section 28.4 as a **Future** capability in the source document, not current scope -- it is intentionally not built in Phase 2.
2. **'Laboratory Request' has no dedicated module in the SAD.** No Laboratory Order/Result Management module exists anywhere in `docs/03-sad/`. The only Laboratory-related content is a referral target in `docs/03-sad/15-module-emr.md` Section 26 (Referral & Follow Up). task-089 implements the Referral mechanism; a full lab-integration module is not invented.
3. **'Radiology Request' maps to the general Attachment module, not a dedicated DICOM/PACS system.** `docs/03-sad/15-module-emr.md` Part 3.3B (Dental X-Ray Module, DICOM & PACS Integration, lines 6732-7352) describes a very deep imaging-infrastructure design (DICOM standard, PACS integration, AI-imaging readiness) that reads as enterprise/future-phase depth rather than Phase 2 MVP-clinical-operations scope. Phase 2 implements X-Ray handling via the general Clinical Attachment module (task-078, category=X-Ray) rather than building full DICOM/PACS/AI infrastructure, which is flagged as likely belonging to a later phase (not explicitly assigned to any phase in the roadmap, so this should be confirmed with the Solution Architect before Phase 3+ planning).
4. **Endpoint paths for most EMR sub-features are not literally given in the SAD.** Only Periodontal Assessment (7 endpoints), Clinical Attachment (7 endpoints), and Clinical Timeline (4 endpoints) have literal REST paths in `docs/03-sad/15-module-emr.md`. Odontogram, Prescription, Treatment Plan, Consent, Medical Certificate, and Referral/Follow-Up tasks derive their endpoint paths from the documented URL convention (`docs/04-ai-contract/04-api-contract.md`) -- flagged individually in each affected task file.
5. **Prescription-Allergy enforcement (block vs. override) is not fully specified.** `docs/03-sad/15-module-emr.md` Section 24 states a prescription "harus divalidasi terhadap Allergy" (must be validated against Allergy) but does not specify whether a conflict hard-blocks the prescription or allows an overridable warning. task-065 flags this and requires confirmation before implementation.
6. **Medicine master data is out of both Phase 1 and Phase 2 scope**, but task-065 (Create Prescription) depends on a Medicine reference list existing. This is flagged as a cross-phase scope gap in task-065's Required Existing Code section, since Medicine master data belongs to the Warehouse module (`docs/03-sad/18-module-warehouse.md`), not EMR.
7. **Consent-as-hard-gate for procedures is not explicitly confirmed.** task-086's Workflow Impact notes that whether a Treatment recording (Phase 1 task-053) should be technically blocked without a signed Consent (vs. a soft reminder) needs to be confirmed against the full `docs/03-sad/15-module-emr.md` Part 3.3D before implementation.

---

## 2. Task List by Epic

### Epic K. Appointment Management

| Task ID | Task Name | Priority | File |
|---|---|---|---|
| task-060 | Reservation Analytics & KPI Dashboard | P2 - Medium | [task-060.md](./task-060.md) |

### Epic L. Complete Digital Medical Record

| Task ID | Task Name | Priority | File |
|---|---|---|---|
| task-061 | Record Medical History (EMR-004) | P1 - High | [task-061.md](./task-061.md) |
| task-062 | Record Allergy (EMR-005) | P0 - Blocking | [task-062.md](./task-062.md) |

### Epic M. Treatment Planning

| Task ID | Task Name | Priority | File |
|---|---|---|---|
| task-063 | Create Treatment Plan (multi-visit) | P1 - High | [task-063.md](./task-063.md) |
| task-064 | Convert Treatment Plan Item to Reservation | P2 - Medium | [task-064.md](./task-064.md) |

### Epic N. Prescription Management

| Task ID | Task Name | Priority | File |
|---|---|---|---|
| task-065 | Create Prescription (with Allergy Validation) | P0 - Blocking | [task-065.md](./task-065.md) |
| task-066 | Prescription History & Print | P2 - Medium | [task-066.md](./task-066.md) |

### Epic O. Interactive Odontogram

| Task ID | Task Name | Priority | File |
|---|---|---|---|
| task-067 | Tooth Condition Reference Data (CRUD) | P0 - Blocking | [task-067.md](./task-067.md) |
| task-068 | Record / Update Tooth Condition (Odontogram Entry) | P0 - Blocking | [task-068.md](./task-068.md) |
| task-069 | Get Current Odontogram State | P1 - High | [task-069.md](./task-069.md) |
| task-070 | Odontogram History (Per-Tooth Timeline) | P2 - Medium | [task-070.md](./task-070.md) |

### Epic P. Periodontal Assessment

| Task ID | Task Name | Priority | File |
|---|---|---|---|
| task-071 | Create Periodontal Assessment | P1 - High | [task-071.md](./task-071.md) |
| task-072 | Add Periodontal Measurement | P1 - High | [task-072.md](./task-072.md) |
| task-073 | Update Periodontal Measurement | P2 - Medium | [task-073.md](./task-073.md) |
| task-074 | Delete Periodontal Measurement | P2 - Medium | [task-074.md](./task-074.md) |
| task-075 | Get Periodontal Assessment | P1 - High | [task-075.md](./task-075.md) |
| task-076 | Get Periodontal Assessment History | P2 - Medium | [task-076.md](./task-076.md) |
| task-077 | Lock Periodontal Assessment | P1 - High | [task-077.md](./task-077.md) |

### Epic Q. Clinical Attachment

| Task ID | Task Name | Priority | File |
|---|---|---|---|
| task-078 | Upload Attachment | P0 - Blocking | [task-078.md](./task-078.md) |
| task-079 | Get Attachment Detail | P1 - High | [task-079.md](./task-079.md) |
| task-080 | Download Attachment | P0 - Blocking | [task-080.md](./task-080.md) |
| task-081 | Annotate Attachment | P2 - Medium | [task-081.md](./task-081.md) |
| task-082 | List Visit Attachments | P1 - High | [task-082.md](./task-082.md) |
| task-083 | Archive Attachment | P2 - Medium | [task-083.md](./task-083.md) |
| task-084 | Restore Attachment Version | P2 - Medium | [task-084.md](./task-084.md) |

### Epic R. Consent Management

| Task ID | Task Name | Priority | File |
|---|---|---|---|
| task-085 | Consent Category Reference Data | P1 - High | [task-085.md](./task-085.md) |
| task-086 | Create & Sign Consent | P0 - Blocking | [task-086.md](./task-086.md) |
| task-087 | Get Consent / Consent History | P1 - High | [task-087.md](./task-087.md) |

### Epic S. Medical Certificate

| Task ID | Task Name | Priority | File |
|---|---|---|---|
| task-088 | Issue Medical Certificate | P2 - Medium | [task-088.md](./task-088.md) |

### Epic T. Referral & Follow Up

| Task ID | Task Name | Priority | File |
|---|---|---|---|
| task-089 | Create Referral (incl. Laboratory / Radiology Referral) | P1 - High | [task-089.md](./task-089.md) |
| task-090 | Create Follow Up (with Auto-Reservation) | P2 - Medium | [task-090.md](./task-090.md) |

### Epic U. Clinical Timeline

| Task ID | Task Name | Priority | File |
|---|---|---|---|
| task-091 | Patient Clinical Timeline | P1 - High | [task-091.md](./task-091.md) |
| task-092 | Timeline Summary | P2 - Medium | [task-092.md](./task-092.md) |
| task-093 | Timeline Events (Filtered) | P2 - Medium | [task-093.md](./task-093.md) |
| task-094 | Timeline Attachments (Filtered) | P2 - Medium | [task-094.md](./task-094.md) |

---

## 3. Implementation Order

All Phase 2 tasks assume the full Phase 1 backlog (`docs/06-tasks/phase-1-plan.md`, task-001 through task-059) is already complete. Tasks within the same numbered group have no dependency on each other and **can run in parallel**.

1. **Patient Safety Prerequisites (do first, blocking):** task-061, task-062 (Medical History, Allergy) in parallel -- task-062 specifically blocks Prescription.
2. **Odontogram Foundation (sequential):** task-067 (Tooth Condition reference) -> task-068 (Record Tooth Condition) -> task-069, task-070 (Get State, History) in parallel.
3. **Treatment Planning (sequential):** task-063 -> task-064.
4. **Prescription (sequential, after task-062):** task-065 -> task-066.
5. **Periodontal Assessment (mostly parallel after task-071):** task-071 -> task-072 -> task-073, task-074 in parallel; task-075, task-076, task-077 in parallel after task-071/072.
6. **Clinical Attachment (mostly parallel after task-078):** task-078 -> task-079, task-080, task-081, task-082, task-083, task-084 in parallel.
7. **Consent Management (sequential, needs Attachment):** task-085 -> task-086 (needs task-078) -> task-087.
8. **Medical Certificate (needs Attachment):** task-088 (after task-078).
9. **Referral & Follow Up (parallel, needs Reservation from Phase 1):** task-089, task-090 in parallel.
10. **Appointment Analytics (independent, can run any time):** task-060.
11. **Clinical Timeline (last -- aggregates almost everything above):** task-091 -> task-092, task-093, task-094 in parallel.

**Critical path** (longest dependency chain): task-062 (Allergy) -> task-065 (Prescription) -> ... in parallel with task-067 -> task-068 -> task-078 (Attachment, needed by Consent/Certificate) -> task-085 -> task-086 -> task-087, and separately task-089/task-090 -> **task-091 (Clinical Timeline) is the final synchronization point**, since it depends on nearly every other Phase 2 task plus Phase 1 task-050/task-053.

---

## 4. Phase-Level Dependencies

- **Blocked By (Phase level):** Phase 1 (Foundation/MVP) must be fully complete -- every Phase 2 EMR task extends Phase 1's Visit/EMR entities (task-048 through task-053), and task-060/task-064/task-090 extend Phase 1's Reservation module (task-002, task-031 through task-036).
- **Required Before (Phase level):** Phase 3 (Operational Excellence) is not detailed in this document (out of scope per this turn's instruction to stop after Phase 2), but per the roadmap's sequential structure, Phase 3 should not begin until Phase 2's clinical documentation completeness goals are met.
- **Can Run In Parallel (Phase level):** None at the phase level -- Phase 2 depends on Phase 1's foundation per `docs/03-sad/26-roadmap.md` Section 3 (Phase Overview table, sequential phases).

---

## 5. Phase 2 Definition of Done

Per `docs/03-sad/26-roadmap.md` Section 5 (Business Improvements: "Workflow klinis lebih terstruktur", "Dokumentasi medis lebih lengkap", "Pelacakan tindakan pasien"; Target: "Meningkatkan kualitas pelayanan dan dokumentasi klinis"), Phase 2 is done when:

- Every task in Section 2 above is implemented, unit/integration tested, and merged.
- A Doctor can, within a single Visit: review the patient's Clinical Timeline (task-091) and active Medical History/Allergy alerts (task-061/062) on open, record findings on the Interactive Odontogram (task-068), create a multi-visit Treatment Plan (task-063) and convert an item to a Reservation (task-064), prescribe medicine with Allergy validation (task-065), perform and lock a Periodontal Assessment (task-071 through task-077), upload and annotate clinical Attachments including X-Rays (task-078 through task-084), capture a signed Consent (task-085/086), issue a Medical Certificate (task-088), and create a Referral or Follow-Up (task-089/090).
- No task has an open, unresolved ambiguity flag from Section 1 above without an explicit decision recorded (especially #5 Prescription-Allergy enforcement and #7 Consent-as-gate, both of which are patient-safety/legal-risk items).
- Every write operation produces an Audit Trail entry (Phase 1 task-006 consumed correctly by all new Use Cases).
- RBAC is enforced end-to-end for every new endpoint (Phase 1 task-013/task-014 correctly applied).

## 6. Phase 2 Acceptance Criteria

- All 9 New Capabilities from `docs/03-sad/26-roadmap.md` Section 5 are addressed: Appointment Management (task-060, with the Reminder gap explicitly reported), Digital Medical Record lengkap (task-061/062/091), Treatment Planning (task-063/064), Prescription Management (task-065/066), Odontogram (task-067 through task-070), Clinical Attachment (task-078 through task-084), Laboratory Request (task-089, reported as referral-only), Radiology Request (task-078 X-Ray category, reported as attachment-based rather than DICOM/PACS), Consent Management (task-085 through task-087).
- The system passes an extended E2E test (to be added to `docs/05-testing/e2e-tests.md`) covering: Open Visit -> review Timeline/Alerts -> record Odontogram finding -> create Treatment Plan -> prescribe (with an intentional allergy-conflict test case) -> capture signed Consent -> Close Visit, without any step silently bypassing a documented business rule.
- No task's implementation violates any rule in `docs/04-ai-contract/` (Priority 1 per `CLAUDE.md`).
- Every reported ambiguity in Section 1 has either been resolved with an explicit Solution Architect decision, or the corresponding feature is shipped in its documented-safe reduced form (e.g. Referral instead of full Lab integration) with that reduction visible in the release notes, not hidden.
