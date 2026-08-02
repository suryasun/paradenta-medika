# task-069: Get Current Odontogram State

**Phase:** Phase 2 - Core Clinical Operations  
**Epic:** O. Interactive Odontogram  
**Feature:** O1. Odontogram Foundation  
**Module:** EMR  
**Priority:** P1 - High

---

## Business Goal

Allow the Doctor to see the patient's current full-mouth tooth condition map at the start of a visit, the read side of the Interactive Odontogram.

## Depends On

- task-068

## Required Documents

- **AI Contract:** docs/04-ai-contract/04-api-contract.md
- **PRD:** docs/01-prd/features/emr.md
- **SAD:** docs/03-sad/15-module-emr.md Section 31 (High Level UI shows current Selected Tooth / Surface / Condition state)
- **Design:** docs/03-sad/15-module-emr.md Section 31 wireframe (no formal docs/02-design/ spec -- documented gap).

## Required Existing Code

task-068 (source data).

## Backend Scope

- GetCurrentOdontogramUseCase: for each of the patient's 32 teeth, return the latest (current) condition version per surface.
- Endpoint path convention-derived, e.g. GET /api/v1/patients/{patientId}/odontogram.

## Frontend Scope

- Renders the Odontogram UI (task-068's component) in read/overview mode when a Visit opens.

## Database Impact

- Read-only query returning the latest version per tooth/surface from odontogram_entries.

## API Impact

- Adds GET /api/v1/patients/{patientId}/odontogram.

## Workflow Impact

Surfaced automatically at Open Visit (task-048) so the Doctor has full context before examining the patient.

## Security Impact

- Gated by emr.odontogram.read permission.

## Testing Required

- Unit test: returns the correct latest state per tooth/surface, ignoring superseded versions.

## Deliverables

- GetCurrentOdontogramUseCase, controller, route, DTOs, tests, frontend read view.

## Acceptance Criteria

- Returned state always reflects the most recent entry per tooth/surface.

## Definition of Done

- Implemented, tested, permission-gated.

---

## Dependency Detail

- **Blocked By:** task-068.
- **Required Before:** None blocking.
- **Can Run In Parallel With:** task-070.
