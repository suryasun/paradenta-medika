# task-231: SSO & External Identity Provider — Technical Design Spike

**Phase:** Phase 5 - Enterprise Platform
**Epic:** CA. Identity Federation
**Feature:** CA1. Design & Feasibility
**Module:** Authentication
**Priority:** P0 - Blocking

---

## Business Goal

Produce the missing technical design (protocol selection, IdP integration architecture, token-mapping strategy) required before 'SSO Integration' and 'External Identity Provider' can be implemented, since docs/03-sad/10-authentication.md explicitly scopes these out of the current Authentication design.

## Depends On

- task-007 (Login/JWT foundation, Phase 1)
- task-013 (Authentication Middleware)
- task-014 (Authorization Middleware)
- task-006 (Audit Trail Service)

## Required Documents

- **AI Contract:** docs/04-ai-contract/05-auth-contract.md, docs/04-ai-contract/09-security-contract.md, docs/04-ai-contract/04-api-contract.md
- **PRD:** docs/01-prd/vision.md (no dedicated PRD feature file for Authentication exists)
- **SAD:** docs/03-sad/10-authentication.md (Section 2 (Dokumen ini tidak membahas: OAuth, SSO, LDAP, MFA, Social Login) and Section 47 Future Enhancements (Single Sign-On (SSO), OAuth2, OpenID Connect, LDAP Integration))
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-007, task-013, task-014, task-006.

## Backend Scope

This task does NOT implement SSO or IdP integration code. Per CLAUDE.md's 'Missing Information' rule, docs/03-sad/10-authentication.md explicitly states these topics are out of its scope and lists them only as an unordered 'Future Enhancements' bullet list with zero protocol choice, zero endpoint spec, zero token-mapping rule, and zero session-interop rule with the existing JWT/refresh-token design (task-007–task-012). Implementing against this would require inventing an API, which CLAUDE.md prohibits.
- Deliverable is a design document (an Architecture Decision Record) that: (a) selects a protocol (SAML 2.0 vs OpenID Connect, informed by the Future Enhancements list naming both OAuth2 and OpenID Connect but not SAML), (b) defines how a federated identity maps to Parakita's existing `User`/`system_user_branches`/RBAC model (task-015–task-020, task-210), (c) defines session/token interoperability with the existing JWT+refresh-token design (docs/03-sad/10-authentication.md Sections on JWT/Session), and (d) defines provisioning behavior for a federated user who has no local account (auto-provision vs admin-approval, referencing UC-SYS-001 Provision User's existing maker-checker pattern).

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

None (design task; no code).

## API Impact

None (design task; no code). Subsequent implementation tasks are explicitly blocked until this ADR exists.

## Workflow Impact

Unblocks all future SSO/IdP implementation work; without it, no literal endpoint or schema can be specified without guessing.

## Security Impact

The ADR must explicitly address: token replay protection, IdP-compromise blast radius, and how federated login interacts with the existing MFA-is-Future-only status noted in Section 47.

## Testing Required

- Not applicable in the conventional sense (no code is produced). Verification instead consists of: architecture review sign-off, and a checklist confirming all four sub-questions in Backend Scope are answered in the ADR.

## Deliverables

- An Architecture Decision Record covering protocol choice, identity-mapping, session interoperability, and provisioning behavior
- A literal endpoint/schema proposal ready for a follow-up implementation task once approved

## Acceptance Criteria

Per docs/03-sad/10-authentication.md (authoritative; no dedicated PRD acceptance-criteria file):

- The ADR is reviewed and approved by the project's architecture owner (a human decision this task cannot make on its own, per CLAUDE.md's 'never make architectural assumptions').
- The ADR resolves all four sub-questions listed in Backend Scope.

## Definition of Done

ADR authored and approved. **This task deliberately does not produce working SSO/IdP code.** Per CLAUDE.md's Missing Information rule, further implementation (e.g. an OIDC callback endpoint) is explicitly BLOCKED and out of scope for Phase 5 until this ADR is approved and a follow-up task is separately specified against it — inventing that endpoint now would violate 'never invent APIs.'

---

## Dependency Detail

- **Blocked By:** task-007, task-013, task-014
- **Required Before:** See phase-5-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
