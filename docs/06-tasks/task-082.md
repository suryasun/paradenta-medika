# task-082: List Visit Attachments

**Phase:** Phase 2 - Core Clinical Operations  
**Epic:** Q. Clinical Attachment  
**Feature:** Q1. Attachment Lifecycle  
**Module:** EMR  
**Priority:** P1 - High

---

## Business Goal

Allow the Doctor to see all attachments (photos, X-rays, documents) associated with a specific visit in one place.

## Depends On

- task-078

## Required Documents

- **AI Contract:** docs/04-ai-contract/04-api-contract.md
- **PRD:** docs/01-prd/features/emr.md
- **SAD:** GET /api/v1/emr/visits/{visitId}/attachments (grep-verified, line 9310)
- **Design:** No page-level spec exists yet (documented gap).

## Required Existing Code

task-078.

## Backend Scope

- ListVisitAttachmentsUseCase.
- GET /api/v1/emr/visits/{visitId}/attachments controller.

## Frontend Scope

- Attachment gallery/list panel within the Visit/EMR screen.

## Database Impact

- Read-only query filtered by visit_id.

## API Impact

- Adds GET /api/v1/emr/visits/{visitId}/attachments.

## Workflow Impact

Central reference point for reviewing a visit's full clinical media.

## Security Impact

- Gated by emr.attachment.read permission.

## Testing Required

- Unit test: returns all attachments for the visit, excluding archived ones by default (interacts with task-083).

## Deliverables

- ListVisitAttachmentsUseCase, controller, route, DTOs, tests, frontend gallery.

## Acceptance Criteria

- All non-archived attachments for the visit are listed correctly.

## Definition of Done

- Implemented, tested, permission-gated.

---

## Dependency Detail

- **Blocked By:** task-078.
- **Required Before:** None blocking.
- **Can Run In Parallel With:** task-079 through task-081, task-083, task-084.
