# task-092: Timeline Summary

**Phase:** Phase 2 - Core Clinical Operations  
**Epic:** U. Clinical Timeline  
**Feature:** U1. Longitudinal Patient Record  
**Module:** EMR  
**Priority:** P2 - Medium

---

## Business Goal

Give the Doctor a condensed, high-level summary view of the patient's clinical history (rather than the full event-by-event feed) for quick pre-visit review.

## Depends On

- task-091

## Required Documents

- **AI Contract:** docs/04-ai-contract/04-api-contract.md
- **PRD:** docs/01-prd/features/emr.md
- **SAD:** GET /api/v1/emr/timeline/{patientId}/summary (grep-verified, line 10175)
- **Design:** No page-level spec exists yet (documented gap).

## Required Existing Code

task-091.

## Backend Scope

- GetPatientTimelineSummaryUseCase: condense the full timeline into key highlights (most recent visit, active allergies/medical alerts, open treatment plan items, last prescription) -- exact summary composition is not itemized in the SAD; a reasonable, clearly-documented set of highlights should be used rather than an arbitrary invention, and confirmed against the source before finalizing.

## Frontend Scope

- Summary card/panel shown at the top of Patient Detail or when a Visit opens.

## Database Impact

- Read-only, likely reusing task-091's aggregation with a condensed projection.

## API Impact

- Adds GET /api/v1/emr/timeline/{patientId}/summary.

## Workflow Impact

Surfaced automatically at Open Visit (Phase 1 task-048) for quick clinical context.

## Security Impact

- Gated by emr.timeline.read permission.

## Testing Required

- Unit test: summary correctly surfaces active Clinical Alerts (allergy/medical history).

## Deliverables

- GetPatientTimelineSummaryUseCase, controller, route, DTOs, tests, frontend summary panel.

## Acceptance Criteria

- Summary surfaces the most clinically relevant recent information, especially active alerts.

## Definition of Done

- Implemented, tested, permission-gated.
- Exact summary field set confirmed against docs/03-sad/15-module-emr.md Part 3.4 rather than assumed.

---

## Dependency Detail

- **Blocked By:** task-091.
- **Required Before:** None blocking.
- **Can Run In Parallel With:** task-093, task-094.
