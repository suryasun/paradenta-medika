# task-262: DICOM Image Ingestion & Metadata

**Phase:** Phase 6 - Healthcare Ecosystem
**Epic:** DE. Radiology System
**Feature:** DE1. DICOM Foundation
**Module:** EMR
**Priority:** P1 - High

---

## Business Goal

Implement DICOM-format image ingestion and metadata extraction per docs/03-sad/15-module-emr.md's Dental X-Ray Section 15 DICOM Standard, delivering the literal DICOM Metadata field set and multi-format support (.dcm, JPEG, PNG, TIFF, PDF), the foundation of the roadmap 'Radiology System' item.

## Depends On

- task-134 (Clinical Attachment, Phase 2)
- task-013 (Authentication Middleware)
- task-014 (Authorization Middleware)
- task-006 (Audit Trail Service)

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md, docs/04-ai-contract/04-api-contract.md, docs/04-ai-contract/06-database-contract.md, docs/04-ai-contract/09-security-contract.md
- **PRD:** docs/01-prd/features/emr.md, docs/01-prd/business-rules.md § 5
- **SAD:** docs/03-sad/15-module-emr.md (Section 15 DICOM Standard (Overview: supports DICOM/.dcm, JPEG, PNG, TIFF, PDF; DICOM Metadata: SOP Instance UID, Study Instance UID, Series Instance UID, Modality (DX/CR/CBCT), Patient Name, Patient ID, Study Date, Institution, Manufacturer, Device Model; DICOM Storage hierarchy: Study→Series→Image→Frame))
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

Phase 2's Clinical Attachment module (X-Ray category), task-013, task-014, task-006.

## Backend Scope

- Domain layer: `DicomStudy`, `DicomSeries`, `DicomImage` entities matching the literal Study→Series→Image→Frame hierarchy, with the exact DICOM Metadata fields listed above.
- Infrastructure layer: DICOM parser extracting the literal metadata fields on upload; Prisma migrations for `emr_dicom_studies`, `emr_dicom_series`, `emr_dicom_images`.
- Extends Phase 2's Clinical Attachment upload flow (does not replace it) — a DICOM file uploaded through the existing Attachment endpoint is additionally parsed into this structured hierarchy when its MIME type/extension indicates DICOM.

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

Creates emr_dicom_studies, emr_dicom_series, emr_dicom_images tables (FK to the existing Phase 2 attachment record).

## API Impact

Extends Phase 2's Attachment upload endpoint's response to include the parsed DICOM hierarchy when applicable; adds GET /emr/dicom-studies/{studyId} (convention-derived).

## Workflow Impact

Foundational for PACS Integration (task-278), Image Processing Pipeline (task-279), and Image Annotation (task-280).

## Security Impact

DICOM Patient Name/Patient ID fields extracted from the file must be cross-validated against the actual EMR patient record they're attached to, not blindly trusted (a mismatch is a data-integrity flag, not silently overwritten).

## Testing Required

- Unit tests for the Use Case/Entity (per docs/05-testing/unit-tests.md).
- Integration test for Controller/Repository (per docs/05-testing/api-tests.md).

## Deliverables

- `DicomStudy`/`DicomSeries`/`DicomImage` entities, migrations, repository
- DICOM metadata parser
- Extended upload flow, tests

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/emr.md:

- Uploading a .dcm file correctly extracts all ten literal metadata fields.
- A DICOM Patient ID mismatched against the attachment's actual patient record is flagged, not silently accepted.
- Non-DICOM formats (JPEG/PNG/TIFF/PDF) continue working via the existing Phase 2 flow unchanged.

## Definition of Done

Entities, migrations, and parser implemented and tested against the literal metadata field list.

---

## Dependency Detail

- **Blocked By:** Phase 2 Clinical Attachment module
- **Required Before:** See phase-6-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
