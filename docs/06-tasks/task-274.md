# task-274: AI Clinical Assistant — Capabilities

**Phase:** Phase 6 - Healthcare Ecosystem
**Epic:** DK. AI Clinical Assistant
**Feature:** DK2. Assistant Capabilities
**Module:** EMR
**Priority:** P2 - Medium

---

## Business Goal

Implement the literal AI Clinical Assistant capabilities per docs/03-sad/15-module-emr.md Section 14 (Summarize Visit, Generate SOAP Draft, Suggest ICD-10, Suggest Treatment, Generate Referral Letter, Generate Patient Education), each writing its output through task-299's governed AI pipeline.

## Depends On

- task-273 (AI Clinical Pipeline Governance Foundation)

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md, docs/04-ai-contract/04-api-contract.md, docs/04-ai-contract/06-database-contract.md, docs/04-ai-contract/09-security-contract.md
- **PRD:** docs/01-prd/features/emr.md, docs/01-prd/business-rules.md § 5
- **SAD:** docs/03-sad/15-module-emr.md (Section 14 AI Clinical Assistant (Capabilities: Summarize Visit, Generate SOAP Draft, Suggest ICD-10, Suggest Treatment, Generate Referral Letter, Generate Patient Education; worked Example: pocket/bleeding/bone-loss/mobility input → periodontitis finding + SRP recommendation output))
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-273, Phase 2's EMR clinical entry (SOAP notes, Odontogram, Periodontal Assessment).

## Backend Scope

This task does NOT select or implement a specific AI/LLM model — no SAD document names a model provider or hosting approach for these capabilities (unlike, say, DE's DICOM standard, which is a public specification). Model selection must be confirmed during implementation, not guessed.
- Application layer: six use cases (`SummarizeVisitUseCase`, `GenerateSoapDraftUseCase`, `SuggestIcd10UseCase`, `SuggestTreatmentUseCase`, `GenerateReferralLetterUseCase`, `GeneratePatientEducationUseCase`), each: (a) extracts input features from the relevant EMR data (Visit, Odontogram, Periodontal Assessment per the worked Example), (b) invokes the selected AI model, (c) records the result via task-299's `RecordAiPredictionUseCase`, and (d) returns a draft the doctor must explicitly accept before it becomes part of the permanent clinical record — no AI output is auto-committed to the EMR.

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

Reads existing EMR clinical tables; writes via task-299's emr_ai_predictions table.

## API Impact

Adds POST /emr/visits/{visitId}/ai-assistant/{capability} for each of the six literal capabilities (convention-derived).

## Workflow Impact

Assists — never replaces — the doctor's own clinical documentation and decision-making, per the mandatory review step inherited from task-299.

## Security Impact

No AI-generated clinical content (SOAP draft, ICD-10 suggestion, treatment suggestion, referral letter, patient education) becomes part of the permanent medical record without the doctor's explicit acceptance via task-299's review flow.

## Testing Required

- Unit tests for the Use Case/Entity (per docs/05-testing/unit-tests.md).
- Integration test for Controller/Repository (per docs/05-testing/api-tests.md).

## Deliverables

- Six AI Clinical Assistant use cases, routes, controllers, tests
- Model-selection decision (documented, not invented)

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/emr.md:

- Each of the six literal capabilities produces a draft output that requires explicit doctor acceptance before affecting the permanent EMR record.
- The worked Example's input pattern (periodontal findings) produces a clinically coherent suggested finding via the Suggest Treatment capability.

## Definition of Done

All six capabilities implemented and tested against the mandatory-review requirement. **Ambiguity flagged:** AI model/provider selection is not specified in the SAD and must be documented during implementation.

---

## Dependency Detail

- **Blocked By:** task-273
- **Required Before:** See phase-6-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
