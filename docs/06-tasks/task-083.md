# task-083: Archive Attachment

**Phase:** Phase 2 - Core Clinical Operations  
**Epic:** Q. Clinical Attachment  
**Feature:** Q1. Attachment Lifecycle  
**Module:** EMR  
**Priority:** P2 - Medium

---

## Business Goal

Allow staff to remove an attachment from active view (e.g. a duplicate or mis-categorized upload) without permanently deleting it, preserving the legal/clinical record.

## Depends On

- task-078

## Required Documents

- **AI Contract:** docs/04-ai-contract/06-database-contract.md (Soft Delete Policy)
- **PRD:** docs/01-prd/features/emr.md
- **SAD:** POST /api/v1/emr/attachments/{id}/archive (grep-verified, line 9318)
- **Design:** No page-level spec exists yet (documented gap).

## Required Existing Code

task-078.

## Backend Scope

- ArchiveAttachmentUseCase: soft-flag the attachment (never a hard delete, consistent with Section 4's Immutable/Auditable characteristics).

## Frontend Scope

- Archive action on the Attachment detail panel.

## Database Impact

- Sets an archived flag/deleted_at on the attachments row.

## API Impact

- Adds POST /api/v1/emr/attachments/{id}/archive.

## Workflow Impact

Archived attachments are excluded from task-082's default list but remain retrievable.

## Security Impact

- Gated by emr.attachment.archive permission.
- Audit Trail entry required.

## Testing Required

- Unit test: archived attachment is excluded from the active list but still directly retrievable by id.

## Deliverables

- ArchiveAttachmentUseCase, controller, route, DTOs, tests, frontend action.

## Acceptance Criteria

- Archiving excludes the attachment from active views without deleting the underlying file/metadata.

## Definition of Done

- Implemented, tested, permission-gated, audit-logged.

---

## Dependency Detail

- **Blocked By:** task-078.
- **Required Before:** None blocking.
- **Can Run In Parallel With:** task-079 through task-082, task-084.
