# task-250: Monitoring Dashboards

**Phase:** Phase 5 - Enterprise Platform
**Epic:** CJ. Observability
**Feature:** CJ5. Dashboards
**Module:** Infrastructure
**Priority:** P1 - High

---

## Business Goal

Implement Grafana dashboards per docs/03-sad/24-deployment.md Part 9 Section 7, covering the literal Infrastructure/Application/Business Dashboard content and completing the lower three tiers of the Dashboard Hierarchy (the top tier, Executive, is task-241 in Epic CG).

## Depends On

- task-247 (Metrics Collection)

## Required Documents

- **AI Contract:** docs/04-ai-contract/01-global-rules.md, docs/04-ai-contract/02-architecture-contract.md, docs/04-ai-contract/09-security-contract.md
- **PRD:** docs/01-prd/vision.md, docs/01-prd/product-goals.md
- **SAD:** docs/03-sad/24-deployment.md (Part 9 Section 7 Dashboard & Visualization (Infrastructure Dashboard: CPU/Memory/Disk/Network/Kubernetes Node/Pod Status; Application Dashboard: Request per Second/API Response Time/Error Rate/Active User/Queue Length; Business Dashboard: Appointment Today/Active Patients/Revenue/Payment Status/Invoice Statistics))
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-247.

## Backend Scope

- Infrastructure as Code: Grafana dashboards for each of the three literal tiers (Infrastructure, Application, Business), each with the exact field list given in Section 7, sourced from task-247's Prometheus metrics (Infrastructure/Application tiers) and Reporting's existing dashboard_summaries (Business tier, reusing Phase 3's task-179/180 data rather than re-deriving it).

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

None (dashboard configuration only).

## API Impact

None.

## Workflow Impact

Completes the Dashboard Hierarchy's operational tiers, feeding into task-241's Unified Executive Dashboard.

## Security Impact

Dashboard access restricted per role (Infrastructure/Application tiers to Administrator/DevOps; Business tier per Phase 3's existing Actor Matrix).

## Testing Required

- Infrastructure validation: config dry-run, smoke test against a non-production environment, and a documented operational drill (failover/restore/alert-fire test as applicable) per docs/03-sad/24-deployment.md.

## Deliverables

- Three Grafana dashboards (Infrastructure, Application, Business) matching Section 7's literal field lists exactly

## Acceptance Criteria

Per docs/03-sad/24-deployment.md Part 9 (no dedicated PRD acceptance-criteria file exists for infrastructure):

- Each dashboard displays exactly the literal fields listed in Section 7 for its tier, no more and no fewer.

## Definition of Done

All three dashboards implemented and verified against the literal field lists.

---

## Dependency Detail

- **Blocked By:** task-247
- **Required Before:** See phase-5-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
