# task-252: Secret Management & Rotation

**Phase:** Phase 5 - Enterprise Platform
**Epic:** CL. Enterprise Security
**Feature:** CL1. Secret Management
**Module:** Infrastructure
**Priority:** P0 - Blocking

---

## Business Goal

Implement production Secret Management per docs/03-sad/24-deployment.md Part 6 Section 3 and Part 8 Section 8, with the literal Secret Categories, Kubernetes Secret storage per environment, and the literal Rotation Policy table, realizing the roadmap 'Secret Management' item and docs/03-sad/25-security.md's Secret Management Rules ('Tidak boleh di-hardcode', 'Tidak boleh disimpan di repository Git').

## Depends On

- task-243 (Application-Tier High Availability)

## Required Documents

- **AI Contract:** docs/04-ai-contract/01-global-rules.md, docs/04-ai-contract/02-architecture-contract.md, docs/04-ai-contract/09-security-contract.md
- **PRD:** docs/01-prd/vision.md, docs/01-prd/product-goals.md
- **SAD:** docs/03-sad/24-deployment.md (Part 6 Section 3 Secret Management (Secret Categories: Database Password, JWT Secret, Refresh Token Secret, SMTP Password, Redis Password, API Keys, Object Storage Access Key, Object Storage Secret Key; Storage: Kubernetes Secret for Development/QA/Staging/Production, Local Secret File for Local), Part 8 Section 8 Secret Management and Rotation (Secret Lifecycle: Create→Encrypt→Store→Deploy→Rotate→Revoke; Rotation Policy: API Key 90 days, JWT Secret per policy, Database Password 180 days)) and docs/03-sad/25-security.md Secret Management Rules
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-243 (Application-Tier High Availability)

## Backend Scope

- Infrastructure as Code: Kubernetes Secret (or equivalent) storage for every literal Secret Category, matching the Storage-by-Environment table exactly (Local Secret File for Local; Kubernetes Secret for Development/QA/Staging/Production).
- A rotation automation job implementing the literal Rotation Policy table (API Key: 90 days, Database Password: 180 days, JWT Secret: per an explicitly documented policy — the SAD's table entry for JWT Secret says 'Sesuai Kebijakan' (per policy) without stating the actual interval, so this task's Definition of Done requires that interval to be explicitly documented as part of implementation, not left as an undefined 'policy').
- Every secret consumer already built in Phase 1–4 (database connections, JWT signing, SMTP, Redis, Object Storage, and this phase's Message Broker task-256) is confirmed to read from this Secret Management layer rather than a hardcoded value or committed .env file.

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

None.

## API Impact

None.

## Workflow Impact

Every module built across Phase 1–5 that touches a credential now sources it from this managed layer.

## Security Impact

No secret is hardcoded or committed to Git (verified by a repository scan). Rotation happens on schedule without requiring an application redeploy for most categories.

## Testing Required

- Infrastructure validation: config dry-run, smoke test against a non-production environment, and a documented operational drill (failover/restore/alert-fire test as applicable) per docs/03-sad/24-deployment.md.

## Deliverables

- Kubernetes Secret configuration for every literal Secret Category, per environment
- Rotation automation matching the literal Rotation Policy table, with the JWT Secret interval explicitly documented
- Repository secret-scan confirming zero hardcoded/committed secrets

## Acceptance Criteria

Per docs/03-sad/24-deployment.md Part 6/Part 8 and docs/03-sad/25-security.md (no dedicated PRD acceptance-criteria file exists for infrastructure/security):

- A repository scan finds zero hardcoded secrets or committed credential files.
- API Key and Database Password rotate automatically on their literal 90-day/180-day schedules without manual intervention.
- The JWT Secret rotation interval is explicitly documented (not left as 'per policy' with no actual value).

## Definition of Done

Secret Management deployed, rotation automation verified for all three literal rotation entries, and the repository secret-scan passes clean.

---

## Dependency Detail

- **Blocked By:** task-243 (Application-Tier High Availability)
- **Required Before:** See phase-5-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
