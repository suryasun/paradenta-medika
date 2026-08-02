# task-261: Laboratory System — Design Spike

**Phase:** Phase 6 - Healthcare Ecosystem
**Epic:** DD. Laboratory System
**Feature:** DD1. Feasibility & Design
**Module:** EMR
**Priority:** P2 - Medium

---

## Business Goal

Produce the missing technical design for a dedicated Laboratory module, since — as already flagged in Phase 2's ambiguity report — no SAD document reviewed contains a dedicated Laboratory module comparable to the Dental X-Ray module's depth; 'Laboratory' appears only as a generic attachment category ('Laboratory Result') and a report-category label, with zero workflow, entity, or API detail.

## Depends On

- task-134 (Clinical Attachment, Phase 2 — exact task id per phase-2-plan.md Epic Q)
- task-013 (Authentication Middleware)
- task-014 (Authorization Middleware)
- task-006 (Audit Trail Service)

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md, docs/04-ai-contract/04-api-contract.md, docs/04-ai-contract/06-database-contract.md, docs/04-ai-contract/09-security-contract.md
- **PRD:** docs/01-prd/features/emr.md, docs/01-prd/business-rules.md § 5
- **SAD:** docs/03-sad/15-module-emr.md (Scattered generic mentions only: 'Hasil Laboratorium' (attachment field), 'Laboratory Result' (attachment category, Section on Attachment Categories), 'Laboratory' (Reporting Architecture category label) — no dedicated Laboratory module section exists)
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

Phase 2's Clinical Attachment module (Laboratory Result category), task-013, task-014, task-006.

## Backend Scope

This task does NOT implement lab-order or lab-result-workflow code beyond what the existing generic Attachment module (Phase 2) already provides. Per CLAUDE.md's Missing Information rule, there is no SAD-specified Lab Order entity, order-to-result state machine, external lab-interface protocol (e.g. HL7 ORU/ORM messaging), or reference-range/abnormal-flag business rule anywhere in the reviewed documentation.
- Deliverable is an ADR covering: (a) whether Laboratory should become a dedicated module (Lab Order → Specimen → Result → Doctor Review) or remain within the existing generic Attachment category, (b) external lab-interface requirements if any (in-house vs. reference-lab), and (c) the reference-range/abnormal-flag data model needed for clinically meaningful lab results (currently a Laboratory Result attachment is just a file, not structured data).

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

None (design task).

## API Impact

None (design task); a dedicated Lab Order/Result API is explicitly BLOCKED pending this ADR.

## Workflow Impact

Until this ADR is approved, Laboratory Result continues operating as a generic Attachment (Phase 2), which is already functional for file storage but not for structured, orderable lab workflows.

## Security Impact

The ADR must address whether structured lab results (distinct from an opaque attachment file) introduce new sensitive-data-classification requirements.

## Testing Required

- Not applicable (no code produced). Verification is architecture review sign-off.

## Deliverables

- An ADR covering module scope, external interface requirements, and data model for structured lab results

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/emr.md:

- The ADR is reviewed and approved by the project's architecture owner.

## Definition of Done

ADR authored and approved. Implementation explicitly BLOCKED pending this ADR, per CLAUDE.md's Missing Information rule — this is the most under-specified item in the entire Phase 6 roadmap section.

---

## Dependency Detail

- **Blocked By:** Phase 2 Clinical Attachment module
- **Required Before:** See phase-6-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
