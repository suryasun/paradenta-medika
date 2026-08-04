# Acceptance Criteria: Patient

## Missing Documentation

`docs/03-sad/12-module-patient.md` does not contain a dedicated "Test Scenario" or "Acceptance Criteria" section (verified by full-text search). Per project policy (see `CLAUDE.md`: "If information is missing, explicitly report the missing documentation instead of guessing"), no acceptance criteria are fabricated here.

## What Exists Instead

Acceptance testing for this module should be derived from the following sections of `docs/03-sad/12-module-patient.md`, which define the binding business and validation rules the module must satisfy:

- Business Rules (see `docs/01-prd/business-rules.md`, "Patient" section)
- Use Cases / Functional Flow (see `docs/01-prd/features/patient.md`)

## Recommended Action

Before implementation of this module begins, the QA/Solution Architecture team should author an explicit Test Scenario section in `docs/03-sad/12-module-patient.md` (matching the format used in `docs/03-sad/17-module-finance.md` Section 11 or `docs/03-sad/16-module-billing.md` Part 10) so that acceptance criteria for this module are traceable to source documentation like every other module.

---

## New in This Pass (Patient Module Enhancement, task-284–289)

Unlike the rest of this module, the 6 new capabilities below have concrete, literal rules newly authored directly in `docs/03-sad/12-module-patient.md` and `docs/01-prd/business-rules.md` §2 as part of this same documentation pass — these AC entries are derived from that new source text, not fabricated independently of it:

- **Profile fields (task-284):** `insuranceNumber`, `instagramHandle`, `facebookHandle`, `tiktokHandle`, `whatsappNumber` are all optional; none are validated for uniqueness or format. (Source: §5.1)
- **Regional address (task-285/286):** a patient can have zero or more addresses, but exactly one is flagged `isPrimary` when at least one exists. Every address level (Province/Regency/District/Village) must reference a real, active Master Data catalog row — a client cannot submit a free-text value for any level. (Source: §5.1, §14.3, §26.5)
- **Referral source (task-287):** `referralSourceId` is optional. `referredByUserId` is only accepted (and only meaningful) when the selected referral source's catalog entry has `requiresReferrer: true`; the server does not require it even for that case. The clinical `Referral` entity (EMR module) is never conflated with this field. (Source: §5.1, §14.5)
- **Emergency contacts:** requires `full_name`, `relationship`, and `phone`; `address` is optional. (Source: existing `docs/03-sad/07-data-dictionary.md` §12.5, unchanged by this pass)
- **Quick Add Patient (task-289):** requires exactly `fullName`, `address` (free text), `phoneNumber`, `identityNumber` — no other field may be required by this endpoint. A patient created this way receives a real MRN and `Registered` status, and can be completed later via the normal Update Patient flow. Only reachable from the Reservation booking screen's patient-search step. (Source: §5.5, §17.1, §21.1a)

These are documentation-derived expectations for the *design*, not a substitute for the still-missing formal Test Scenario section recommended above — once that section exists, these bullets should be folded into it rather than maintained separately here.
