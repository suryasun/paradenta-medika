# task-245: Horizontal Auto-Scaling

**Phase:** Phase 5 - Enterprise Platform
**Epic:** CI. Reliability
**Feature:** CI3. Horizontal Scaling
**Module:** Infrastructure
**Priority:** P1 - High

---

## Business Goal

Implement automatic horizontal scaling for the Frontend, Backend API, and Background Worker tiers per docs/03-sad/24-deployment.md Section 8 Scaling Strategy and its Future Expansion 'Kubernetes Auto Scaling' item, realizing the roadmap 'Horizontal Scaling' item as an automated capability rather than the manual instance-count changes implied by Phase 4's Load Balancer setup.

## Depends On

- task-243 (Application-Tier High Availability)

## Required Documents

- **AI Contract:** docs/04-ai-contract/01-global-rules.md, docs/04-ai-contract/02-architecture-contract.md, docs/04-ai-contract/09-security-contract.md
- **PRD:** docs/01-prd/vision.md, docs/01-prd/product-goals.md
- **SAD:** docs/03-sad/24-deployment.md (Section 8 Scaling Strategy (Horizontal Scaling: Frontend, Backend API, Worker, Reverse Proxy; Scaling Example: Frontend 2→6, Backend 2→10, Worker 1→5), Section 11 Capacity Planning (Future Expansion: Kubernetes Auto Scaling))
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-243.

## Backend Scope

- Infrastructure as Code: Horizontal Pod Autoscaler (or equivalent) configuration for Frontend, Backend API, and Worker tiers, scaling within the literal ranges given as an example in Section 8 (Frontend 2→6, Backend 2→10, Worker 1→5) based on CPU/memory or request-rate metrics (from task-247's Metrics Collection).

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

None (MySQL/Redis remain vertically scaled per Section 8's explicit statement that only Frontend/Backend/Worker/Reverse-Proxy scale horizontally).

## API Impact

None.

## Workflow Impact

Automates what would otherwise be a manual capacity-planning decision, directly supporting Multi Branch Platform's (Phase 4) growth in concurrent load as more branches come online.

## Security Impact

No new attack surface; new instances inherit the same externalized configuration/secrets as existing ones.

## Testing Required

- Infrastructure validation: config dry-run, smoke test against a non-production environment, and a documented operational drill (failover/restore/alert-fire test as applicable) per docs/03-sad/24-deployment.md.

## Deliverables

- Autoscaler configuration for Frontend/Backend/Worker
- Load test demonstrating scale-out under simulated demand and scale-in once demand subsides

## Acceptance Criteria

Per docs/03-sad/24-deployment.md Section 8 (no dedicated PRD acceptance-criteria file exists for infrastructure):

- Under simulated load, the Backend API tier scales out within the documented range and back in once load subsides, with no manual intervention.

## Definition of Done

Autoscaling configured and validated with a load test showing both scale-out and scale-in.

---

## Dependency Detail

- **Blocked By:** task-243
- **Required Before:** See phase-5-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
