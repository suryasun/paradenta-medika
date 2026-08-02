# task-263: PACS Integration Adapter

**Phase:** Phase 6 - Healthcare Ecosystem
**Epic:** DE. Radiology System
**Feature:** DE2. PACS Integration
**Module:** EMR
**Priority:** P1 - High

---

## Business Goal

Implement a PACS (Picture Archiving and Communication System) integration adapter per docs/03-sad/15-module-emr.md Section 16, supporting the literal Supported Integration list and synchronization strategies, connecting Parakita to an imaging workstation/PACS per the literal architecture flow.

## Depends On

- task-262 (DICOM Image Ingestion and Metadata)

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md, docs/04-ai-contract/04-api-contract.md, docs/04-ai-contract/06-database-contract.md, docs/04-ai-contract/09-security-contract.md
- **PRD:** docs/01-prd/features/emr.md, docs/01-prd/business-rules.md § 5
- **SAD:** docs/03-sad/15-module-emr.md (Section 16 PACS Integration (Architecture: Dental Sensor → Imaging Workstation → PACS → Integration Service → EMR → Object Storage; Supported Integration: Orthanc PACS, dcm4chee, Vendor PACS, Cloud PACS; Synchronization: Auto Import, Manual Import, Scheduled Sync, Metadata Synchronization))
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-262.

## Backend Scope

- Infrastructure layer: `PacsIntegrationService`, an adapter implementing the literal Architecture flow's 'Integration Service' role — pulling images from a configured PACS (one of the four literal Supported Integration options; the specific PACS product must be confirmed against the clinic's actual imaging hardware during implementation, not guessed) into task-278's DICOM entities and Object Storage.
- Application layer: `SyncPacsImagesUseCase` supporting all four literal Synchronization modes (Auto Import, Manual Import, Scheduled Sync — via Phase 5's Advanced Scheduler task-242, Metadata Synchronization).

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

Writes into the DICOM entity hierarchy from task-278; Object Storage receives the actual image binaries.

## API Impact

Adds POST /emr/pacs/sync (manual trigger; convention-derived) and registers a scheduled sync job with Phase 5's task-242 Centralized Scheduler.

## Workflow Impact

Realizes the literal PACS Architecture flow end-to-end, connecting physical imaging hardware to the EMR.

## Security Impact

PACS connection credentials sourced from Secret Management (Phase 5 task-252); imaging network segment must be isolated per typical DICOM/PACS deployment practice (a deployment concern, not application code, noted here for completeness).

## Testing Required

- Unit tests for the Use Case/Entity (per docs/05-testing/unit-tests.md).
- Integration test for Controller/Repository (per docs/05-testing/api-tests.md).

## Deliverables

- `PacsIntegrationService`, `SyncPacsImagesUseCase`, route, controller, tests
- Scheduled Sync registration against task-242

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/emr.md:

- Auto Import correctly ingests a new image from the configured PACS without manual action.
- Metadata Synchronization correctly reconciles a metadata-only change (no new image) from PACS.

## Definition of Done

Adapter and sync use case implemented and tested. **Ambiguity flagged:** the specific PACS product among the four literal candidates must be confirmed against actual clinic imaging hardware during implementation.

---

## Dependency Detail

- **Blocked By:** task-262
- **Required Before:** See phase-6-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
