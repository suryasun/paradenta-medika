# task-070: Odontogram History (Per-Tooth Timeline)

**Phase:** Phase 2 - Core Clinical Operations  
**Epic:** O. Interactive Odontogram  
**Feature:** O1. Odontogram Foundation  
**Module:** EMR  
**Priority:** P2 - Medium

---

## Business Goal

Allow the Doctor to review the full historical timeline of a specific tooth (e.g. Healthy -> Caries -> Filling -> Secondary Caries -> RCT -> Crown), supporting long-term clinical decision-making.

## Depends On

- task-068

## Required Documents

- **AI Contract:** docs/04-ai-contract/04-api-contract.md
- **PRD:** docs/01-prd/features/emr.md
- **SAD:** docs/03-sad/15-module-emr.md Section 25 (Odontogram History -- example timeline for a single tooth across multiple years/conditions)
- **Design:** No formal docs/02-design/ spec exists (documented gap); Section 25's example timeline text illustrates the expected shape.

## Required Existing Code

task-068 (versioned entries are the source of this history).

## Backend Scope

- GetToothHistoryUseCase: given patientId + tooth number, return all versioned odontogram_entries in chronological order.
- Endpoint path convention-derived, e.g. GET /api/v1/patients/{patientId}/odontogram/{toothNumber}/history.

## Frontend Scope

- Per-tooth history timeline view, opened from the Odontogram component (task-068/069) by clicking a tooth's Timeline Panel/Tooltip.

## Database Impact

- Read-only query filtering odontogram_entries by tooth number, ordered by version/date.

## API Impact

- Adds GET /api/v1/patients/{patientId}/odontogram/{toothNumber}/history.

## Workflow Impact

Read-only supporting view.

## Security Impact

- Gated by emr.odontogram.read permission.

## Testing Required

- Unit test: history is returned in correct chronological order and includes every version, not just the latest.

## Deliverables

- GetToothHistoryUseCase, controller, route, DTOs, tests, frontend timeline view.

## Acceptance Criteria

- Full version history for a tooth is retrievable and correctly ordered.

## Definition of Done

- Implemented, tested, permission-gated.

---

## Dependency Detail

- **Blocked By:** task-068.
- **Required Before:** None blocking.
- **Can Run In Parallel With:** task-069.
