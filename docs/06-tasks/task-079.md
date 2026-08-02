# task-079: Get Attachment Detail

**Phase:** Phase 2 - Core Clinical Operations  
**Epic:** Q. Clinical Attachment  
**Feature:** Q1. Attachment Lifecycle  
**Module:** EMR  
**Priority:** P1 - High

---

## Business Goal

Allow staff to view an attachment's metadata (category, upload date, uploader, version) before downloading or annotating it.

## Depends On

- task-078

## Required Documents

- **AI Contract:** docs/04-ai-contract/04-api-contract.md
- **PRD:** docs/01-prd/features/emr.md
- **SAD:** GET /api/v1/emr/attachments/{id} (grep-verified, line 9286)
- **Design:** No page-level spec exists yet (documented gap).

## Required Existing Code

task-078.

## Backend Scope

- GetAttachmentDetailUseCase.
- GET /api/v1/emr/attachments/{id} controller.

## Frontend Scope

- Attachment detail panel/modal.

## Database Impact

- Read-only query.

## API Impact

- Adds GET /api/v1/emr/attachments/{id}.

## Workflow Impact

Supporting read operation.

## Security Impact

- Gated by emr.attachment.read permission.

## Testing Required

- Unit test: detail returns correct metadata; 404 for non-existent id.

## Deliverables

- GetAttachmentDetailUseCase, controller, route, DTOs, tests.

## Acceptance Criteria

- Detail matches the uploaded metadata exactly.

## Definition of Done

- Implemented, tested, permission-gated.

---

## Dependency Detail

- **Blocked By:** task-078.
- **Required Before:** None blocking.
- **Can Run In Parallel With:** task-080 through task-084.
