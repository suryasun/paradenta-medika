# Epic Q: Clinical Attachment — Documentation (task-078–084)

> Retroactive documentation, per the template in `phase-1-documentation/epic-j-foundational-infrastructure.md`'s header note.

---

## Documentation Reviewed

- `docs/06-tasks/task-078.md`–`task-084.md`
- `docs/03-sad/15-module-emr.md` Section 60 (literal OpenAPI spec — one of only three Phase 2 sub-features with literal REST paths) and Part 3.3A (Attachment Matrix: which categories support annotation)
- `docs/04-ai-contract/02-architecture-contract.md` ARCH-006 (S3/MinIO object storage)

## Task List

| Task | Name |
|---|---|
| task-078 | Upload Attachment, P0 — Blocking |
| task-079 | Get Attachment Detail, P1 |
| task-080 | Download Attachment, P0 — Blocking |
| task-081 | Annotate Attachment, P2 |
| task-082 | List Visit Attachments, P1 |
| task-083 | Archive Attachment, P2 |
| task-084 | Restore Attachment Version, P2 |

## Implementation Plan

**Infrastructure gap resolved via `AskUserQuestion`:** no S3/MinIO instance is provisioned anywhere in the repository or environment, but ARCH-006 mandates object storage behind an interface. Presented the user with implementation options; **"Local filesystem stand-in" was selected (the recommended option)**. Built `IObjectStorageService` (put/read/getSignedUrl/verifySignedToken) as the interface boundary, with `LocalFilesystemStorageService` as the only implementation — JWT-signed tokens stand in for S3 pre-signed URLs. Swapping in a real S3/MinIO-backed implementation later requires touching only `infrastructure/`, not any use case.

Attachments are **immutable and versioned**: uploading again with an `attachmentId` present adds a new version rather than overwriting; `RestoreAttachmentVersionUseCase` can make an older version current again without deleting the newer one.

## Files Created

- `apps/backend/src/shared/storage/IObjectStorageService.ts`, `LocalFilesystemStorageService.ts`
- `apps/backend/tests/fakes/storageFakes.ts`
- `apps/backend/src/modules/emr/`:
  - `domain/repositories/IAttachmentRepository.ts`, `IAttachmentAnnotationRepository.ts`
  - `application/services/attachmentStorageKey.ts`
  - `application/dtos/UploadAttachmentRequestDto.ts`, `AnnotateAttachmentRequestDto.ts`, `AttachmentResponseDto.ts`
  - `application/mappers/AttachmentMapper.ts`
  - `application/use-cases/UploadAttachmentUseCase.ts` + `.test.ts`, `GetAttachmentDetailUseCase.ts` + `.test.ts`, `DownloadAttachmentUseCase.ts` + `.test.ts`, `AnnotateAttachmentUseCase.ts` + `.test.ts`, `ListVisitAttachmentsUseCase.ts` + `.test.ts`, `ArchiveAttachmentUseCase.ts` + `.test.ts`, `RestoreAttachmentVersionUseCase.ts` + `.test.ts`, `GetAttachmentVersionsUseCase.ts` + `.test.ts`
  - `infrastructure/repositories/AttachmentRepository.ts`, `AttachmentAnnotationRepository.ts`
  - `presentation/controllers/AttachmentController.ts`, `AttachmentFileController.ts` (the unauthenticated file-serving controller — see Architecture Validation)

Frontend: `features/emr/components/AttachmentSection.tsx` + `.test.tsx`.

## Files Modified

- `apps/backend/prisma/schema.prisma` (added `AttachmentCategory` enum + `Attachment`, `AttachmentVersion`, `AttachmentAnnotation` models)
- `apps/backend/src/modules/emr/domain/exceptions/EmrExceptions.ts` (added `AttachmentNotFoundException`, `AttachmentVersionNotFoundException`, `AnnotationNotSupportedException`)
- `apps/backend/src/modules/system/domain/services/IAuditService.ts` (extended `AuditAction` with `'READ'`, for download/access-logging events)
- `apps/backend/src/modules/emr/presentation/routes/emr.routes.ts` (wired `attachmentController` + `multer` memory storage, 20MB limit)
- `apps/backend/src/app.ts` (mounted the unauthenticated `buildAttachmentFileRouter` — see Architecture Validation)
- `apps/backend/.env.example`, `.gitignore` (`STORAGE_ROOT`, `apps/backend/storage/`)
- `apps/frontend/features/emr/components/VisitWorkspace.tsx` (added Attachments tab)

## Database Changes

Migration `20260802093338_add_clinical_attachment`: `attachments`, `attachment_versions`, `attachment_annotations` tables.

## API Changes

Literal paths per SAD Section 60:

| Endpoint | Permission |
|---|---|
| `POST /emr/attachments` (multipart) | `emr.attachment.upload` |
| `GET /emr/attachments/:id` | `emr.attachment.read` |
| `GET /emr/attachments/:id/download` | `emr.attachment.read` |
| `POST /emr/attachments/:id/annotations` | `emr.attachment.annotate` |
| `GET /emr/visits/:visitId/attachments` | `emr.attachment.read` |
| `POST /emr/attachments/:id/archive` | `emr.attachment.archive` |
| `GET /emr/attachments/:id/versions` | `emr.attachment.read` |
| `POST /emr/attachments/:id/versions/:version/restore` | `emr.attachment.restore` |
| `GET /attachments/file/:token` | none (JWT-signed token IS the authorization) |

## Frontend Changes

`AttachmentSection` — upload form (category/type/file), version history, download, and an annotation layer for Clinical Photography/X-Ray/CBCT categories (`isAttachmentAnnotatable`).

## Security Validation

- Download issues a short-lived, JWT-signed URL rather than exposing raw storage paths; `AuditService.record(..., 'READ', ...)` logs every download.
- `AnnotationNotSupportedException` blocks annotation on non-image categories (Consent/PDF/Video/Other) per the Part 3.3A Attachment Matrix.

## Architecture Validation

- **Routing bug found and fixed:** a router mounted via `app.use(prefix, router)` with an unconditional `router.use(authenticate)` (no path) intercepts *all* requests reaching it under that prefix — even ones that don't match any of the router's own routes — because `authenticate` calling `next(err)` on a missing bearer token skips straight to the global error handler instead of falling through to a later-mounted sibling router. Fixed by mounting the unauthenticated `buildAttachmentFileRouter` **first** in `app.ts`, before the authenticated EMR router. This is a structural gotcha worth flagging for any future unauthenticated route added to this codebase.
- `IObjectStorageService` is the clean seam for the eventual real S3/MinIO migration flagged in `docs/03-sad/03-clean-architecture.md` Section 34.5 — no use case references `LocalFilesystemStorageService` directly.
