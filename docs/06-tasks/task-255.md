# task-255: National Health Integration (SATUSEHAT/HL7 FHIR) — Design Spike

**Phase:** Phase 6 - Healthcare Ecosystem
**Epic:** DA. National Health Integration
**Feature:** DA1. Feasibility & Design
**Module:** Patient
**Priority:** P0 - Blocking

---

## Business Goal

Produce the missing technical design for connecting Parakita to Indonesia's national health platform (SATUSEHAT) via HL7 FHIR, since the only source material is a single one-line Future Enhancement row in docs/03-sad/12-module-patient.md and compliance-readiness bullets in docs/03-sad/15-module-emr.md — neither specifies an actual integration contract.

## Depends On

- task-021 (Clinic Entity)
- task-022 (Branch Entity)
- task-013 (Authentication Middleware)
- task-014 (Authorization Middleware)
- task-006 (Audit Trail Service)

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md, docs/04-ai-contract/04-api-contract.md, docs/04-ai-contract/06-database-contract.md, docs/04-ai-contract/09-security-contract.md
- **PRD:** docs/01-prd/features/patient.md, docs/01-prd/business-rules.md § 2
- **SAD:** docs/03-sad/12-module-patient.md (Section 30 Future Enhancements ('National Health Integration | Integrasi SATUSEHAT / platform nasional')), docs/03-sad/15-module-emr.md Section 15 Security and Compliance (SATUSEHAT Ready, HL7 FHIR Ready — compliance targets, not integration specs)
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-021, task-022, task-013, task-014, task-006.

## Backend Scope

This task does NOT implement a live SATUSEHAT connection. Per CLAUDE.md's Missing Information rule, no SAD document reviewed specifies SATUSEHAT's actual API contract, authentication mechanism, required consent model, or which FHIR resources are mandatory versus optional for a dental clinic use case — 'SATUSEHAT Ready' and 'HL7 FHIR Ready' in Section 15 are compliance *aspirations*, not integration specifications.
- Deliverable is an ADR covering: (a) which Parakita entities map to which FHIR resources (Patient → FHIR Patient, a Visit → FHIR Encounter, a Diagnosis → FHIR Condition — informed by task-256's resource-mapping foundation), (b) the actual SATUSEHAT registration/credentialing process for a clinic (an external administrative step, not something this codebase can configure alone), (c) patient consent requirements for national-registry submission, and (d) a phased rollout plan (which resource types go live first).

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

None (design task).

## API Impact

None (design task). Live SATUSEHAT submission endpoints are explicitly BLOCKED pending this ADR.

## Workflow Impact

Unblocks any future national-registry submission work; without it, no literal endpoint can be specified without guessing at SATUSEHAT's actual API.

## Security Impact

The ADR must address patient consent for external data sharing and the sensitivity of transmitting medical records to a government platform.

## Testing Required

- Not applicable (no code produced). Verification is architecture review sign-off.

## Deliverables

- An ADR covering FHIR resource mapping strategy, SATUSEHAT registration process, consent model, and phased rollout plan

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/patient.md:

- The ADR is reviewed and approved by the project's architecture owner.
- The ADR references task-256's concrete resource-mapping work as its technical foundation.

## Definition of Done

ADR authored and approved. **This task deliberately does not produce a live SATUSEHAT integration.** Per CLAUDE.md's Missing Information rule, further implementation is explicitly BLOCKED until this ADR is approved and SATUSEHAT's actual published API documentation is obtained and reviewed separately.

---

## Dependency Detail

- **Blocked By:** task-021, task-022, task-013, task-014
- **Required Before:** See phase-6-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
