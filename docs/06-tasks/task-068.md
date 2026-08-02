# task-068: Record / Update Tooth Condition (Odontogram Entry)

**Phase:** Phase 2 - Core Clinical Operations  
**Epic:** O. Interactive Odontogram  
**Feature:** O1. Odontogram Foundation  
**Module:** EMR  
**Priority:** P0 - Blocking

---

## Business Goal

Allow the Doctor to record a clinical finding or treatment outcome against a specific tooth and surface via the Interactive Odontogram, the core write operation of the Odontogram feature.

## Depends On

- task-067
- Phase 1 task-048

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md
- **PRD:** docs/01-prd/features/emr.md
- **SAD:** docs/03-sad/15-module-emr.md Part 3.1B (FDI Tooth Numbering & Tooth Surface Model, line 1585), Part 3.1C (Tooth Condition Model & Odontogram Versioning, line 2123), Section 31 (Interactive Odontogram, line 2873 -- UI Components: Tooth SVG, Surface Overlay, Condition Badge, etc.)
- **Design:** docs/03-sad/15-module-emr.md Section 31 (High Level UI wireframe) is the closest thing to a design spec for this feature; no formal Figma/design-system spec exists in docs/02-design/ (documented gap).

## Required Existing Code

task-067 (Tooth Condition catalog), Phase 1 task-048 (open Visit), FDI tooth numbering scheme from Part 3.1B.

## Backend Scope

- RecordToothConditionUseCase: given a Visit, tooth number (FDI notation per Part 3.1B), surface (per the Tooth Surface Model), and condition (from task-067's catalog), create a new versioned odontogram entry -- per Part 3.1C, entries are versioned/historical, not overwritten in place, so every change becomes a new history point (feeding task-070).
- Endpoint path not literally given in SAD; derive from convention, e.g. POST /api/v1/emr/visits/{visitId}/odontogram -- flagged as convention-derived.

## Frontend Scope

- Interactive Odontogram SVG component per docs/03-sad/15-module-emr.md Section 31 UI Components table (Tooth SVG, Surface Overlay, Condition Badge, Color Legend, Tooltip, Context Menu). This is a substantial, dedicated frontend component -- likely warrants its own follow-up UI-focused task if the SVG interaction complexity exceeds one session; flagged here rather than under-scoped.

## Database Impact

- New odontogram_entries table (versioned/append-only per Part 3.1C), FK to Visit, Patient, tooth_conditions.

## API Impact

- Adds the Odontogram entry endpoint scoped under Visit.

## Workflow Impact

Directly updates per docs/03-sad/15-module-emr.md Section 23 (Procedure Management) business rule: 'Procedure memperbarui Odontogram' -- this Use Case is what Section 23's Procedure recording should invoke.

## Security Impact

- Gated by emr.odontogram.record permission (Doctor role).
- Audit Trail entry required; the append-only/versioned design itself is a security/integrity feature (Section 31: 'setiap perubahan ... langsung memperbarui data klinis, histori, timeline, serta audit trail').

## Testing Required

- Unit test: recording a condition creates a new version rather than overwriting the prior state.
- Unit test: invalid tooth number (outside FDI notation) or inactive Tooth Condition is rejected.

## Deliverables

- RecordToothConditionUseCase, controller, route, DTOs, tests, frontend Odontogram component (or a scoped sub-task if UI complexity requires it).

## Acceptance Criteria

- Tooth condition entries persist as versioned history, never overwritten in place.
- Entry correctly validates tooth number and references an active Tooth Condition.

## Definition of Done

- Implemented, tested, permission-gated, audit-logged.

---

## Dependency Detail

- **Blocked By:** task-067, Phase 1 task-048.
- **Required Before:** task-069, task-070.
- **Can Run In Parallel With:** task-065, task-066.
