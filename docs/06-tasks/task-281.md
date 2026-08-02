# task-281: Clinical Alert Engine

**Phase:** Phase 6 - Healthcare Ecosystem
**Epic:** DN. Clinical Decision Support
**Feature:** DN2. Clinical Alert Engine
**Module:** EMR
**Priority:** P1 - High

---

## Business Goal

Implement the Clinical Alert Engine per docs/03-sad/15-module-emr.md Section 7, with the literal ten Supported Alerts, three Alert Severity levels, and the literal Alert Lifecycle, complementing task-309's advisory CDSS recommendations with more urgent, must-acknowledge safety alerts.

## Depends On

- task-280 (Clinical Decision Support Rule Engine)

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md, docs/04-ai-contract/04-api-contract.md, docs/04-ai-contract/06-database-contract.md, docs/04-ai-contract/09-security-contract.md
- **PRD:** docs/01-prd/features/emr.md, docs/01-prd/business-rules.md § 5
- **SAD:** docs/03-sad/15-module-emr.md (Section 7 Clinical Alert Engine (Supported Alerts: Drug Allergy, Duplicate Medication, High Blood Pressure, High Blood Sugar, Pregnancy, Latex Allergy, Antibiotic Prophylaxis, Missed Recall, Missing Consent, Missing X-Ray; Alert Severity: Info/Notification, Warning/Doctor Attention, Critical/Must Confirm; Alert Lifecycle: Generate → Display → Doctor Review → Accept → Dismiss → Audit))
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-280.

## Backend Scope

- Domain layer: `ClinicalAlert` entity (alertType — one of the ten literal types, severity — one of the three literal levels, status per the literal lifecycle: generated/displayed/reviewed/accepted/dismissed).
- Application layer: `GenerateClinicalAlertUseCase` (triggered by the same clinical-data-change events as task-309), `AcknowledgeClinicalAlertUseCase` — a Critical-severity alert requires explicit confirmation before the triggering clinical action (e.g. prescribing) can proceed, per the literal 'Must Confirm' definition; Info/Warning severities do not block.

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

Creates an emr_clinical_alerts table.

## API Impact

Adds GET /emr/visits/{visitId}/clinical-alerts, POST /emr/clinical-alerts/{alertId}/acknowledge (convention-derived).

## Workflow Impact

A Critical alert (e.g. Drug Allergy) can actually gate a clinical action, distinct from CDSS's purely advisory recommendations — this is the one place in Phase 6's AI/clinical-support work where the system does block until a human acknowledges, per the literal 'Must Confirm' rule.

## Security Impact

Every alert generation, review, accept, and dismiss action is audited per the literal Alert Lifecycle's final 'Audit' step.

## Testing Required

- Unit tests for the Use Case/Entity (per docs/05-testing/unit-tests.md).
- Integration test for Controller/Repository (per docs/05-testing/api-tests.md).

## Deliverables

- `ClinicalAlert` entity, migration, repository
- `GenerateClinicalAlertUseCase`, `AcknowledgeClinicalAlertUseCase`, routes, controllers, tests

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/emr.md:

- All ten literal alert types are supported.
- A Critical alert blocks the triggering action until explicitly confirmed; Info/Warning alerts do not block.
- Every lifecycle transition (Generate/Display/Review/Accept/Dismiss) produces an Audit Trail entry.

## Definition of Done

Entity and use cases implemented and tested against all ten literal alert types, all three severities, and the full literal lifecycle.

---

## Dependency Detail

- **Blocked By:** task-280
- **Required Before:** See phase-6-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
