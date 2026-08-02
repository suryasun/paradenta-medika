# task-094: Timeline Attachments (Filtered)

**Phase:** Phase 2 - Core Clinical Operations  
**Epic:** U. Clinical Timeline  
**Feature:** U1. Longitudinal Patient Record  
**Module:** EMR  
**Priority:** P2 - Medium

---

## Business Goal

Allow the Doctor to view just the media/document history (photos, X-rays, consents) for a patient across all visits, without the full mixed event feed.

## Depends On

- task-091
- task-078

## Required Documents

- **AI Contract:** docs/04-ai-contract/04-api-contract.md
- **PRD:** docs/01-prd/features/emr.md
- **SAD:** GET /api/v1/emr/timeline/{patientId}/attachments (grep-verified, line 10187)
- **Design:** No page-level spec exists yet (documented gap).

## Required Existing Code

task-091, task-078 (attachment data source).

## Backend Scope

- GetPatientTimelineAttachmentsUseCase: return all attachments across all of the patient's visits, distinct from task-082's single-visit scope.

## Frontend Scope

- Patient-level attachment gallery (across all visits), likely a photo-progression/comparison view given Section 4's mention of Progress Photo / Before-After Treatment categories.

## Database Impact

- Read-only query across attachments for all of a patient's visits.

## API Impact

- Adds GET /api/v1/emr/timeline/{patientId}/attachments.

## Workflow Impact

Supporting long-term treatment-progress review.

## Security Impact

- Gated by emr.timeline.read / emr.attachment.read permissions.

## Testing Required

- Unit test: returns all non-archived attachments across all of the patient's visits, correctly excluding other patients' data.

## Deliverables

- GetPatientTimelineAttachmentsUseCase, controller, route, DTOs, tests, frontend gallery.

## Acceptance Criteria

- Returns the complete, correctly-scoped cross-visit attachment set for the patient.

## Definition of Done

- Implemented, tested, permission-gated.

---

## Dependency Detail

- **Blocked By:** task-091, task-078.
- **Required Before:** None blocking.
- **Can Run In Parallel With:** task-092, task-093.
