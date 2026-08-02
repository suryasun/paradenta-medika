# task-030: Archive / Restore Patient

**Phase:** Phase 1 - Foundation (MVP)  
**Epic:** D. Patient Management  
**Feature:** D1. Patient Registration & Profile  
**Module:** Patient  
**Priority:** P2 - Medium

---

## Business Goal

Allow staff to archive a patient record that should no longer appear in active lists (e.g. duplicate or inactive patient) while preserving history, and to restore it if archived by mistake.

## Depends On

- task-001
- task-006

## Required Documents

- **AI Contract:** docs/04-ai-contract/06-database-contract.md (Soft Delete Policy)
- **PRD:** docs/01-prd/business-rules.md Section 2 ("Pasien tidak boleh dihapus apabila memiliki riwayat kunjungan")
- **SAD:** docs/03-sad/12-module-patient.md Section 20.2 (PATCH /patients/{id}/archive, PATCH /patients/{id}/restore)
- **Design:** docs/02-design/pages/patient.md Section 12.3 (Archive action)

## Required Existing Code

task-001, task-006.

## Backend Scope

- ArchivePatientUseCase (soft delete/flag, never a hard delete, consistent with the business rule that a patient with visit history cannot be deleted).
- RestorePatientUseCase.
- PATCH /patients/{id}/archive, PATCH /patients/{id}/restore controllers.

## Frontend Scope

- Archive action on Patient List/Detail; Archived Patient list view (per docs/02-design/navigation.md Patient sidebar: 'Archived Patient').

## Database Impact

- Sets/clears deleted_at (or an explicit archived flag) on the patients row -- never a physical DELETE.

## API Impact

- Adds PATCH /patients/{id}/archive, PATCH /patients/{id}/restore.

## Workflow Impact

Archived patients are excluded from the active Patient List (task-027) but remain referenceable by historical Reservation/EMR/Billing records.

## Security Impact

- Gated by patient.archive permission.
- Audit Trail entry required for both actions.

## Testing Required

- Unit test: archiving excludes the patient from active list results but the record remains retrievable by id.
- Unit test: restoring returns the patient to active list results.

## Deliverables

- Both Use Cases, controllers, routes, DTOs, tests, frontend actions.

## Acceptance Criteria

- Archived patient no longer appears in GET /patients default results.
- Archived patient's historical data remains intact and accessible via direct detail lookup.
- Restore reverses the archive state.

## Definition of Done

- Implemented, tested, permission-gated, audit-logged.

---

## Dependency Detail

- **Blocked By:** task-001, task-006.
- **Required Before:** None blocking.
- **Can Run In Parallel With:** task-027, task-028, task-029.
