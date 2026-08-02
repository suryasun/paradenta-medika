# task-080: Download Attachment

**Phase:** Phase 2 - Core Clinical Operations  
**Epic:** Q. Clinical Attachment  
**Feature:** Q1. Attachment Lifecycle  
**Module:** EMR  
**Priority:** P0 - Blocking

---

## Business Goal

Allow authorized staff to securely download or preview the actual attachment file (e.g. view an X-Ray image or print a consent PDF).

## Depends On

- task-078

## Required Documents

- **AI Contract:** docs/04-ai-contract/09-security-contract.md
- **PRD:** docs/01-prd/features/emr.md
- **SAD:** GET /api/v1/emr/attachments/{id}/download (grep-verified, line 9294); docs/03-sad/02-system-architecture.md Section 27.5 (Secure URL)
- **Design:** No page-level spec exists yet (documented gap).

## Required Existing Code

task-078.

## Backend Scope

- DownloadAttachmentUseCase: generate a short-lived, secure/signed URL to the Object Storage object rather than proxying the full binary through the API server, per docs/03-sad/02-system-architecture.md Section 27.5 (Secure URL, Private Bucket).
- GET /api/v1/emr/attachments/{id}/download controller.

## Frontend Scope

- Download/preview button on the Attachment detail panel (task-079), with inline image/PDF preview where the MIME type supports it.

## Database Impact

- Read-only -- no new data, but must log the access.

## API Impact

- Adds GET /api/v1/emr/attachments/{id}/download.

## Workflow Impact

Supporting operation used across clinical review, referrals (Epic T), and reporting.

## Security Impact

- Gated by emr.attachment.read permission.
- Signed URL must expire quickly (exact TTL not specified in SAD -- use a conservative default, e.g. a few minutes, and flag as a configuration decision rather than a hardcoded SAD-specified value).
- Audit Trail entry required for every download access (clinically/legally sensitive).

## Testing Required

- Unit test: signed URL is generated and expires as configured.
- Integration test: download access is logged to Audit Trail.

## Deliverables

- DownloadAttachmentUseCase, controller, route, DTOs, tests, frontend preview/download UI.

## Acceptance Criteria

- Download returns a working, time-limited secure URL.
- Every download is audit-logged.

## Definition of Done

- Implemented, tested, permission-gated, audit-logged.

---

## Dependency Detail

- **Blocked By:** task-078.
- **Required Before:** None blocking.
- **Can Run In Parallel With:** task-079, task-081 through task-084.
