# task-071: Create Periodontal Assessment

**Phase:** Phase 2 - Core Clinical Operations  
**Epic:** P. Periodontal Assessment  
**Feature:** P1. Periodontal Charting  
**Module:** EMR  
**Priority:** P1 - High

---

## Business Goal

Start a new periodontal assessment session for a Visit, the entry point of periodontal charting.

## Depends On

- Phase 1 task-048 (Open Visit)

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md
- **PRD:** docs/01-prd/features/emr.md
- **SAD:** docs/03-sad/15-module-emr.md Part 3.2A-3.2D; POST /api/v1/emr/periodontal-assessments (grep-verified, line 5757)
- **Design:** No page-level spec exists yet (documented gap).

## Required Existing Code

Phase 1 task-048.

## Backend Scope

- CreatePeriodontalAssessmentUseCase: initialize an assessment record linked to the Visit.
- POST /api/v1/emr/periodontal-assessments controller + DTOs.

## Frontend Scope

- 'Start Periodontal Assessment' action within the Visit/EMR screen.

## Database Impact

- Inserts a periodontal_assessments row.

## API Impact

- Adds POST /api/v1/emr/periodontal-assessments.

## Workflow Impact

Prerequisite for task-072 (Add Measurement).

## Security Impact

- Gated by emr.periodontal.create permission (Doctor role).
- Audit Trail entry required.

## Testing Required

- Unit test: assessment can only be created against an open (non-Completed/Locked) Visit.

## Deliverables

- CreatePeriodontalAssessmentUseCase, controller, route, DTOs, tests.

## Acceptance Criteria

- Assessment created and linked to the correct Visit and Patient.

## Definition of Done

- Implemented, tested, permission-gated, audit-logged.

---

## Dependency Detail

- **Blocked By:** Phase 1 task-048.
- **Required Before:** task-072 through task-077.
- **Can Run In Parallel With:** task-067 through task-070, task-078 through task-084.
