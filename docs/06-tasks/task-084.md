# task-084: Restore Attachment Version

**Phase:** Phase 2 - Core Clinical Operations  
**Epic:** Q. Clinical Attachment  
**Feature:** Q1. Attachment Lifecycle  
**Module:** EMR  
**Priority:** P2 - Medium

---

## Business Goal

Allow staff to restore a previous version of an attachment (e.g. revert to the original image if a re-upload was made in error), leveraging the Versioned characteristic from Section 4.

## Depends On

- task-078

## Required Documents

- **AI Contract:** docs/04-ai-contract/06-database-contract.md
- **PRD:** docs/01-prd/features/emr.md
- **SAD:** POST /api/v1/emr/attachments/{id}/versions/{version}/restore (grep-verified, line 9326)
- **Design:** No page-level spec exists yet (documented gap).

## Required Existing Code

task-078 (must have produced multiple versions for this to be meaningful).

## Backend Scope

- RestoreAttachmentVersionUseCase: make a specified prior version the current/active version, without deleting any version history (per the Immutable/Versioned characteristics -- restoring creates a new 'current' pointer, it does not delete the version that was superseded).

## Frontend Scope

- Version history list with a 'Restore' action per version, on the Attachment detail panel.

## Database Impact

- Updates the attachments table's current-version pointer; version history rows remain untouched.

## API Impact

- Adds POST /api/v1/emr/attachments/{id}/versions/{version}/restore.

## Workflow Impact

Supporting correction workflow.

## Security Impact

- Gated by emr.attachment.restore permission.
- Audit Trail entry required (restoring is itself a tracked change).

## Testing Required

- Unit test: restoring an older version updates the current pointer without deleting any version.
- Unit test: restoring a non-existent version is rejected.

## Deliverables

- RestoreAttachmentVersionUseCase, controller, route, DTOs, tests, frontend version history UI.

## Acceptance Criteria

- Restore correctly changes the current version pointer while preserving full version history.

## Definition of Done

- Implemented, tested, permission-gated, audit-logged.

---

## Dependency Detail

- **Blocked By:** task-078.
- **Required Before:** None blocking.
- **Can Run In Parallel With:** task-079 through task-083.
