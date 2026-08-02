# task-063: Create Treatment Plan (multi-visit)

**Phase:** Phase 2 - Core Clinical Operations  
**Epic:** M. Treatment Planning  
**Feature:** M1. Treatment Planning  
**Module:** EMR  
**Priority:** P1 - High

---

## Business Goal

Allow the Doctor to plan future treatment(s) across multiple visits (e.g. a root canal followed by a crown next month), distinct from Phase 1's basic same-visit Treatment Entry (task-053).

## Depends On

- Phase 1 task-025 (Treatment master data)
- Phase 1 task-051 (Diagnosis)

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md
- **PRD:** docs/01-prd/features/emr.md
- **SAD:** docs/03-sad/15-module-emr.md Section 22 (Treatment Plan -- Information: Treatment, Tooth Number, Tooth Surface, Priority, Estimated Cost, Estimated Duration; Business Rules: Treatment from Master Treatment, can be planned for a future Visit, Treatment Plan can generate a new Reservation)
- **Design:** No page-level spec exists yet (documented gap).

## Required Existing Code

Phase 1 task-025, task-048, task-051.

## Backend Scope

- CreateTreatmentPlanUseCase: persist one or more planned treatment items (treatment_id, tooth number/surface, priority, estimated cost/duration) against the current Visit, distinct from the 'performed now' entries of task-053.
- Endpoint path not literally given in SAD; derive from convention, e.g. POST /api/v1/emr/visits/{visitId}/treatment-plan -- flagged as convention-derived.

## Frontend Scope

- Treatment Plan builder within the Visit/EMR screen, listing planned items with priority and estimated cost.

## Database Impact

- New treatment_plan_items table linked to Visit and Treatment.

## API Impact

- Adds the Treatment Plan endpoint scoped under Visit.

## Workflow Impact

Feeds task-064 (Convert to Reservation) for scheduling the planned future treatment.

## Security Impact

- Gated by emr.treatment-plan.create permission (Doctor role).
- Audit Trail entry required.

## Testing Required

- Unit test: plan items reference only active Treatment catalog entries (task-025's active flag).

## Deliverables

- CreateTreatmentPlanUseCase, controller, route, DTOs, tests, frontend builder.

## Acceptance Criteria

- Treatment Plan items persist with estimated cost/duration and priority.
- Plan items reference the Treatment master catalog correctly.

## Definition of Done

- Implemented, tested, permission-gated, audit-logged.

---

## Dependency Detail

- **Blocked By:** Phase 1 task-025, task-051.
- **Required Before:** task-064.
- **Can Run In Parallel With:** task-065, task-067 through task-070 (different features).
