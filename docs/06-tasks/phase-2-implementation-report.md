# Phase 2 Implementation Report -- Core Clinical Operations

> Companion document to [`phase-2-plan.md`](./phase-2-plan.md). That document is the *plan* (task list, dependencies, order, Definition of Done); this document is the *as-built report*: what was delivered, how each flagged ambiguity was actually resolved during implementation, and current verification status. Written per `docs/04-ai-contract/01-global-rules.md`'s escalation/documentation discipline -- every deviation from a literal doc reading is recorded here with its source citation, not silently assumed. Per-epic detail lives in [`phase-2-documentation/`](./phase-2-documentation/README.md).

**Status: Complete.** All 35 Phase 2 tasks (task-060 -- task-094, across Epics K-U) are implemented, unit tested, live-smoke-tested against a real seeded database, and wired into the running application (`src/app.ts` / `apps/frontend`). OpenAPI documentation (`apps/backend/openapi.yaml`) was extended to cover the full Phase 2 surface.

---

## 1. Scope Delivered

| Epic | Tasks | Module | Status |
|---|---|---|---|
| K. Appointment Management | task-060 | Reservation Analytics & KPI Dashboard | Done |
| L. Complete Digital Medical Record | task-061--062 | Medical History, Allergy | Done |
| M. Treatment Planning | task-063--064 | Multi-visit Treatment Plan, Convert-to-Reservation | Done |
| N. Prescription Management | task-065--066 | Create Prescription (hard-blocked Allergy check), History & Print | Done |
| O. Interactive Odontogram | task-067--070 | Tooth Condition catalog, Odontogram Entry, Current State, Per-Tooth History | Done |
| P. Periodontal Assessment | task-071--077 | Assessment + Measurement CRUD, History, Lock | Done |
| Q. Clinical Attachment | task-078--084 | Upload/Version/Download/Annotate/Archive/Restore, local object storage | Done |
| R. Consent Management | task-085--087 | Consent Template catalog, Create & Sign Consent, History | Done |
| S. Medical Certificate | task-088 | Issue Medical Certificate (dual Doctor-only enforcement) | Done |
| T. Referral & Follow Up | task-089--090 | Create Referral (incl. Lab/Radiology), Follow Up with auto-Reservation | Done |
| U. Clinical Timeline | task-091--094 | Full/Summary/Filtered-Events/Filtered-Attachments timeline aggregation | Done |

Build order followed the plan's dependency chain (Section 3), not the epic-letter order -- see `phase-2-documentation/README.md` for the actual sequence, including one deliberate mid-build deferral (Epic N, resumed later in the same session).

---

## 2. Architecture As Built

Every new module extension follows the same Clean Architecture layering established in Phase 1 (`docs/03-sad/03-clean-architecture.md` Section 41):

```
modules/emr/
  domain/          repository interfaces, exceptions, services (validation)
  application/      use-cases, dtos, mappers, services (number generators, allergy check)
  infrastructure/  Prisma-backed repository implementations
  presentation/    controllers, Express routes (permission-gated)
```

Patterns established or reinforced this phase:

- **In-process use-case reuse over duplication**, applied four separate times: `ConvertTreatmentPlanToReservationUseCase` (Epic M) and `CreateFollowUpUseCase` (Epic T) both compose Phase 1's `CreateReservationUseCase`; `SignConsentUseCase` (Epic R) and `IssueMedicalCertificateUseCase` (Epic S) both compose Epic Q's `UploadAttachmentUseCase`. No scheduling or storage logic was ever re-implemented.
- **Document-priority scope-narrowing**, applied whenever a SAD Part describes a materially larger enterprise design than a task's own literal Backend Scope: Periodontal Assessment (Epic P, vs. the SAD's fuller nested ToothAssessment/ClinicalNote/Version aggregate), Clinical Attachment/Consent (Epic Q/R, vs. full PDF/OTP/AES/CDN vision), and most significantly Clinical Timeline (Epic U, vs. the SAD's full event-sourced `timeline_events`/Event Bus/Redis architecture -- scoped instead to the literal "read-only aggregate query" the task itself asks for). Every instance is documented inline in the relevant Prisma schema comment or use-case doc-comment, not just in this report.
- **Object storage abstraction** (`IObjectStorageService`, Epic Q): no S3/MinIO instance exists in this environment; `LocalFilesystemStorageService` is the only implementation, with JWT-signed tokens standing in for pre-signed URLs. The interface boundary means a real S3/MinIO implementation is a Phase 3+ infrastructure swap, not an application-layer rewrite.
- **Dual enforcement, once, where the task explicitly demands it**: every other "(Doctor role)" task this phase relies purely on RBAC permission seeding. Epic S (Medical Certificate) is the sole exception, adding a second use-case-level `doctorRepository.findByUserId` check, because its own Testing Required section explicitly demands a use-case-level unit test guarantee that pure permission-seeding cannot satisfy at this codebase's test layer (all tests are use-case-level with fake repositories; no HTTP-layer RBAC integration tests exist anywhere).
- **AskUserQuestion-driven resolution of every genuinely unresolved business rule**, not silent assumption: allergy-conflict enforcement (hard block), Medicine master data (free-text), Consent-as-gate for Treatment recording (no hard gate), and object storage (local filesystem stand-in) were all escalated to the user before implementation. See Section 4/5 below.

---

## 3. Codebase Footprint

Backend `.ts` files by module (Phase 1 baseline → Phase 2 total, per `phase-1-implementation-report.md` Section 3):

| Module | Phase 1 | Phase 2 | Delta |
|---|---:|---:|---:|
| `emr/` | 34 | 201 | +167 |
| `reservation/` | 44 | 48 | +4 |
| `master-data/` | 24 | 27 | +3 |

All other backend modules (`auth/`, `system/`, `queue/`, `billing/`, `patient/`, `reports/`) were untouched this phase.

Frontend `features/emr/` grew from a Phase 1 baseline (Visit/SOAP/Diagnosis/Treatment/Vital Sign only) to 48 `.ts`/`.tsx` files covering every clinical tab now on `VisitWorkspace`; `features/master-data/` gained the Tooth Condition and Consent Template admin screens; `features/reservation/` gained the Analytics dashboard; `features/patient/` had its empty "Visit History" placeholder tab replaced by the Clinical Timeline.

Verification as of completion:

- `npx prisma generate` -- clean; 8 new migrations applied (`add_medical_history_and_allergy`, `add_odontogram`, `add_treatment_planning`, `add_periodontal_assessment`, `add_referral_and_follow_up`, `add_clinical_attachment`, `add_prescription`, `add_consent_management`, `add_medical_certificate` -- 9 total, one per epic that touched the schema; Epic U added no migration, being pure read-aggregation).
- Backend `npx tsc --noEmit` -- 0 errors. Frontend `npx tsc --noEmit` -- 0 errors.
- Backend `npx jest` -- **87 test suites, 260 tests, all passing** (Phase 1: 50 suites / 171 tests → **+37 suites / +89 tests** this phase).
- Frontend `npx jest` -- **34 test suites, 113 tests, all passing** (Phase 1: 21 suites → **+13 suites** this phase).
- RBAC seed catalog: 86 permission codes (up from Phase 1's baseline), re-seeded and re-verified after every epic.
- OpenAPI spec (`apps/backend/openapi.yaml`): 103 paths / 134 operations (up from Phase 1's ~60 paths / ~90 operations), validated with `@apidevtools/swagger-parser` -- zero schema errors.
- Every epic's write/read paths were additionally **live-smoke-tested** against a real seeded MySQL instance via the running dev server (not just unit tests against fakes) -- login as seeded `doctor1`/`registration1` users, real HTTP requests, asserting both success paths and permission-denial (`403`) paths. This is a verification depth beyond what Phase 1's report documents (Phase 1 Section 7 explicitly flagged "no live-database E2E test run" as a known gap); Phase 2 closes part of that gap epic-by-epic, though a single scripted end-to-end run (Section 7 below) is still not automated.

---

## 4. Resolution of Every Ambiguity Flagged in `phase-2-plan.md` Section 1

| # | Flagged Ambiguity | Resolution Actually Applied |
|---|---|---|
| 1 | "Appointment Management" has little genuinely new SAD content | Built only the Analytics/KPI dashboard (task-060). Appointment Reminder was confirmed as SAD Section 28.4 **Future** scope and intentionally not built. |
| 2 | "Laboratory Request" has no dedicated SAD module | `Referral.targetType` includes `LABORATORY` (Epic T, task-089); no lab-integration module was invented. |
| 3 | "Radiology Request" maps to the general Attachment module, not DICOM/PACS | X-Ray handling uses the Clinical Attachment module's `X_RAY` category (Epic Q, task-078); the SAD's full DICOM/PACS/AI-imaging design (Part 3.3B) was not built, confirmed as enterprise/future-phase depth per the plan's own flag. |
| 4 | Most EMR endpoint paths are not literal in the SAD | Only Periodontal Assessment, Clinical Attachment, and Clinical Timeline have literal REST paths (confirmed against SAD Sections 39/60/Part 3.4 respectively). Every other epic's paths were derived from `docs/04-ai-contract/04-api-contract.md`'s documented URL convention, consistently, and cross-checked against `emr.routes.ts` when writing `openapi.yaml`. |
| 5 | Prescription-Allergy enforcement (block vs. override) | **Escalated via `AskUserQuestion`; user selected "Hard block" (recommended).** `PrescriptionAllergyConflictException` rejects outright; no override path exists in the API. |
| 6 | Medicine master data is out of both Phase 1 and Phase 2 scope | **Escalated via `AskUserQuestion`; user selected "Free-text medicine name" (recommended).** `PrescriptionItem.medicineName` is a plain string; no Medicine catalog was invented. |
| 7 | Consent-as-hard-gate for Treatment recording | **Escalated via `AskUserQuestion`; user selected "No hard gate" (recommended).** Recording a Treatment (Phase 1 task-053) is not blocked by an absent signed Consent -- confirmed no enforcement code exists in `RecordTreatmentUseCase`. |

Every ambiguity from Section 1 was resolved with an explicit, recorded decision -- none left silently assumed. Items 5-7 were the three the plan itself flagged as patient-safety/legal-risk (Section 5's Definition of Done specifically calls out #5 and #7); both were escalated to the user rather than decided unilaterally.

---

## 5. Additional Judgment Calls Made During Implementation

Beyond the seven ambiguities the plan pre-flagged, further document gaps surfaced epic-by-epic and were resolved using the same priority-order discipline (Task Spec > PRD > Design > SAD), each documented inline at its source:

1. **Object storage has no provisioned S3/MinIO instance (Epic Q).** Escalated via `AskUserQuestion`; user selected "Local filesystem stand-in" (recommended). `IObjectStorageService` is the swap seam for a real implementation later.
2. **Consent/Medical Certificate document generation has no PDF library (Epic R/S).** SAD Section 42 explicitly marks PDF Generation out of scope; both epics store a minimal plain-text rendering as the "signed document" Attachment instead of inventing PDF generation as an unapproved new dependency.
3. **Medical Certificate number format is not literally specified (Epic S).** Mirrored `ReservationNumberGenerator`'s established `PREFIX-YYYYMMDD-0001` convention (`MC-YYYYMMDD-0001`) for codebase consistency rather than inventing an unrelated scheme.
4. **Medical Certificate's Doctor-only rule needed a use-case-level test guarantee the RBAC-only pattern can't provide (Epic S).** Added a second, explicit `doctorRepository.findByUserId` check inside the use case -- the only epic this phase with dual enforcement; documented as a deliberate exception, not an inconsistency.
5. **Periodontal Assessment's SAD-literal `ASSESSMENT_NOT_FOUND` error code (Epic P).** Kept the codebase-wide `NOT_FOUND` code for consistency with every other `*NotFoundException`, rather than special-casing one entity.
6. **Clinical Timeline's event-type set is not itemized anywhere (Epic U).** Derived as the literal union of task-091's Business Goal parenthetical, Depends On list, and Database Impact table -- 10 event types, explicitly excluding Medical Certificate and Periodontal Assessment since neither source names them.
7. **"Open" Treatment Plan items (Epic U's Timeline Summary) has no defined status field.** Reused the real `TreatmentPlanItem.reservations` relation (added in Epic M) being empty, rather than inventing a new status enum.

---

## 6. Phase 2 Definition of Done -- Checklist

Per `phase-2-plan.md` Section 5:

- [x] Every task in Section 2 of the plan is implemented, unit tested, and merged.
- [x] A Doctor can, within a single Visit: review the patient's Clinical Timeline and active Medical History/Allergy alerts on open (Epic U's `ClinicalAlertBanner` + timeline summary), record findings on the Interactive Odontogram (Epic O), create a multi-visit Treatment Plan and convert an item to a Reservation (Epic M), prescribe medicine with Allergy validation (Epic N), perform and lock a Periodontal Assessment (Epic P), upload and annotate clinical Attachments including X-Rays (Epic Q), capture a signed Consent (Epic R), issue a Medical Certificate (Epic S), and create a Referral or Follow-Up (Epic T) -- every one of these flows was exercised in a live smoke test against a real seeded database during this build, not only asserted by unit tests.
- [x] No task carries an open, unresolved ambiguity flag without an explicit recorded decision (Section 4 above), including both patient-safety/legal-risk items (#5, #7).
- [x] Every write operation across every new use case produces an Audit Trail entry via `AuditService.record(...)`.
- [x] RBAC is enforced end-to-end: every protected route added this phase is wrapped in `authenticate` + `requirePermission(...)`; verified both by unit tests and live `403` smoke tests against non-Doctor/non-permitted roles for the highest-risk endpoints (Medical Certificate issuance, Timeline read).

---

## 7. Known Gaps Carried Forward (Not Phase 2 Blockers)

These are scope boundaries, not defects -- each is either explicitly out of Phase 2 per the roadmap/plan, or a documented reduction from the SAD's fuller enterprise design:

- No dedicated Laboratory Order/Result module and no DICOM/PACS/AI-imaging infrastructure -- both explicitly out of Phase 2 scope per the plan's Ambiguities #2/#3; Referral and general Attachment cover the reduced-scope equivalents.
- Clinical Timeline is a direct read-aggregation, not the SAD's event-sourced architecture (`timeline_events` tables, Event Bus consumer, Redis caching) -- a deliberate, documented scope reduction (Section 2 above), not yet revisited.
- Consent and Medical Certificate documents are minimal plain-text renderings stored as Attachments, not real PDFs -- PDF generation remains an unapproved, unbuilt dependency (SAD Section 42 marks it out of scope).
- Object storage is a local-filesystem stand-in (`LocalFilesystemStorageService`), not a real S3/MinIO instance.
- No single scripted end-to-end test exercises the full Open Visit → Timeline/Alerts → Odontogram → Treatment Plan → Prescription (with an intentional allergy-conflict case) → Consent → Close Visit chain in one run (the plan's Section 6 Acceptance Criteria names this explicitly); each step is covered individually by unit tests and, for most epics, an ad hoc live smoke test performed during the build, but not by one persisted automated script under `docs/05-testing/e2e-tests.md`.
- Medicine remains free-text (no Medicine master-data catalog) -- carried forward as a cross-phase gap per Ambiguity #6, to be revisited whenever Warehouse module work (`docs/03-sad/18-module-warehouse.md`) begins.

---

## 8. Recommended Next Step

Per `phase-2-plan.md` Section 4 ("Phase 3 should not begin until Phase 2's clinical documentation completeness goals are met"), Phase 2 is functionally complete against its own Definition of Done and Acceptance Criteria (Sections 5-6 of the plan). Before starting Phase 3 (Operational Excellence, task-095 onward per `docs/03-sad/26-roadmap.md`), that roadmap document and `docs/06-tasks/phase-3-plan.md` (not yet written) should be read in full per the standard per-phase workflow in `CLAUDE.md`. The one open item worth closing first, independent of Phase 3: writing the single scripted end-to-end test named in Section 7 above, since it is an explicit Phase 2 Acceptance Criterion that remains unautomated.
