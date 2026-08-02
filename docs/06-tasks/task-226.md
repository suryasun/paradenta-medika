# task-226: Dedicated Database Server Provisioning

**Phase:** Phase 4 - Multi Branch Platform
**Epic:** BI. Infrastructure Evolution
**Feature:** BI1. Dedicated Database Server
**Module:** Infrastructure
**Priority:** P0 - Blocking

---

## Business Goal

Provision a dedicated MySQL database server (separated from the application host) per docs/03-sad/24-deployment.md Section 4 Server Specification and Section 2 Cloud Architecture, replacing Phase 1–3's implicit shared/co-located database assumption — the roadmap Phase 4 'Dedicated Database Server' infrastructure item, required before Load Balancer/HA work can be layered on top.

## Depends On

- None (foundational within this Epic).

## Required Documents

- **AI Contract:** docs/04-ai-contract/01-global-rules.md, docs/04-ai-contract/02-architecture-contract.md, docs/04-ai-contract/09-security-contract.md
- **PRD:** docs/01-prd/vision.md, docs/01-prd/product-goals.md
- **SAD:** docs/03-sad/24-deployment.md (Part 2, Section 2 Cloud Architecture, Section 4 Server Specification)
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

None (infrastructure task; no application code prerequisite).

## Backend Scope

- Infrastructure as Code: provisioning definition (Docker Compose service or Terraform resource, matching whichever IaC tool is already used elsewhere in the repo — confirm existing convention before introducing a new one, per CLAUDE.md 'must not introduce new libraries/tools unless approved') for a standalone MySQL instance sized per Section 4's Server Specification.
- Externalized configuration (connection string, credentials via secret manager) per docs/03-sad/24-deployment.md Part 6 Environment Configuration, not hardcoded.
- Migration/runbook documenting the cutover from any existing co-located database to the dedicated instance with a rollback plan.

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

No schema change; this is a topology change (dedicated host) for the existing schema.

## API Impact

None.

## Workflow Impact

Foundational for Multi Branch Platform's scalability objective; all application modules continue functioning unchanged against the new connection string.

## Security Impact

Database credentials must be least-privilege per docs/03-sad/24-deployment.md's production requirements; connection must use TLS.

## Testing Required

- Infrastructure validation: `terraform plan`/`docker compose config` dry-run, health-check smoke test, and a documented rollback drill per docs/03-sad/24-deployment.md Section 11.

## Deliverables

- IaC definition for the dedicated database server
- Externalized configuration wiring
- Cutover runbook with rollback plan
- A `docker compose config` (or `terraform plan`) dry-run and a connectivity smoke test

## Acceptance Criteria

Per docs/03-sad/24-deployment.md Section 4 (no dedicated PRD acceptance-criteria file exists for infrastructure):

- Application connects successfully to the dedicated database server using externalized configuration (no hardcoded credentials).
- Rollback plan is documented and has been dry-run tested.

## Definition of Done

Server provisioned (or its IaC definition merge-ready), configuration externalized, cutover runbook validated by dry-run.

---

## Dependency Detail

- **Blocked By:** None
- **Required Before:** See phase-4-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
