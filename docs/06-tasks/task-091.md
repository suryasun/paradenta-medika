# task-091: Patient Clinical Timeline

**Phase:** Phase 2 - Core Clinical Operations  
**Epic:** U. Clinical Timeline  
**Feature:** U1. Longitudinal Patient Record  
**Module:** EMR  
**Priority:** P1 - High

---

## Business Goal

Give the Doctor a single chronological view of everything that has happened to a patient across all visits (SOAP notes, diagnoses, treatments, prescriptions, odontogram changes, attachments, consents, referrals) -- the capstone view that ties together every Phase 2 EMR feature.

## Depends On

- task-050 (Phase 1 SOAP)
- task-053 (Phase 1 Treatment)
- task-065 (Prescription)
- task-068 (Odontogram)
- task-078 (Attachment)
- task-086 (Consent)
- task-089 (Referral)
- task-090 (Follow Up)

## Required Documents

- **AI Contract:** docs/04-ai-contract/04-api-contract.md
- **PRD:** docs/01-prd/features/emr.md
- **SAD:** docs/03-sad/15-module-emr.md Part 3.4 (Clinical Timeline, EMR History & Longitudinal Patient Record, line 9609); GET /api/v1/emr/timeline/{patientId} (grep-verified, line 10169)
- **Design:** No page-level spec exists yet (documented gap) -- a chronological/vertical timeline UI aggregating many event types is a substantial frontend component.

## Required Existing Code

Every EMR write-path task above (this is a read-aggregation over all of them) -- Phase 1 task-050/task-053, Phase 2 task-061/062/065/068/078/086/089/090.

## Backend Scope

- GetPatientTimelineUseCase: aggregate all clinical events for a patient across all visits into a single chronologically-ordered feed.
- GET /api/v1/emr/timeline/{patientId} controller.

## Frontend Scope

- Clinical Timeline view on Patient Detail, replacing/extending the generic history tabs referenced in docs/02-design/pages/patient.md Section 12.2 with a unified chronological feed.

## Database Impact

- Read-only aggregate query across visits, soap_notes, visit_treatments, prescriptions, odontogram_entries, attachments, consents, referrals, follow_ups.

## API Impact

- Adds GET /api/v1/emr/timeline/{patientId}.

## Workflow Impact

Read-only, high-value clinical review tool; does not change any workflow state itself.

## Security Impact

- Gated by emr.timeline.read permission.
- Must respect the same field-level sensitivity rules as the underlying data (e.g. consent/allergy visibility restrictions per Phase 1 task-028's Section 29 Security note).

## Testing Required

- Unit test: timeline correctly interleaves events from multiple source tables in chronological order.
- Performance test: timeline query remains responsive for a patient with a long visit history (index strategy should be verified).

## Deliverables

- GetPatientTimelineUseCase, controller, route, DTOs, tests, frontend timeline view.

## Acceptance Criteria

- Timeline includes every event type from all dependent tasks, correctly ordered chronologically.

## Definition of Done

- Implemented, tested, permission-gated.
- This task should be scheduled last within Phase 2 since it depends on nearly every other EMR feature existing first.

---

## Dependency Detail

- **Blocked By:** task-050, task-053, task-065, task-068, task-078, task-086, task-089, task-090 (effectively most of Phase 2).
- **Required Before:** task-092, task-093, task-094 (which are refinements of this same view).
- **Can Run In Parallel With:** None -- natural last task of the Epic.
