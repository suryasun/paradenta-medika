# task-287: Patient Referral Source

**Phase:** Patient Module Enhancement (post-roadmap addendum)
**Epic:** PE. Patient Module Enhancement
**Feature:** PE4. Referral Source Tracking
**Module:** Patient / Master Data
**Priority:** P2 - Medium

---

## Business Goal

Let registration staff record where a patient heard about the clinic (Google, Instagram, Facebook, TikTok, Teman/Friend, Datang Sendiri/Walk-in, Alodokter, Staf Klinik, Lain-lain/Other) at registration time, and — specifically for the "Staf Klinik" source — which staff member (doctor, nurse, or other employee) gets the referral credit. This is a marketing/lead-source field, explicitly distinct from the existing clinical `Referral` entity in the EMR module (refer a patient to a specialist/hospital/lab from a Visit).

## Depends On

- task-001 (Create Patient)
- task-029 (Update Patient)

## Required Documents

- **AI Contract:** `docs/04-ai-contract/07-module-contract.md` (Master Data owns the catalog; Patient only stores the FK)
- **PRD:** `docs/01-prd/features/patient.md`, `docs/01-prd/business-rules.md` §2.1
- **SAD:** `docs/03-sad/12-module-patient.md` §5.1, §14.3, §14.5 (disambiguation from clinical Referral), §15.2; `docs/03-sad/11-module-master-data.md` §8.4, §11.25 (Referral Source catalog); `docs/03-sad/07-data-dictionary.md` §10.25, §12.1
- **Design:** `docs/02-design/pages/patient.md` §14 ("Referral source — Profile tab")

## Required Existing Code

task-001, task-029; the `mst_referral_sources` Master Data catalog (part of this task's own Backend Scope, or task-285's sibling — see below) and `User` entity (for `referredByUserId`).

## Backend Scope

- New `ReferralSource` Master Data catalog (Prisma model, migration, seed with the 9 example entries from `docs/03-sad/11-module-master-data.md` §11.25) — a simple read-mostly catalog following the same shape as task-285's region tables, including a `requiresReferrer: Boolean` flag (true only for "Staf Klinik").
- Add `referralSourceId` (nullable FK) and `referredByUserId` (nullable FK to `User`) to `Patient`.
- Extend `CreatePatientUseCase`/`UpdatePatientUseCase`: if `referralSourceId` is provided, validate it exists and is active; `referredByUserId` is accepted but never required server-side, even when the selected source has `requiresReferrer: true` (the client is responsible for prompting; the server does not hard-block a missing referrer, per `docs/03-sad/12-module-patient.md` §5.1's "opsional" wording).

## Frontend Scope

Referral-source dropdown on the Register Patient page / Patient Detail's Profile tab, with a conditional staff-picker field that appears only when the selected source has `requiresReferrer: true`, per `docs/02-design/pages/patient.md` §14.

## Database Impact

Creates `referral_sources` table (Master Data). Adds `referral_source_id`, `referred_by_user_id` (both nullable FK) to `patients`.

## API Impact

Adds `GET /master-data/referral-sources` (list, for the dropdown). Extends `POST /patients`, `PUT /patients/{id}`, and response DTOs with `referralSourceId`/`referredByUserId`.

## Workflow Impact

None beyond the registration/update flow — this is a data-capture field, not a new business process.

## Security Impact

`GET /master-data/referral-sources` gated by `masterdata.referral-source.read` (new permission, reused pattern). Writing `referralSourceId`/`referredByUserId` on a patient uses the existing `patient.create`/`patient.update` permissions — no new write permission.

## Testing Required

- Unit test: creating a patient with an invalid/inactive `referralSourceId` is rejected; a valid one succeeds with or without `referredByUserId`.
- Unit test confirming `referredByUserId` is never required even when the selected source has `requiresReferrer: true` (server-side is permissive; the requirement is UI-only).

## Deliverables

- `ReferralSource` model + migration + seed
- `Patient.referralSourceId`/`referredByUserId` columns + migration
- Updated Create/Update Patient use cases + DTOs
- `GET /master-data/referral-sources` endpoint

## Acceptance Criteria

Per `docs/01-prd/acceptance-criteria/patient.md` ("New in This Pass"):

- `referralSourceId` is optional; when set, it must reference an active catalog entry.
- `referredByUserId` is only meaningful when the referral source has `requiresReferrer: true`, but the server never requires it even then.
- The clinical `Referral` entity (EMR) is never referenced, joined, or conflated with this feature anywhere in the implementation.

## Definition of Done

Catalog seeded, `Patient` columns added, Create/Update Patient extended and tested, dropdown + conditional field shipped in the UI, naming collision with clinical `Referral` avoided end-to-end (verified by code review, not just documentation).

---

## Dependency Detail

- **Blocked By:** task-001, task-029
- **Required Before:** None
- **Can Run In Parallel With:** task-284, task-285, task-286, task-288, task-289
