# task-247: Metrics Collection

**Phase:** Phase 5 - Enterprise Platform
**Epic:** CJ. Observability
**Feature:** CJ2. Metrics
**Module:** Infrastructure
**Priority:** P0 - Blocking

---

## Business Goal

Implement metrics collection per docs/03-sad/24-deployment.md Part 9 Section 3, covering the four literal metric categories (Infrastructure, Application, Database, Business) via Prometheus, feeding Grafana dashboards (task-250) and SLA monitoring (task-251).

## Depends On

- task-243 (Application-Tier High Availability)

## Required Documents

- **AI Contract:** docs/04-ai-contract/01-global-rules.md, docs/04-ai-contract/02-architecture-contract.md, docs/04-ai-contract/09-security-contract.md
- **PRD:** docs/01-prd/vision.md, docs/01-prd/product-goals.md
- **SAD:** docs/03-sad/24-deployment.md (Part 9 Section 3 Metrics Collection (Infrastructure Metrics: CPU/Memory/Disk/Disk IOPS/Network/Node Availability; Application Metrics: Request Count/Response Time/Active Session/Error Rate/API Throughput/Queue Length; Database Metrics: Active Connection/Slow Query/Replication Delay/Transaction Count/Buffer Usage; Business Metrics: Login Count/Appointment Created/Invoice Generated/Payment Processed/Prescription Created/Medical Record Updated), Section 6 Monitoring Stack (Prometheus, Node Exporter, MySQL Exporter, Redis Exporter, Application Metrics Exporter))
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-243.

## Backend Scope

- Application layer: an Application Metrics Exporter instrumenting the literal Application Metrics list (Request Count, Response Time, Active Session, Error Rate, API Throughput, Queue Length) and the literal Business Metrics list (Login Count, Appointment Created, Invoice Generated, Payment Processed, Prescription Created, Medical Record Updated) — each Business Metric maps to an existing domain event already published somewhere in Phase 1–3 (e.g. ReservationCreated for Appointment Created), so this task wires metric counters to those existing events rather than inventing new ones.
- Infrastructure as Code: Prometheus deployment with Node Exporter (Infrastructure Metrics), MySQL Exporter and Redis Exporter (Database Metrics) per the literal component list.

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

None (read-only metric scraping).

## API Impact

Adds a Prometheus-scrapeable /metrics endpoint (standard Prometheus exposition format, not a new business endpoint).

## Workflow Impact

Feeds Alerting (task-249), Monitoring Dashboards (task-250), and SLA Monitoring (task-251).

## Security Impact

The /metrics endpoint must not expose business data values beyond aggregate counts (no PII in metric labels).

## Testing Required

- Infrastructure validation: config dry-run, smoke test against a non-production environment, and a documented operational drill (failover/restore/alert-fire test as applicable) per docs/03-sad/24-deployment.md.

## Deliverables

- Application Metrics Exporter covering all six literal Application Metrics and all six literal Business Metrics
- Prometheus + Node Exporter + MySQL Exporter + Redis Exporter deployment

## Acceptance Criteria

Per docs/03-sad/24-deployment.md Part 9 (no dedicated PRD acceptance-criteria file exists for infrastructure):

- All four literal metric categories (Infrastructure, Application, Database, Business) are collected and queryable in Prometheus, matching each category's literal field list exactly.

## Definition of Done

Metrics collection implemented and verified against the complete literal metric list from Section 3.

---

## Dependency Detail

- **Blocked By:** task-243
- **Required Before:** See phase-5-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
