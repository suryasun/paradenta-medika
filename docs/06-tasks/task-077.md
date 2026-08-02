# task-077: Lock Periodontal Assessment

**Phase:** Phase 2 - Core Clinical Operations  
**Epic:** P. Periodontal Assessment  
**Feature:** P1. Periodontal Charting  
**Module:** EMR  
**Priority:** P1 - High

---

## Business Goal

Finalize a periodontal assessment once complete, preventing further edits and making it part of the permanent clinical record.

## Depends On

- task-072

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md
- **PRD:** docs/01-prd/features/emr.md
- **SAD:** docs/03-sad/15-module-emr.md Part 3.2A-3.2D (Periodontal Assessment & Clinical Examination, lines 3547-6118); endpoint: POST /api/v1/emr/periodontal-assessments/{assessmentId}/lock
- **Design:** No page-level spec exists yet (documented gap) -- periodontal charting is a specialized clinical UI (pocket depth/recession grid per tooth) not covered in docs/02-design/.

## Required Existing Code

Phase 1 task-048 (Visit) unless this task is task-071 itself.

## Backend Scope

- LockPeriodontalAssessmentUseCase: transition assessment to Locked; subsequent update/delete attempts on its measurements (task-073, task-074) must be rejected.
- POST /api/v1/emr/periodontal-assessments/{assessmentId}/lock controller + DTOs.

## Frontend Scope

- Periodontal chart UI component (6-point-per-tooth measurement grid, per standard periodontal charting convention referenced in docs/03-sad/15-module-emr.md Part 3.2B).

## Database Impact

- Reads/writes periodontal_assessments and periodontal_measurements tables.

## API Impact

- Adds POST /api/v1/emr/periodontal-assessments/{assessmentId}/lock.

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

- Assessment transitions to Locked and becomes immutable.

## Definition of Done

- Implemented, tested, permission-gated, audit-logged for write operations.

---

## Dependency Detail

- **Blocked By:** task-072
- **Required Before:** None blocking (should occur before Close Visit for completeness, though not a hard technical dependency).
- **Can Run In Parallel With:** task-075, task-076.
