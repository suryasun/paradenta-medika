# task-265: Image Annotation Layer

**Phase:** Phase 6 - Healthcare Ecosystem
**Epic:** DE. Radiology System
**Feature:** DE4. Annotation
**Module:** EMR
**Priority:** P2 - Medium

---

## Business Goal

Implement the radiology Image Annotation Layer per docs/03-sad/15-module-emr.md Section 19, with the literal eight Annotation Features and versioned, non-destructive annotation layers, letting a doctor mark up an X-ray for clinical discussion.

## Depends On

- task-264 (Image Processing Pipeline)

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md, docs/04-ai-contract/04-api-contract.md, docs/04-ai-contract/06-database-contract.md, docs/04-ai-contract/09-security-contract.md
- **PRD:** docs/01-prd/features/emr.md, docs/01-prd/business-rules.md § 5
- **SAD:** docs/03-sad/15-module-emr.md (Section 19 Image Annotation (Annotation Features: Arrow, Circle, Rectangle, Tooth Marker, Measurement Line, Bone Loss Area, Implant Position, Clinical Comment; Annotation Layer flow: Original Image → Annotation Layer → Clinical Overlay → Viewer; Annotation Rules: annotation never changes the original file, stored as a separate layer, each revision creates a new version))
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-264.

## Backend Scope

- Domain layer: `ImageAnnotation` entity (imageId, annotationType — one of the eight literal types, geometry/position data, authorUserId, version) — each edit creates a new version rather than mutating the prior one, per the literal Annotation Rules.
- Application layer: `CreateAnnotationUseCase`, `ListAnnotationVersionsUseCase`.
- Presentation layer: route, controller for `POST /emr/dicom-images/{imageId}/annotations`, `GET /emr/dicom-images/{imageId}/annotations` (convention-derived).

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

Creates an emr_image_annotations table (versioned, append-only per the literal rule).

## API Impact

Adds POST/GET /emr/dicom-images/{imageId}/annotations.

## Workflow Impact

Produces the 'Annotated' asset type referenced in task-279's Generated Assets list.

## Security Impact

Gated by an EMR clinical-write permission. Audit Trail entry required for every annotation created.

## Testing Required

- Unit tests for the Use Case/Entity (per docs/05-testing/unit-tests.md).
- Integration test for Controller/Repository (per docs/05-testing/api-tests.md).

## Deliverables

- `ImageAnnotation` entity, migration, repository
- `CreateAnnotationUseCase`, `ListAnnotationVersionsUseCase`, routes, controllers, tests

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/emr.md:

- All eight literal annotation types are supported.
- The Original image is never modified by an annotation.
- Editing an existing annotation creates a new version; the prior version remains retrievable.

## Definition of Done

Entity, migration, and endpoints implemented and tested against all eight literal annotation types and the versioning rule.

---

## Dependency Detail

- **Blocked By:** task-264
- **Required Before:** See phase-6-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
