# task-072: Add Periodontal Measurement

**Phase:** Phase 2 - Core Clinical Operations  
**Epic:** P. Periodontal Assessment  
**Feature:** P1. Periodontal Charting  
**Module:** EMR  
**Priority:** P1 - High

---

## Business Goal

Record a single per-tooth periodontal measurement (pocket depth, recession, bleeding, etc.) within an assessment.

## Depends On

- task-071

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md
- **PRD:** docs/01-prd/features/emr.md
- **SAD:** docs/03-sad/15-module-emr.md Part 3.2A-3.2D (Periodontal Assessment & Clinical Examination, lines 3547-6118); endpoint: POST /api/v1/emr/periodontal-assessments/{assessmentId}/measurements
- **Design:** No page-level spec exists yet (documented gap) -- periodontal charting is a specialized clinical UI (pocket depth/recession grid per tooth) not covered in docs/02-design/.

## Required Existing Code

Phase 1 task-048 (Visit) unless this task is task-071 itself.

## Backend Scope

- AddPeriodontalMeasurementUseCase persisting one measurement entry per the documented Clinical Measurements model (Part 3.2B).
- POST /api/v1/emr/periodontal-assessments/{assessmentId}/measurements controller + DTOs.

## Frontend Scope

- Periodontal chart UI component (6-point-per-tooth measurement grid, per standard periodontal charting convention referenced in docs/03-sad/15-module-emr.md Part 3.2B).

## Database Impact

- Reads/writes periodontal_assessments and periodontal_measurements tables.

## API Impact

- Adds POST /api/v1/emr/periodontal-assessments/{assessmentId}/measurements.

## Workflow Impact

Part of the extended clinical examination workflow within EMR, feeding the Clinical Timeline (Epic U).

## Security Impact

- Gated by the corresponding emr.periodontal.* permission.
- Audit Trail entry required for write operations.

## Testing Required

- Unit test for the specific operation.
- Integration test against the documented endpoint.

## Deliverables

- Use Case, controller, route, DTOs, tests.

## Acceptance Criteria

- Measurement persists and is retrievable within the assessment.

## Definition of Done

- Implemented, tested, permission-gated, audit-logged for write operations.

---

## Dependency Detail

- **Blocked By:** task-071
- **Required Before:** None blocking.
- **Can Run In Parallel With:** task-073, task-074.
