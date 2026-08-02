# Acceptance Criteria: Patient

## Missing Documentation

`docs/03-sad/12-module-patient.md` does not contain a dedicated "Test Scenario" or "Acceptance Criteria" section (verified by full-text search). Per project policy (see `CLAUDE.md`: "If information is missing, explicitly report the missing documentation instead of guessing"), no acceptance criteria are fabricated here.

## What Exists Instead

Acceptance testing for this module should be derived from the following sections of `docs/03-sad/12-module-patient.md`, which define the binding business and validation rules the module must satisfy:

- Business Rules (see `docs/01-prd/business-rules.md`, "Patient" section)
- Use Cases / Functional Flow (see `docs/01-prd/features/patient.md`)

## Recommended Action

Before implementation of this module begins, the QA/Solution Architecture team should author an explicit Test Scenario section in `docs/03-sad/12-module-patient.md` (matching the format used in `docs/03-sad/17-module-finance.md` Section 11 or `docs/03-sad/16-module-billing.md` Part 10) so that acceptance criteria for this module are traceable to source documentation like every other module.
