# task-288: Patient Emergency Contacts

**Phase:** Patient Module Enhancement (post-roadmap addendum)
**Epic:** PE. Patient Module Enhancement
**Feature:** PE5. Emergency Contacts
**Module:** Patient
**Priority:** P2 - Medium

---

## Business Goal

Implement `patient_emergency_contacts` (UC-PAT-007 "Manage Emergency Contact", already named in `docs/03-sad/12-module-patient.md` §9.2 and its table already shaped in §26.6/`docs/07-data-dictionary.md` §12.5, but never assigned its own implementation task in Phase 1) so registration staff can record who to contact in a clinical emergency.

## Depends On

- task-001 (Create Patient)
- task-028 (Patient Detail)

## Required Documents

- **AI Contract:** `docs/04-ai-contract/06-database-contract.md`
- **PRD:** `docs/01-prd/features/patient.md`
- **SAD:** `docs/03-sad/12-module-patient.md` §9.2 (UC-PAT-007), §12.2 (Emergency Contact tab), §26.6 (table); `docs/03-sad/07-data-dictionary.md` §12.5 (literal column definitions — this task's authoritative field shape, already documented and unchanged by this pass)
- **Design:** `docs/02-design/pages/patient.md` §12.2 (existing tab), §14 (confirms no new UI beyond what already exists)

## Required Existing Code

task-001, task-028 (Patient Detail page, which already lists an Emergency Contact tab per §12.2 — this task fills that tab with a real backend).

## Backend Scope

- New `PatientEmergencyContact` Prisma model: `patientId`, `fullName`, `relationship`, `phoneNumber`, `address` (nullable), matching `docs/03-sad/07-data-dictionary.md` §12.5 exactly (no field renaming).
- New use cases: `AddEmergencyContactUseCase`, `ListEmergencyContactsUseCase`, `UpdateEmergencyContactUseCase`, `DeleteEmergencyContactUseCase`.
- No `isPrimary` concept — unlike `patient_addresses` (task-286), the existing table shape has no primary-contact flag, and this task does not add one (not in the literal §12.5 source); a patient may have any number of emergency contacts with no ordering requirement beyond `createdAt`.

## Frontend Scope

The Emergency Contact tab on Patient Detail (already listed in `docs/02-design/pages/patient.md` §12.2) becomes a real repeatable list: name, relationship, phone, optional address, with add/edit/delete actions.

## Database Impact

Creates `patient_emergency_contacts` table per `docs/03-sad/07-data-dictionary.md` §12.5.

## API Impact

Adds `POST /patients/{id}/emergency-contacts`, `GET /patients/{id}/emergency-contacts`, `PATCH /patients/{id}/emergency-contacts/{contactId}`, `DELETE /patients/{id}/emergency-contacts/{contactId}`.

## Workflow Impact

`PatientDetailResponse`'s `emergencyContacts` array (already documented as `[]` placeholder in §21.4) is now populated for real.

## Security Impact

Gated by the existing `patient.update` permission — no new permission code.

## Testing Required

- Unit tests: add/update/delete an emergency contact; `fullName`, `relationship`, `phoneNumber` required, `address` optional.
- Integration test: full CRUD cycle scoped to one patient, confirming a contact cannot be read/modified via another patient's id.

## Deliverables

- `PatientEmergencyContact` model + migration
- 4 use cases + repository + controller + routes
- Tests

## Acceptance Criteria

Per `docs/01-prd/acceptance-criteria/patient.md` ("New in This Pass"):

- `fullName`, `relationship`, `phoneNumber` are required; `address` is optional.
- A patient may have any number of emergency contacts (including zero).

## Definition of Done

Migration applied, all 4 use cases implemented and tested, Emergency Contact tab UI shipped.

---

## Dependency Detail

- **Blocked By:** task-001, task-028
- **Required Before:** None
- **Can Run In Parallel With:** task-284, task-285, task-286, task-287, task-289
