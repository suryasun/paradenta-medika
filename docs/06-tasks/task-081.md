# task-081: Annotate Attachment

**Phase:** Phase 2 - Core Clinical Operations  
**Epic:** Q. Clinical Attachment  
**Feature:** Q1. Attachment Lifecycle  
**Module:** EMR  
**Priority:** P2 - Medium

---

## Business Goal

Allow the Doctor to mark up a clinical image (e.g. circle a lesion on an X-Ray, annotate a clinical photo) to support diagnosis and communication with the patient.

## Depends On

- task-078

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md
- **PRD:** docs/01-prd/features/emr.md
- **SAD:** POST /api/v1/emr/attachments/{id}/annotations (grep-verified, line 9302); docs/03-sad/15-module-emr.md Section 26 (Clinical Annotation, referenced as a broader concept)
- **Design:** No page-level spec exists yet (documented gap) -- an image-annotation UI (drawing/markup tools) is a non-trivial frontend component; scope this task's frontend piece to a basic annotation layer (shapes/text overlay) rather than a full markup toolset unless docs/03-sad/15-module-emr.md Section 26 specifies more, which should be verified before expanding scope.

## Required Existing Code

task-078, task-080 (annotation is typically drawn over the previewed image).

## Backend Scope

- AnnotateAttachmentUseCase: persist annotation data (shape/position/text) linked to the attachment, without modifying the original immutable file (per Section 4's Immutable characteristic -- annotations are an overlay layer, not an edit to the source).

## Frontend Scope

- Basic annotation overlay tool on the image preview (task-080).

## Database Impact

- New attachment_annotations table.

## API Impact

- Adds POST /api/v1/emr/attachments/{id}/annotations.

## Workflow Impact

Supporting clinical documentation feature.

## Security Impact

- Gated by emr.attachment.annotate permission (Doctor role).
- Audit Trail entry required.

## Testing Required

- Unit test: annotation persists without altering the original file's stored bytes/metadata.

## Deliverables

- AnnotateAttachmentUseCase, controller, route, DTOs, tests, frontend annotation overlay.

## Acceptance Criteria

- Annotations persist and are retrievable alongside the attachment; original file remains unmodified.

## Definition of Done

- Implemented, tested, permission-gated, audit-logged.

---

## Dependency Detail

- **Blocked By:** task-078.
- **Required Before:** None blocking.
- **Can Run In Parallel With:** task-079, task-080, task-082 through task-084.
