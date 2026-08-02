# task-264: Image Processing Pipeline

**Phase:** Phase 6 - Healthcare Ecosystem
**Epic:** DE. Radiology System
**Feature:** DE3. Processing Pipeline
**Module:** EMR
**Priority:** P1 - High

---

## Business Goal

Implement the radiology Image Processing Pipeline per docs/03-sad/15-module-emr.md Section 18's literal Processing Flow, generating the literal Generated Assets (Original, Thumbnail, Medium, Annotated) for every ingested image, enforcing the literal Processing Rules.

## Depends On

- task-262 (DICOM Image Ingestion and Metadata)

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md, docs/04-ai-contract/04-api-contract.md, docs/04-ai-contract/06-database-contract.md, docs/04-ai-contract/09-security-contract.md
- **PRD:** docs/01-prd/features/emr.md, docs/01-prd/business-rules.md § 5
- **SAD:** docs/03-sad/15-module-emr.md (Section 18 Image Processing Pipeline (Processing Flow: Upload → Virus Scan → Checksum → Metadata Extraction → Compression → Thumbnail → Watermark (Optional) → Encryption → Object Storage → Publish Event; Generated Assets: Original/Archive, Thumbnail/Preview, Medium/Web Viewer, Annotated/Clinical Discussion; Processing Rules: original unchanged, thumbnail automatic, metadata never lost, all steps audited))
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-262.

## Backend Scope

- Application layer: `ProcessRadiologyImageUseCase`, implementing the literal nine-step Processing Flow in exact order (Virus Scan → Checksum → Metadata Extraction → Compression → Thumbnail → optional Watermark → Encryption → Object Storage → Publish Event), reusing Phase 2's Clinical Attachment virus-scan/checksum infrastructure where it already exists rather than duplicating it.
- Generates all four literal Asset types (Original, Thumbnail, Medium, Annotated-placeholder pending task-280's annotation layer).
- Enforces the literal Processing Rules: the Original file is never mutated by any downstream step; every step writes an Audit Trail entry.

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

Extends the DICOM image entity (task-278) with references to each generated asset.

## API Impact

No new public endpoint (internal pipeline triggered by task-278's ingestion).

## Workflow Impact

Every image ingested via DICOM upload (task-278) or PACS sync (task-279) flows through this pipeline before being clinically usable.

## Security Impact

Virus scan and encryption are mandatory pipeline steps, not optional; a file failing virus scan never reaches Object Storage.

## Testing Required

- Unit tests for the Use Case/Entity (per docs/05-testing/unit-tests.md).
- Integration test for Controller/Repository (per docs/05-testing/api-tests.md).

## Deliverables

- `ProcessRadiologyImageUseCase` implementing the exact nine-step flow
- Tests verifying Original immutability, automatic thumbnail generation, and a full audit trail per processed image

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/emr.md:

- The Original asset is byte-for-byte unchanged after processing.
- A Thumbnail is always generated automatically, with no manual step required.
- Every one of the nine processing steps produces an Audit Trail entry.
- A file failing virus scan does not reach Object Storage and does not produce a Thumbnail/Medium/Annotated asset.

## Definition of Done

Pipeline implemented and tested against the exact literal nine-step flow, all four asset types, and all four literal Processing Rules.

---

## Dependency Detail

- **Blocked By:** task-262
- **Required Before:** See phase-6-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
