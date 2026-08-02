# task-078: Upload Attachment

**Phase:** Phase 2 - Core Clinical Operations  
**Epic:** Q. Clinical Attachment  
**Feature:** Q1. Attachment Lifecycle  
**Module:** EMR  
**Priority:** P0 - Blocking

---

## Business Goal

Allow clinical staff to upload clinical media (Photo, X-Ray, CBCT, Consent, PDF, Video, Other Document per docs/03-sad/15-module-emr.md Section 4) against a Visit, fulfilling both the 'Clinical Attachment' and, via the X-Ray category, the 'Radiology Request' Phase 2 roadmap capabilities.

## Depends On

- Phase 1 task-048 (Open Visit)
- Phase 1 task-004 (S3/MinIO config)

## Required Documents

- **AI Contract:** docs/04-ai-contract/09-security-contract.md
- **PRD:** docs/01-prd/features/emr.md
- **SAD:** docs/03-sad/15-module-emr.md Part 3.3A (Clinical Attachment Foundation, Sections 4-7: Overview, Category, Lifecycle, Metadata); POST /api/v1/emr/attachments (grep-verified, line 9249)
- **Design:** No page-level spec exists yet (documented gap).

## Required Existing Code

Phase 1 task-004 (Object Storage/S3/MinIO configuration), Phase 1 task-048.

## Backend Scope

- UploadAttachmentUseCase: accept a file + category (Clinical Photography/X-Ray/CBCT/Consent/PDF/Video/Other per Section 5) + visitId; store the binary in Object Storage (MinIO/S3, per docs/03-sad/02-system-architecture.md Section 27) and persist metadata (file name, MIME type, size, bucket, object key, uploader, timestamp) per that section's File Metadata table.
- Attachments are Immutable and Versioned per Section 4 characteristics -- re-uploading a corrected file creates a new version, not an overwrite.
- POST /api/v1/emr/attachments controller + DTOs.

## Frontend Scope

- Attachment upload widget within the Visit/EMR screen (drag-and-drop or file picker), with category selection.

## Database Impact

- New attachments table (metadata only, per docs/03-sad/02-system-architecture.md Section 27.1: 'Database hanya menyimpan metadata file').

## API Impact

- Adds POST /api/v1/emr/attachments.

## Workflow Impact

Feeds task-053's (Phase 1) Procedure recording ('Procedure dapat memiliki Attachment') and the Clinical Timeline (Epic U).

## Security Impact

- Gated by emr.attachment.upload permission.
- Files stored in a private bucket with secure/signed URLs, per docs/03-sad/02-system-architecture.md Section 27.5.
- Audit Trail entry required.

## Testing Required

- Unit test: metadata persists correctly for each supported category.
- Integration test: uploaded file is retrievable via task-080 (Download).

## Deliverables

- UploadAttachmentUseCase, controller, route, DTOs, tests, frontend upload widget.

## Acceptance Criteria

- File uploads successfully with correct metadata and category.
- Re-upload of a correction creates a new version rather than overwriting.

## Definition of Done

- Implemented, tested, permission-gated, audit-logged.

---

## Dependency Detail

- **Blocked By:** Phase 1 task-004, task-048.
- **Required Before:** task-079 through task-084.
- **Can Run In Parallel With:** task-071 through task-077.
