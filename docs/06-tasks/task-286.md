# task-286: Patient Address Book (Multi-Address, Region-Backed)

**Phase:** Patient Module Enhancement (post-roadmap addendum)
**Epic:** PE. Patient Module Enhancement
**Feature:** PE3. Patient Addresses
**Module:** Patient
**Priority:** P1 - High

---

## Business Goal

Replace the current single free-text `Patient.address` column with a proper `patient_addresses` table supporting multiple addresses per patient, each backed by the real 4-level region catalog from task-285 (Provinsi/Kabupaten-Kota/Kecamatan/Kelurahan) instead of free text — realizing the address design already specified in `docs/03-sad/12-module-patient.md` §21.1/§26.5, but never actually implemented in Phase 1.

## Depends On

- task-001 (Create Patient)
- task-029 (Update Patient)
- task-285 (Regional Address Master Data)

## Required Documents

- **AI Contract:** `docs/04-ai-contract/06-database-contract.md`, `docs/04-ai-contract/07-module-contract.md` (Patient reads Master Data's region catalog via its published repository interface, never queries `provinces`/`regencies`/etc. tables directly)
- **PRD:** `docs/01-prd/features/patient.md`, `docs/01-prd/business-rules.md` §2.1
- **SAD:** `docs/03-sad/12-module-patient.md` §5.1, §14.3, §15.2, §21.1/§21.2, §26.5; `docs/03-sad/07-data-dictionary.md` §12.4 (reconciled FK-based `patient_address` definition)
- **Design:** `docs/02-design/pages/patient.md` §14 ("Address tab — cascading region selects")

## Required Existing Code

task-001, task-029; task-285's `IProvinceRepository`/`IRegencyRepository`/`IDistrictRepository`/`IVillageRepository` (or equivalent Master Data read services) consumed as a Repository Interface per `docs/04-ai-contract/07-module-contract.md` MOD-003.

## Backend Scope

- New `PatientAddress` Prisma model: `patientId`, `provinceId`, `regencyId`, `districtId`, `villageId` (all FK), `addressLine` (Text), `postalCode` (nullable), `isPrimary` (Boolean).
- `Patient.address` (the current single free-text column) is retained for backward compatibility with any existing data and with Quick Add Patient's own free-text address (task-289) — **not dropped in this task**. `patient_addresses` is the structured, multi-address complement, not a replacement migration. Reconciling/migrating existing `Patient.address` values into the new table is explicitly out of scope here and must be a separate data-migration task if ever needed.
- New use cases: `AddPatientAddressUseCase`, `ListPatientAddressesUseCase`, `UpdatePatientAddressUseCase`, `DeletePatientAddressUseCase`, `SetPrimaryPatientAddressUseCase`.
- Enforce exactly one `isPrimary: true` row per patient at the application layer (same pattern as task-210's branch-assignment `isDefault` enforcement in the Phase 4 System module, reused here for consistency) — not a DB constraint, since MySQL cannot express "exactly one true per group" declaratively.

## Frontend Scope

Address tab on Patient Detail becomes a repeatable list of address cards, each with the 4 cascading region selects (Province → Regency → District → Village) plus `addressLine`/`postalCode`, and a "Set as Primary" action. Per `docs/02-design/pages/patient.md` §14.

## Database Impact

Creates `patient_addresses` table (see `docs/03-sad/07-data-dictionary.md` §12.4, reconciled definition).

## API Impact

Adds `POST /patients/{id}/addresses`, `GET /patients/{id}/addresses`, `PATCH /patients/{id}/addresses/{addressId}`, `DELETE /patients/{id}/addresses/{addressId}`, `POST /patients/{id}/addresses/{addressId}/set-primary`.

## Workflow Impact

`PatientDetailResponse`'s `addresses` array (already documented as `[]` placeholder in §21.4) is now populated for real.

## Security Impact

Gated by the existing `patient.update` permission — no new permission code, since address management is part of the standard patient-edit capability already controlled by that permission.

## Testing Required

- Unit tests: adding a second address does not silently unset the first's `isPrimary`; explicitly setting a new primary does unset the previous one; deleting the primary address when other addresses exist requires the caller to designate a new primary (reject deletion of the sole/primary address without one, `PATIENT_ADDRESS_PRIMARY_REQUIRED` or similar).
- Integration test: full CRUD cycle against a seeded region hierarchy from task-285.

## Deliverables

- `PatientAddress` model + migration
- 5 use cases + repository + controller + routes
- Tests covering the primary-address invariant

## Acceptance Criteria

Per `docs/01-prd/acceptance-criteria/patient.md` ("New in This Pass"):

- A patient can have zero or more addresses, but exactly one is flagged primary when at least one exists.
- Every address level must reference a real, active Master Data catalog row — the API rejects a `provinceId`/`regencyId`/`districtId`/`villageId` that doesn't exist or whose parent chain doesn't match (e.g. a `villageId` that doesn't actually belong to the given `districtId`).

## Definition of Done

Migration applied, all 5 use cases implemented and tested, Address tab UI shipped, primary-address invariant enforced and covered by tests.

---

## Dependency Detail

- **Blocked By:** task-001, task-029, task-285
- **Required Before:** None
- **Can Run In Parallel With:** task-284, task-287, task-288
