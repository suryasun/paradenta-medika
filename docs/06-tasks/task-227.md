# task-227: Load Balancer and Health Check Setup

**Phase:** Phase 4 - Multi Branch Platform
**Epic:** BI. Infrastructure Evolution
**Feature:** BI2. Load Balancer
**Module:** Infrastructure
**Priority:** P0 - Blocking

---

## Business Goal

Implement the Load Balancer layer per docs/03-sad/24-deployment.md Section 5 Load Balancer Architecture — SSL termination, health check, traffic distribution, and failover across multiple application instances — the roadmap Phase 4 'Load Balancer' infrastructure item enabling horizontal scaling for Multi Branch Platform.

## Depends On

- task-226 (Dedicated Database Server Provisioning)

## Required Documents

- **AI Contract:** docs/04-ai-contract/01-global-rules.md, docs/04-ai-contract/02-architecture-contract.md, docs/04-ai-contract/09-security-contract.md
- **PRD:** docs/01-prd/vision.md, docs/01-prd/product-goals.md
- **SAD:** docs/03-sad/24-deployment.md (Section 5 Load Balancer Architecture (Responsibilities: SSL Termination, Health Check, Traffic Distribution, Failover, Sticky Session, Rate Limiting; Health Check: GET /health))
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-226.

## Backend Scope

- Application layer: implement a `GET /health` endpoint (if not already present from an earlier phase — confirm before duplicating) returning process/DB/cache connectivity status, per Section 5's literal Health Check spec.
- Infrastructure as Code: Load Balancer configuration performing SSL termination, periodic `GET /health` checks, traffic distribution across application instances, and failover to a healthy instance when one fails to respond, per the Section 5 Request Flow diagram.

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

None.

## API Impact

Adds GET /health if not already implemented in an earlier phase.

## Workflow Impact

Enables multiple stateless application instances to serve traffic behind one entry point, a prerequisite for Section 11's High Availability objective.

## Security Impact

SSL termination and security headers (HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Content-Security-Policy) per Section 6 Reverse Proxy Architecture, applied at this layer or the paired Reverse Proxy.

## Testing Required

- Infrastructure validation: `terraform plan`/`docker compose config` dry-run, health-check smoke test, and a documented rollback drill per docs/03-sad/24-deployment.md Section 11.

## Deliverables

- `GET /health` endpoint (if new)
- Load Balancer IaC/config
- Documented failover test (kill one instance, verify traffic reroutes)

## Acceptance Criteria

Per docs/03-sad/24-deployment.md Section 5 (no dedicated PRD acceptance-criteria file exists for infrastructure):

- `GET /health` returns a healthy status under normal operation and an unhealthy status when a dependency (DB) is unreachable.
- Load Balancer correctly routes away from an instance failing its health check.

## Definition of Done

Load Balancer configured and tested with a documented failover drill.

---

## Dependency Detail

- **Blocked By:** task-226
- **Required Before:** See phase-4-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
