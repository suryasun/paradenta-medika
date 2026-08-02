# Phase 1 Implementation Report -- Foundation (MVP)

> Companion document to [`phase-1-plan.md`](./phase-1-plan.md). That document is the *plan* (task list, dependencies, order, Definition of Done); this document is the *as-built report*: what was delivered, how each flagged ambiguity was actually resolved during implementation, and current verification status. Written per `docs/04-ai-contract/01-global-rules.md`'s escalation/documentation discipline -- every deviation from a literal doc reading is recorded here with its source citation, not silently assumed.

**Status: Complete.** All 59 Phase 1 tasks (task-001 -- task-059, across Epics J, A-I) are implemented, unit/integration tested, and wired into the running application (`src/app.ts`).

---

## 1. Scope Delivered

| Epic | Tasks | Module | Status |
|---|---|---|---|
| J. Foundational Infrastructure | task-003--006 | DB schema, config, Express scaffold, Audit Trail service | Done |
| A. Authentication & Authorization | task-007--014 | Login/Refresh/Logout/Password flows, JWT + RBAC middleware | Done |
| B. User & Access Administration | task-015--020 | User/Role CRUD, permission assignment, session revocation | Done |
| C. Master Data Foundation | task-021--026 | Clinic, Branch, Doctor, Treatment Category, Treatment, Payment Method | Done |
| D. Patient Management | task-001, 027--030 | Create/List/Detail/Update/Archive Patient | Done |
| E. Reservation Management | task-002, 031--036 | Create/List/Update/Reschedule/Cancel/Check-In, Doctor Availability | Done |
| F. Queue Management | task-037--047 | Full Queue lifecycle (Create -> Call -> Start -> Complete, Skip/Recall/Cancel/Transfer) + Dashboard | Done |
| G. EMR Basic | task-048--053 | Open/Close Visit, Vital Sign, SOAP Note, Diagnosis, Treatment Entry | Done |
| H. Billing Basic | task-054--058 | Auto Invoice Generation, Invoice List/Detail, Payment (multi-line), Close Invoice | Done |
| I. Dashboard (Simple) | task-059 | Operations Dashboard (reservation/queue/collection metrics) | Done |

task-001 and task-002 were re-implemented from scratch under this workflow rather than trusted as pre-existing, per the explicit decision made at the start of this build (`phase-1-plan.md`'s "already implemented" marker was not backed by actual source code in the repository).

---

## 2. Architecture As Built

Every module follows the Clean Architecture layering mandated by `docs/03-sad/03-clean-architecture.md` Section 41 (Patient Module Golden Reference):

```
modules/<name>/
  domain/          entities (where applicable), repository interfaces, exceptions, events
  application/      use-cases, dtos, mappers, services (number generators, validators)
  infrastructure/  Prisma-backed repository implementations
  presentation/    controllers, Express routes (permission-gated)
```

Cross-module communication uses the in-process `InMemoryEventBus` (`shared/events/EventBus.ts`) exclusively -- no module reaches into another module's database directly. Established event seams:

| Event | Publisher | Subscriber | Purpose |
|---|---|---|---|
| `PatientCheckedIn` | Reservation (`CheckInPatientUseCase`) | Queue | Auto-create Queue entry on check-in |
| `EMRFinished` | EMR (`CloseVisitUseCase`) | Billing | Auto-generate Invoice on Visit close |
| `PaymentCompleted` | Billing (`CreatePaymentUseCase`) | *(none yet -- Finance is Phase 3)* | Forward-compatible event contract, honored per task-057 even though no Phase 1 consumer exists |

Read-side repository interfaces are reused directly across module boundaries where a task's own scope requires it (e.g. Billing's `GenerateInvoiceUseCase` reads EMR's `IVisitRepository`/`IVisitTreatmentRepository` and Master Data's `ITreatmentRepository`; the Operations Dashboard reads Reservation, Queue, Billing, and Master Data repositories). This is the same pattern already established in Epic F (Queue importing Patient/Doctor repositories) -- it is not a database-bypass violation of `docs/04-ai-contract/07-module-contract.md`, since every access still goes through the owning module's Prisma-backed repository interface, never a raw cross-module query.

Every mutating use case calls `AuditService.record(...)`; audit write failures are caught and logged without blocking the business transaction (established in Epic J, exercised throughout).

---

## 3. Codebase Footprint

| Module | `.ts` files |
|---|---:|
| `reservation/` | 44 |
| `system/` | 41 |
| `queue/` | 38 |
| `emr/` | 34 |
| `auth/` | 36 |
| `billing/` | 24 |
| `master-data/` | 24 |
| `patient/` | 23 |
| `reports/` | 6 |

Verification as of completion:

- `npx prisma generate` -- clean.
- `npx tsc -p tsconfig.json --noEmit` -- 0 errors.
- `npx jest --runInBand` -- **50 test suites, 171 tests, all passing** (in-memory fake repositories per module, no live database required for the test run; `tests/fakes/*.ts` implement the same domain repository interfaces as the real Prisma-backed ones).

---

## 4. Resolution of Every Ambiguity Flagged in `phase-1-plan.md` Section 1

| # | Flagged Ambiguity | Resolution Actually Applied |
|---|---|---|
| 1 | Master Data endpoint paths not enumerated in the SAD | Applied the documented URL convention from `docs/04-ai-contract/04-api-contract.md` uniformly across task-021--026 (`/master-data/<entity>` collection/detail/list). No path was invented outside that convention. |
| 2 | Phase 1 vs Phase 2 EMR boundary | Held the line at Open/Close Visit, Vital Sign, SOAP, Diagnosis, and a single basic Treatment entry (task-048--053). Odontogram, Prescription, Clinical Attachment, and full Treatment Planning were not touched -- confirmed absent from the codebase, deferred to Phase 2 per the roadmap's own "New Capabilities" list. |
| 3 | Diagnosis Reference master data gap (task-051) | No `diagnosis_codes`/coded-catalog table exists in Phase 1's task list, so `VisitDiagnosis` was implemented with free-text `diagnosisName` + a `DiagnosisType` enum (PRIMARY/SECONDARY/DIFFERENTIAL), following the alternate free-text table shape documented in `docs/03-sad/06-database-design.md` Section 43 rather than inventing an FK to a nonexistent table. Recorded in the Prisma schema comment above `VisitDiagnosis`. Gap remains open for whichever future phase introduces a coded diagnosis catalog. |
| 4 | Queue Skip/Start transition detail | `docs/03-sad/14-module-queue.md` Section 23's transition diagram was treated as the single, exhaustive source of truth for **every** Queue transition (not just Skip/Start), per that section's own closing statement ("status yang tidak terdapat pada diagram dianggap tidak valid"). Encoded once in `application/services/queueTransitions.ts` and reused by every transition use case. |
| 5 | Doctor Schedule entity placement | Implemented as a distinct `DoctorSchedule` table (not fields on `Doctor`), per `docs/03-sad/13-module-reservation.md` Sections 15-16, and used by `GetDoctorTimeSlotsUseCase`/`DoctorScheduleValidator` (task-036). |

No ambiguity from Section 1 was left unresolved; each resolution is additionally documented inline at its source (schema comment or module doc-comment) so it can be audited without re-reading this report.

---

## 5. Additional Judgment Calls Made During Implementation

Beyond the five ambiguities the plan pre-flagged, three more document conflicts/gaps surfaced while building and were resolved using the same priority-order discipline (Task Spec > PRD > Design > SAD):

1. **Patient archive semantics (Epic D).** Caught before shipping: an early draft of `archive()` set both `active:false` and `deletedAt`, which would have broken `findById()` (filters `deletedAt:null`) and violated task-030's requirement that archived patients remain directly retrievable. Fixed to toggle only `active`; `deletedAt` is reserved for the stricter Section 5.1 "Soft Delete" rule (no clinical transaction history), which is not implemented in Phase 1.
2. **Invoice status model (Epic H).** Epic J's original scaffold (built before the Billing task docs existed) carried two half-matching status representations (`DRAFT/ISSUED/CANCELLED/CLOSED` plus a separate `paymentStatus`). Once task-054/057/058 were read, this was collapsed to the single `UNPAID -> PARTIALLY_PAID -> PAID -> CLOSED` progression the tasks literally describe (a subset of `docs/03-sad/16-module-billing.md` Section 12's fuller `Pending Payment/Cancelled/Void` list, which no Phase 1 task exercises).
3. **Operations Dashboard branch scoping (Epic I).** `docs/03-sad/20-module-report.md` Section 6.1 calls for "the server intersects requested branchIds with authorised scope," which requires per-user branch assignment -- infrastructure that is explicitly Phase 4 scope (task-210 onward). `branchId` is accepted as a direct optional filter on the dashboard query instead; documented as a known gap in `OperationsDashboardUseCase`'s doc-comment rather than a silent omission.

---

## 6. Phase 1 Definition of Done -- Checklist

Per `phase-1-plan.md` Section 5:

- [x] Every task in the Section 2 table is implemented, unit/integration tested, and present in `src/app.ts`'s composition root.
- [x] The full critical path is wired end-to-end via real (non-mocked) event subscriptions, verified by dedicated integration tests: `tests/integration/checkInToQueue.test.ts` (Reservation -> Queue) and `tests/integration/emrFinishedToInvoice.test.ts` (EMR -> Billing). The remaining steps of the critical path (User -> Patient -> Reservation -> Queue call -> Visit -> Payment -> Dashboard) are each covered by their own use-case-level unit tests; no single script exercises all nine steps in one run, since Phase 1 has no live-database E2E harness (`docs/05-testing/e2e-tests.md` describes this as a future layer, not yet built).
- [x] No task carries an open, unresolved ambiguity flag without an explicit recorded decision (Section 4 above).
- [x] Every write operation across every module produces an Audit Trail entry via `AuditService.record(...)`.
- [x] RBAC is enforced end-to-end: every protected route in every module's `*.routes.ts` is wrapped in `authenticate` + `requirePermission('<module>.<action>')`; unauthenticated/unauthorized requests are verified by `authorize.test.ts` and `authenticate.test.ts`.

---

## 7. Known Gaps Carried Forward (Not Phase 1 Blockers)

These are scope boundaries, not defects -- each is either explicitly out of Phase 1 per the roadmap, or blocked on infrastructure a later phase introduces:

- No coded Diagnosis Reference catalog (Section 4, #3 above).
- No live-database / seeded-environment E2E test run (all current tests use in-memory fakes); `docs/05-testing/e2e-tests.md`'s Primary Critical Flow scenario has not been executed against a real MySQL instance.
- No per-user branch-scoped authorization (Section 5, #3 above) -- deferred to Phase 4.
- Invoice lifecycle does not yet cover Pending Payment / Cancelled / Void / Refund (SAD Section 12's fuller list) -- no Phase 1 task exercises these states.
- Odontogram, Prescription, Clinical Attachment, full Treatment Planning, Medical Certificate, Referral, and Clinical Timeline remain unbuilt -- all explicitly Phase 2 scope per `docs/03-sad/26-roadmap.md`.

---

## 8. Recommended Next Step

Per `phase-1-plan.md` Section 4 ("Phase 2 cannot begin until the full EMR/Billing critical path is complete"), Phase 1 is exit-criteria-complete and Phase 2 (Core Clinical Operations, task-060--094) may begin. Before starting, `docs/03-sad/26-roadmap.md` and `docs/06-tasks/phase-2-plan.md` should be (re-)read in full per the standard per-phase workflow in `CLAUDE.md`.
