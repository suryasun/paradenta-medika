# task-253: SIEM Integration

**Phase:** Phase 5 - Enterprise Platform
**Epic:** CM. SIEM Integration
**Feature:** CM1. SIEM Export
**Module:** Infrastructure
**Priority:** P1 - High

---

## Business Goal

Implement SIEM integration per docs/03-sad/25-security.md Section 10 Centralized Logging & SIEM Readiness, shipping centralized logs (task-246) and security events to a SIEM platform, realizing the roadmap 'SIEM Integration' item.

## Depends On

- task-246 (Centralized Logging Architecture)
- task-192 (Audit Log Query, Phase 3)

## Required Documents

- **AI Contract:** docs/04-ai-contract/01-global-rules.md, docs/04-ai-contract/02-architecture-contract.md, docs/04-ai-contract/09-security-contract.md
- **PRD:** docs/01-prd/vision.md, docs/01-prd/product-goals.md
- **SAD:** docs/03-sad/25-security.md (Section 10 Centralized Logging and SIEM Readiness (Supported Sources: Backend API, Nginx, Docker, Database, Authentication, Audit Service, Operating System; SIEM Architecture: Application → Central Log → SIEM → Alert → Security Team; Future Integration: ELK Stack, OpenSearch, Grafana Loki, Microsoft Sentinel, Splunk))
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-246 (Centralized Logging Architecture), task-192.

## Backend Scope

- Infrastructure as Code: a log-shipping connector from the centralized logging store (task-246's Loki deployment, named directly in the SAD's Future Integration list) to a SIEM platform, covering every literal Supported Source (Backend API, Nginx, Docker, Database, Authentication, Audit Service, Operating System).
- The literal SIEM Architecture flow (Application → Central Log → SIEM → Alert → Security Team) is implemented end-to-end, including the Alert-to-Security-Team notification step (reusing task-249's Alerting infrastructure for the final delivery leg).
- SIEM platform choice among the SAD's named candidates (ELK Stack, OpenSearch, Grafana Loki, Microsoft Sentinel, Splunk) must be confirmed against actual organizational/licensing constraints during implementation — the SAD lists five options without selecting one.

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

None.

## API Impact

None.

## Workflow Impact

Extends task-253's central audit and task-246's centralized logging with external security-team visibility and correlation, per the literal SIEM Architecture flow.

## Security Impact

Realizes the Enterprise Security 'SIEM Integration' item and Section 12.3's 'SIEM integration' System-module roadmap maturity row.

## Testing Required

- Infrastructure validation: config dry-run, smoke test against a non-production environment, and a documented operational drill (failover/restore/alert-fire test as applicable) per docs/03-sad/24-deployment.md.

## Deliverables

- SIEM platform selection decision (documented)
- Log-shipping connector covering all seven literal Supported Sources
- End-to-end verification of the Application → Central Log → SIEM → Alert → Security Team flow

## Acceptance Criteria

Per docs/03-sad/25-security.md Section 10 (no dedicated PRD acceptance-criteria file exists for infrastructure/security):

- A test security event (e.g. a simulated failed-login spike) flows from source through Central Log to the SIEM and produces a Security Team alert.
- All seven literal Supported Sources are represented in the SIEM.

## Definition of Done

SIEM integration implemented and the end-to-end flow verified with a test security event. **Ambiguity flagged:** the SAD names five SIEM platform candidates without selecting one; this task's Backend Scope requires that choice to be made and documented, not guessed here.

---

## Dependency Detail

- **Blocked By:** task-246 (Centralized Logging Architecture), task-192
- **Required Before:** See phase-5-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
