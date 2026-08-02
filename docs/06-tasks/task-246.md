# task-246: Centralized Logging Architecture

**Phase:** Phase 5 - Enterprise Platform
**Epic:** CJ. Observability
**Feature:** CJ1. Logging
**Module:** Infrastructure
**Priority:** P0 - Blocking

---

## Business Goal

Implement centralized structured logging per docs/03-sad/24-deployment.md Part 9 Section 2 Logging Architecture and Section 6's Loki component, aggregating logs from every application instance (task-243) into one searchable store — the foundational layer of the roadmap 'Observability' item.

## Depends On

- task-243 (Application-Tier High Availability)

## Required Documents

- **AI Contract:** docs/04-ai-contract/01-global-rules.md, docs/04-ai-contract/02-architecture-contract.md, docs/04-ai-contract/09-security-contract.md
- **PRD:** docs/01-prd/vision.md, docs/01-prd/product-goals.md
- **SAD:** docs/03-sad/24-deployment.md (Part 9 Section 2 Logging Architecture, Section 6 Monitoring Stack (Loki: Log Aggregation))
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-243.

## Backend Scope

- Application layer: structured (JSON) log output from every service, with correlation id propagated through per the Distributed Tracing task (task-248)'s trace/span fields, and explicit exclusion of sensitive fields (passwords, tokens, secrets) per docs/03-sad/25-security.md's logging rules.
- Infrastructure as Code: Loki deployment aggregating logs from all application instances, Nginx, Docker, database, and the Authentication/Audit services per docs/03-sad/25-security.md Section 10's Supported Sources list.

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

None.

## API Impact

None.

## Workflow Impact

Foundational for Alerting (task-249) and SIEM Integration (task-253), both of which consume centralized logs.

## Security Impact

Logs must never contain passwords, refresh tokens, or raw secrets, per docs/03-sad/10-authentication.md Section 48's explicit logging rule ('Jangan mencatat Password', 'Jangan mencatat Refresh Token').

## Testing Required

- Infrastructure validation: config dry-run, smoke test against a non-production environment, and a documented operational drill (failover/restore/alert-fire test as applicable) per docs/03-sad/24-deployment.md.

## Deliverables

- Structured logging output across all services
- Loki deployment aggregating logs from every Supported Source listed in the Security SAD
- A verification test confirming no sensitive field appears in aggregated logs

## Acceptance Criteria

Per docs/03-sad/24-deployment.md Part 9 (no dedicated PRD acceptance-criteria file exists for infrastructure):

- Logs from every listed source (Backend API, Nginx, Docker, Database, Authentication, Audit Service, OS) are searchable in one place.
- A grep/scan of aggregated logs for password/token patterns returns zero matches.

## Definition of Done

Centralized logging deployed and the sensitive-field exclusion verification passes.

---

## Dependency Detail

- **Blocked By:** task-243
- **Required Before:** See phase-5-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
