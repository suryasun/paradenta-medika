# Epic U: Clinical Timeline — Documentation (task-091–094)

> Retroactive documentation, per the template in `phase-1-documentation/epic-j-foundational-infrastructure.md`'s header note.

---

## Documentation Reviewed

- `docs/06-tasks/task-091.md`–`task-094.md`
- `docs/03-sad/15-module-emr.md` Part 3.4 (Clinical Timeline, EMR History & Longitudinal Patient Record — full read, including the event-sourced architecture description in Sections 5–10)
- `docs/02-design/pages/patient.md` Section 12.2 (Patient Detail Tabs)

## Task List

| Task | Name |
|---|---|
| task-091 | Patient Clinical Timeline, P1 |
| task-092 | Timeline Summary, P2 |
| task-093 | Timeline Events (Filtered), P2 |
| task-094 | Timeline Attachments (Filtered), P2 |

Scheduled and built last, by design — task-091's own Definition of Done states it "should be scheduled last within Phase 2 since it depends on nearly every other EMR feature existing first," and the plan's Section 3 names it "the final synchronization point."

## Implementation Plan

**Scope-narrowing decision (the largest of this phase).** Part 3.4 describes a full event-sourced architecture: `timeline_events`/`timeline_event_metadata`/`timeline_event_attachment`/`timeline_event_actor` tables, a Domain-Event-driven Event Bus consumer, and Redis caching for "Recent Timeline"/"Summary"/"Filter"/"Search." Task-091's own literal Backend Scope and Database Impact ask for something far smaller: "aggregate all clinical events for a patient across all visits into a single chronologically-ordered feed," over a **read-only aggregate query across visits, soap_notes, visit_treatments, prescriptions, odontogram_entries, attachments, consents, referrals, follow_ups** — no new event-sourcing table, no Event Bus consumer, no Redis. Implemented exactly that: `GetPatientTimelineUseCase` queries the existing repositories directly and merges/sorts in application code. This follows the same document-priority discipline (Task Spec > SAD) already established for Periodontal (Epic P) and Consent (Epic R) in this same phase.

The 10 event types surfaced (`VISIT`, `SOAP`, `DIAGNOSIS`, `TREATMENT`, `PRESCRIPTION`, `ODONTOGRAM`, `ATTACHMENT`, `CONSENT`, `REFERRAL`, `FOLLOW_UP`) are the literal union of task-091's Business Goal parenthetical list, its Depends On list (which names task-090 Follow Up), and its Database Impact table list. Medical Certificate (Epic S) and Periodontal Assessment (Epic P) are **not** included — neither is named in any of those three sources, so adding them would have been scope invention beyond the literal task text (flagged explicitly in the DTO's own doc-comment).

task-092's summary fields (most recent visit, active allergies/medical alerts, open treatment plan items, last prescription) are a direct quote from the task's own Backend Scope text, not an invented shape. "Open" treatment plan items are defined via the `TreatmentPlanItem.reservations` relation (added in Epic M) being empty — reusing an existing, real relation rather than inventing a new status field.

## Files Created

`apps/backend/src/modules/emr/`:
- `application/dtos/TimelineEventResponseDto.ts`, `TimelineSummaryResponseDto.ts`, `GetTimelineEventsQueryDto.ts`
- `application/use-cases/GetPatientTimelineUseCase.ts` + `.test.ts`, `GetPatientTimelineSummaryUseCase.ts` + `.test.ts`, `GetPatientTimelineEventsUseCase.ts` + `.test.ts`, `GetPatientTimelineAttachmentsUseCase.ts` + `.test.ts`
- `presentation/controllers/TimelineController.ts`

Frontend: `features/emr/components/ClinicalTimelineSection.tsx` + `.test.tsx`, `hooks/useTimeline.ts`.

## Files Modified

- `apps/backend/src/modules/emr/domain/repositories/IVisitRepository.ts` + `infrastructure/repositories/VisitRepository.ts` (added `findByPatientId`)
- `apps/backend/src/modules/emr/domain/repositories/IAttachmentRepository.ts` + `infrastructure/repositories/AttachmentRepository.ts` (added `findByPatientId`, distinct from task-082's `findByVisitId`)
- `apps/backend/src/modules/emr/domain/repositories/ITreatmentPlanRepository.ts` + `infrastructure/repositories/TreatmentPlanRepository.ts` (added `findOpenByPatientId`)
- `apps/backend/src/modules/emr/presentation/routes/emr.routes.ts` (wired `timelineController`)
- `apps/frontend/features/patient/components/PatientDetailView.tsx` — the empty "Visit History" placeholder tab (Phase 1's documented gap: "always render empty in Phase 1") is **replaced** by a "Clinical Timeline" tab rendering `ClinicalTimelineSection`, per task-091's own Frontend Scope: "replacing/extending the generic history tabs ... with a unified chronological feed."

## Database Changes

None. Pure read-aggregation over tables created in Phase 1 and earlier Phase 2 epics — no migration for this epic.

## API Changes

| Endpoint | Permission |
|---|---|
| `GET /emr/timeline/:patientId` | `emr.timeline.read` |
| `GET /emr/timeline/:patientId/summary` | `emr.timeline.read` |
| `GET /emr/timeline/:patientId/events` | `emr.timeline.read` (optional `eventType` filter) |
| `GET /emr/timeline/:patientId/attachments` | `emr.timeline.read` **and** `emr.attachment.read` |

## Frontend Changes

`ClinicalTimelineSection` — a summary panel (recent visit, active alerts, open treatment plan items, last prescription), a chronological event feed with an event-type filter dropdown, and a cross-visit attachment gallery, all on one Patient Detail tab.

## Security Validation

Live-verified end-to-end: full timeline, summary, filtered events, and the attachment gallery were all confirmed against real data from a seeded Visit/Attachment/Medical Certificate; a `registration1` user's timeline-read attempt correctly returned `403`; an invalid `eventType` query value correctly returned `400`.

## Architecture Validation

- This is the capstone epic of Phase 2 by design — its use cases are the first in this phase to read across *seven* different repository interfaces in a single use case (`GetPatientTimelineUseCase`), which is a deliberate, task-authorized exception to the usual one-or-two-repository shape of every other use case in this phase, since aggregation is the entire point of this feature.
- `GetPatientTimelineEventsUseCase` wraps `GetPatientTimelineUseCase` in-process and filters in memory, rather than re-querying with a `WHERE eventType = ...` clause across seven tables — simpler and consistent with this phase's "reuse the use case, don't duplicate the query" pattern, at the cost of doing slightly more work than strictly necessary per filtered request (acceptable for Phase 2's read-volume; flagged as a candidate for a future performance pass if Phase 3+ traffic requires it).
