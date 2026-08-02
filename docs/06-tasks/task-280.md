# task-280: Clinical Decision Support Rule Engine

**Phase:** Phase 6 - Healthcare Ecosystem
**Epic:** DN. Clinical Decision Support
**Feature:** DN1. CDSS Rule Engine
**Module:** EMR
**Priority:** P1 - High

---

## Business Goal

Implement the Clinical Decision Support System per docs/03-sad/15-module-emr.md Section 6, with the literal nine Supported Recommendation types and the literal Decision Engine flow, delivering the roadmap 'Clinical Decision Support' innovation area.

## Depends On

- Phase 2's EMR clinical entry (Medical History, Diagnosis, Medication, Periodontal Assessment)
- task-013 (Authentication Middleware)
- task-014 (Authorization Middleware)
- task-006 (Audit Trail Service)

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md, docs/04-ai-contract/04-api-contract.md, docs/04-ai-contract/06-database-contract.md, docs/04-ai-contract/09-security-contract.md
- **PRD:** docs/01-prd/features/emr.md, docs/01-prd/business-rules.md § 5
- **SAD:** docs/03-sad/15-module-emr.md (Section 6 Clinical Decision Support System (Supported Recommendation: Drug Allergy Warning, Drug Interaction, Medical Contraindication, Pregnancy Alert, Diabetes Alert, Hypertension Alert, High Risk Patient, Periodontal Risk, Implant Eligibility; Decision Engine: Patient Data → Medical History → Diagnosis → Medication → Rule Engine → Recommendation → Doctor; Rule Example: Diabetes + Pocket Depth > 6mm → Recommend Periodontal Consultation))
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

Phase 2's EMR Medical History, Diagnosis, Prescription, and Periodontal Assessment modules, task-013, task-014, task-006.

## Backend Scope

- Domain layer: `CdssRule` entity/registry implementing the literal nine Supported Recommendation types as discrete, independently-testable rules (not one monolithic function) — each rule takes the literal Decision Engine input chain (Patient Data → Medical History → Diagnosis → Medication) and produces a Recommendation, per the literal worked Rule Example.
- Application layer: `EvaluateCdssRulesUseCase`, invoked whenever relevant clinical data changes (new Diagnosis, new Prescription, updated Periodontal Assessment), surfacing triggered recommendations to the treating doctor.

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

Reads existing EMR clinical tables; writes a cdss_recommendations table recording each triggered recommendation and the doctor's response.

## API Impact

Adds GET /emr/visits/{visitId}/cdss-recommendations (convention-derived).

## Workflow Impact

Runs continuously alongside normal clinical documentation, surfacing safety/quality recommendations in real time rather than as a separate manual lookup step.

## Security Impact

A CDSS recommendation is advisory only — it never blocks or auto-modifies a clinical action; the doctor retains full decision authority, consistent with the same 'assist, never replace' principle already established for the AI Clinical Assistant (task-300).

## Testing Required

- Unit tests for the Use Case/Entity (per docs/05-testing/unit-tests.md).
- Integration test for Controller/Repository (per docs/05-testing/api-tests.md).

## Deliverables

- `CdssRule` registry implementing all nine literal recommendation types
- `EvaluateCdssRulesUseCase`, route, controller, tests including the literal worked Rule Example

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/emr.md:

- All nine literal Supported Recommendation types are independently testable and correctly triggered by their documented conditions.
- The literal worked example (Diabetes + Pocket Depth > 6mm → Recommend Periodontal Consultation) produces the exact documented recommendation.

## Definition of Done

Rule engine implemented and tested against all nine literal recommendation types and the literal worked example.

---

## Dependency Detail

- **Blocked By:** Phase 2's EMR clinical entry modules
- **Required Before:** See phase-6-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
