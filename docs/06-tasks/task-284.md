# task-284: Patient Profile Extension (Insurance Number & Social Media Handles)

**Phase:** Patient Module Enhancement (post-roadmap addendum)
**Epic:** PE. Patient Module Enhancement
**Feature:** PE1. Extended Profile Fields
**Module:** Patient
**Priority:** P2 - Medium

---

## Business Goal

Add five optional profile fields to the `Patient` entity — `insuranceNumber`, `instagramHandle`, `facebookHandle`, `tiktokHandle`, `whatsappNumber` — so registration staff can capture supplementary contact/identity information already requested by clinic operations, without introducing any new validation burden (all five are free text, none unique, none required).

## Depends On

- task-001 (Create Patient)
- task-027 (Patient List & Search)

## Required Documents

- **AI Contract:** `docs/04-ai-contract/06-database-contract.md`, `docs/04-ai-contract/10-code-generation-rules.md`
- **PRD:** `docs/01-prd/features/patient.md`, `docs/01-prd/business-rules.md` §2.1 (General Rules)
- **SAD:** `docs/03-sad/12-module-patient.md` §5.1 (General Rules), §14.3 (Core Entity), §21.1 (`CreatePatientRequest`), §26.4 (Patients Table)
- **Design:** `docs/02-design/pages/patient.md` §14 ("Insurance & social fields" — Profile tab, grouped under "Kontak Tambahan")

## Required Existing Code

task-001 (`CreatePatientUseCase`), task-029 (`UpdatePatientUseCase`) — extend both, no new use case.

## Backend Scope

- Add `insuranceNumber`, `instagramHandle`, `facebookHandle`, `tiktokHandle`, `whatsappNumber` (all `String?`, `VARCHAR`) to the `Patient` Prisma model and migration.
- Extend `CreatePatientRequestDto`/`UpdatePatientRequestDto` with the five optional fields (no `@IsUnique`, no format validator beyond `@IsOptional() @IsString() @MaxLength(...)`).
- Extend `PatientResponseDto`/`PatientDetailResponseDto` to include the five fields.

## Frontend Scope

Add the five fields as plain text inputs on the Register Patient page and Patient Detail's Profile tab, grouped under a "Kontak Tambahan" sub-heading, per `docs/02-design/pages/patient.md` §14. No new page.

## Database Impact

Adds 5 nullable columns to `patients`: `insurance_number`, `instagram_handle`, `facebook_handle`, `tiktok_handle`, `whatsapp_number`.

## API Impact

Extends `POST /patients`, `PUT /patients/{id}`, and both response DTOs with the 5 new fields. No new endpoint.

## Workflow Impact

None — purely additive fields on the existing Register/Update Patient flow.

## Security Impact

`insuranceNumber` and the social handles join the sensitive-data masking list per `docs/03-sad/12-module-patient.md` §29.3 (already updated this pass). No new permission code — gated by the existing `patient.create`/`patient.update`.

## Testing Required

- Unit test: creating/updating a patient with and without the 5 new fields both succeed; no uniqueness/format constraint is enforced on any of them.
- Integration test: `POST /patients` and `PUT /patients/{id}` accept and round-trip the 5 fields through the response DTO.

## Deliverables

- Migration adding the 5 columns
- Updated `CreatePatientRequestDto`/`UpdatePatientRequestDto`/`PatientResponseDto`/`PatientDetailResponseDto`
- Updated `CreatePatientUseCase`/`UpdatePatientUseCase` tests

## Acceptance Criteria

Per `docs/01-prd/acceptance-criteria/patient.md` ("New in This Pass"):

- All 5 fields are optional; omitting them does not fail validation.
- None of the 5 fields is checked for uniqueness across patients.

## Definition of Done

Migration applied, DTOs/use cases updated, unit + integration tests passing, Profile tab UI shipped per `docs/02-design/pages/patient.md` §14.

**Open question flagged (not resolved here):** `docs/03-sad/07-data-dictionary.md` §12.6 already documents a separate, more structured `patient_insurance` table (multi-insurance-per-patient, FK'd to an `insurance` company catalog with policy/member numbers). The new `insuranceNumber` field on `patients` is a simpler, unrelated free-text field with no relation to that table. Whether the product actually wants both to coexist long-term, or whether `insuranceNumber` should eventually be superseded by the richer `patient_insurance` model, is a product decision **outside the scope of this documentation pass** and must be confirmed before or during implementation — see `docs/03-sad/07-data-dictionary.md` §12.6's note.

---

## Dependency Detail

- **Blocked By:** task-001, task-029
- **Required Before:** None (independent of task-285–289)
- **Can Run In Parallel With:** task-285, task-286, task-287, task-288, task-289
