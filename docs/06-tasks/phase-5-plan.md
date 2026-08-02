# Phase 5 Task Plan — Enterprise Platform

**Source:** docs/03-sad/26-roadmap.md Section 8 (Phase 5 — Enterprise Platform)
**Task Range:** task-231 through task-254 (24 tasks)
**Scope:** Enterprise Features (SSO Integration, External Identity Provider, Enterprise RBAC, API Gateway, Message Broker, Audit Analytics, Data Warehouse, Executive Dashboard, Advanced Scheduler), Reliability (High Availability, Disaster Recovery, Horizontal Scaling, Observability, SLA Monitoring), and Enterprise Security (Central Audit, SIEM Integration, Secret Management, Advanced Monitoring), built primarily on the Deployment (docs/03-sad/24-deployment.md) and Security (docs/03-sad/25-security.md) documents, with supporting material from Authentication (docs/03-sad/10-authentication.md), System Administration (docs/03-sad/21-module-system.md), EMR (docs/03-sad/15-module-emr.md), Reporting (docs/03-sad/20-module-report.md), and Clean Architecture (docs/03-sad/03-clean-architecture.md).

Per explicit user instruction, this plan covers **Phase 5 only**. Phase 6 (Healthcare Ecosystem) is out of scope and has not been started.

---

## Important Context: Phase 5 Is Almost Entirely Infrastructure/Security, Not Application CRUD

Unlike Phase 1–3 (dense, literal module-level API specs) and even Phase 4 (thin but at least entity-shaped), Phase 5's roadmap items map overwhelmingly onto docs/03-sad/24-deployment.md (Deployment) and docs/03-sad/25-security.md (Security) — documents that describe infrastructure architecture, monitoring stacks, and operational policy in prose and reference tables, not application endpoints. Of the 24 tasks in this plan, 15 are classified `Module: Infrastructure` and their "Testing Required" is a documented operational drill (failover, restore, alert-fire, load test) rather than a unit/integration test suite. This is a deliberate, accurate reflection of what Phase 5's actual source material specifies — treating it as ordinary application code would misrepresent the SAD.

---

## Ambiguities and Gaps Reported

1. **SSO / External Identity Provider has zero technical specification.** docs/03-sad/10-authentication.md Section 2 explicitly states 'Dokumen ini tidak membahas: OAuth, SSO, LDAP, MFA (Future), Social Login' (this document does not cover these) and Section 47 lists them only as unordered Future Enhancements bullets. Per CLAUDE.md's Missing Information rule, task-231 does **not** implement SSO/IdP code — it produces the missing Architecture Decision Record (protocol choice, identity mapping, session interoperability, provisioning behavior). Actual implementation is explicitly out of scope for this Phase 5 task set and blocked pending that ADR's approval.

2. **Message Broker technology is named but not selected.** docs/03-sad/03-clean-architecture.md Section 34.5 names four candidates (RabbitMQ, Kafka, NATS, Google Pub/Sub) without choosing one. task-236 requires the selection to be made and documented during implementation.

3. **SIEM platform is named but not selected.** docs/03-sad/25-security.md Section 10 names five candidates (ELK Stack, OpenSearch, Grafana Loki, Microsoft Sentinel, Splunk) without choosing one. task-253 requires the selection to be made and documented during implementation.

4. **JWT Secret rotation interval is undefined.** docs/03-sad/24-deployment.md's literal Rotation Policy table gives API Key = 90 days and Database Password = 180 days, but lists JWT Secret as "Sesuai Kebijakan" (per policy) without stating what that policy's actual interval is. task-252 requires this interval to be explicitly documented as part of implementation rather than left undefined.

5. **"Enterprise RBAC," "Advanced Scheduler," and several other roadmap items exist only as maturity-roadmap table rows, not API specs.** docs/03-sad/21-module-system.md Section 12.3's Phase 3/4 roadmap rows ("Delegated/time-bound access," "access-review automation," "policy simulation," "dynamic policy/ABAC extensions," "organisation-wide governance analytics") name capabilities without endpoint/schema detail. Tasks 232–234 and 238 implement what these rows describe narratively and flag every convention-derived endpoint path explicitly. ABAC extensions specifically are named but not detailed anywhere and are explicitly excluded from task-234's scope pending further specification.

6. **"Executive Dashboard" is ambiguous between two existing concepts.** Phase 3's task-179 already implements a business-KPI "Executive Dashboard." docs/03-sad/24-deployment.md Part 9 Section 7 separately describes an infrastructure-observability "Dashboard Hierarchy" topped by its own "Executive Dashboard" tier. task-241 (Unified Executive Dashboard) explicitly extends/rolls up task-179 rather than duplicating it, and this reconciliation is called out as an implementation-time decision.

7. **Advanced Scheduler consolidates three separately-narrated per-module requirements, none of which has its own API spec.** Warehouse ("scheduler untuk expiry/reservation release/alert"), HR ("scheduler untuk contract/document expiry dan payroll cutoff"), and Reporting ("scheduler untuk snapshot/reconciliation/retention") each mention needing *a* scheduler as infrastructure, with zero shared design. task-242 derives a consolidation design from this shared narrative need, not from a literal spec.

8. **No dedicated PRD acceptance-criteria file exists for Infrastructure or Enterprise Security tasks.** As with Phase 4's Infrastructure Evolution epic, every `Module: Infrastructure` task in this phase treats docs/03-sad/24-deployment.md and docs/03-sad/25-security.md directly as authoritative in place of a PRD acceptance-criteria document.

---

## Task List by Epic

| Epic | Feature Area | Module | Tasks | Count |
|---|---|---|---|---|
| CA. Identity Federation | SSO / External IdP Design Spike | Authentication | task-231 | 1 |
| CB. Enterprise RBAC | Delegated Access, Access Review, Policy Simulation | System | task-232–234 | 3 |
| CC. API Gateway | Gateway Layer | Infrastructure | task-235 | 1 |
| CD. Message Broker Migration | Event Bus Migration | Infrastructure | task-236 | 1 |
| CE. Central Audit & Audit Analytics | Central Audit Projection, Audit Analytics Dashboard | System / Reporting | task-237–238 | 2 |
| CF. Data Warehouse & Business Intelligence | ETL Pipeline, BI KPIs | Reporting | task-239–240 | 2 |
| CG. Executive Dashboard | Unified View | Reporting | task-241 | 1 |
| CH. Advanced Scheduler | Scheduler Consolidation | System | task-242 | 1 |
| CI. Reliability | High Availability, Disaster Recovery, Horizontal Scaling | Infrastructure | task-243–245 | 3 |
| CJ. Observability | Logging, Metrics, Tracing, Alerting, Dashboards | Infrastructure | task-246–250 | 5 |
| CK. SLA Monitoring | Service Level Monitoring | Infrastructure | task-251 | 1 |
| CL. Enterprise Security | Secret Management | Infrastructure | task-252 | 1 |
| CM. SIEM Integration | SIEM Export | Infrastructure | task-253 | 1 |
| CN. Advanced Security Monitoring | Threat Detection | Infrastructure | task-254 | 1 |

**Total: 24 tasks (task-231 through task-254).**

---

## Task Dependencies (Summary)

- task-231 (SSO Design Spike) depends on task-007, task-013, task-014 (Phase 1). No task in this plan depends on task-231's output, since its own Definition of Done explicitly blocks further implementation until the ADR is approved.
- task-232 (Delegated Access) depends on task-017, task-210 (Phase 1/4).
- task-233 (Access Review) depends on task-017, task-192 (Phase 1/3), task-232.
- task-234 (Policy Simulation) depends on task-018, task-203 (Phase 1/3).
- task-235 (API Gateway) depends on task-227 (Phase 4).
- task-236 (Message Broker) depends on task-136, task-162 (Phase 3).
- task-237 (Central Audit) depends on task-192, task-006 (Phase 1/3).
- task-238 (Audit Analytics) depends on task-237, task-178 (Phase 3).
- task-239 (Data Warehouse ETL) depends on task-178 (Phase 3), task-226 (Phase 4).
- task-240 (BI KPIs) depends on task-239.
- task-241 (Unified Executive Dashboard) depends on task-179 (Phase 3), task-247, task-251 (this phase).
- task-242 (Advanced Scheduler) depends on task-207 (Phase 3).
- task-243 (Application-Tier HA) depends on task-227, task-229 (Phase 4).
- task-244 (Disaster Recovery) depends on task-228 (Phase 4), task-243.
- task-245 (Horizontal Auto-Scaling) depends on task-243.
- task-246 (Logging) depends on task-243.
- task-247 (Metrics) depends on task-243.
- task-248 (Tracing) depends on task-243, task-246.
- task-249 (Alerting) depends on task-247.
- task-250 (Monitoring Dashboards) depends on task-247.
- task-251 (SLA Monitoring) depends on task-247, task-249.
- task-252 (Secret Management) depends on task-243.
- task-253 (SIEM Integration) depends on task-246, task-192 (Phase 3).
- task-254 (Advanced Security Monitoring) depends on task-253, task-249.

---

## Implementation Order

1. **Reliability Foundation** — task-243 (Application-Tier HA), depends only on Phase 4's task-227/task-229. This is the load-bearing prerequisite for nearly every other Infrastructure task in this phase.
2. **Observability Core** — task-246 (Logging), task-247 (Metrics) in parallel, both depending only on task-243.
3. **Observability Extensions** — task-248 (Tracing, depends on 243+246), task-249 (Alerting, depends on 247), task-250 (Monitoring Dashboards, depends on 247) — can run in parallel once Group 2 completes.
4. **Reliability Extensions** — task-244 (Disaster Recovery, depends on Phase 4's task-228 + task-243), task-245 (Horizontal Auto-Scaling, depends on task-243) — parallel with Groups 2–3.
5. **SLA & Secret Management** — task-251 (SLA Monitoring, depends on 247+249), task-252 (Secret Management, depends on 243) — after Group 3.
6. **Security Extensions** — task-253 (SIEM Integration, depends on 246 + Phase 3's task-192), then task-254 (Advanced Security Monitoring, depends on 253+249).
7. **API Gateway & Message Broker** — task-235 (API Gateway, depends on Phase 4's task-227; can start as early as Group 1), task-236 (Message Broker, depends on Phase 3's task-136/task-162; independent of Groups 1–6, can run any time).
8. **Enterprise RBAC** — task-232 (Delegated Access) → task-233 (Access Review) in sequence; task-234 (Policy Simulation) in parallel with both, depending only on Phase 1/3 tasks. Independent of Groups 1–7.
9. **Central Audit & Analytics** — task-237 (Central Audit Projection) → task-238 (Audit Analytics Dashboard, also depends on Phase 3's task-178). Can run in parallel with Group 8.
10. **Data Warehouse & BI** — task-239 (ETL Pipeline, depends on Phase 3's task-178 + Phase 4's task-226) → task-240 (BI KPIs). Independent of Groups 1–9, though practically benefits from task-226 (Dedicated DB Server) already being live.
11. **Advanced Scheduler** — task-242, depends only on Phase 3's task-207. Independent of all other groups.
12. **Unified Executive Dashboard** — task-241, the capstone task of this phase: depends on Phase 3's task-179 plus this phase's task-247 (Group 2) and task-251 (Group 5), so it must be sequenced last among the groups it depends on.
13. **Identity Federation** — task-231 (SSO/IdP Design Spike) has no dependency on Groups 1–12 beyond Phase 1's task-007/013/014 and can be done at any time; it is listed last here only because its explicit output is a blocker for future (Phase 6+) work, not because it is technically gated by anything in this plan.

**Critical path for Reliability/Observability (the largest cluster):** task-243 → task-246/task-247 → task-248/task-249/task-250 → task-251/task-252 → task-253 → task-254.
**Critical path for Enterprise Reporting:** task-178 (Phase 3) → task-237 → task-238, and separately task-178 + task-226 (Phase 4) → task-239 → task-240, both converging with task-247/task-251 at task-241.

---

## Definition of Done (Phase 5)

- All 24 tasks (task-231–task-254) implemented per their individual Definition of Done, Acceptance Criteria, and (for application-code tasks) the response/error envelope in docs/04-ai-contract/04-api-contract.md.
- task-231's ADR is authored and approved; no SSO/IdP implementation code exists in this phase's deliverables, per Ambiguity #1 — this is intentional, not an oversight.
- task-236's Message Broker selection and task-253's SIEM platform selection are both explicitly documented decisions, not left as "one of the four/five options," per Ambiguities #2 and #3.
- task-252's JWT Secret rotation interval is explicitly documented with an actual value, per Ambiguity #4.
- Every literal table in docs/03-sad/24-deployment.md Part 9 (Metrics categories, Alert Categories/Severity/Channels, SLO targets, per-service SLA targets, Dashboard field lists) is implemented exactly as enumerated — no fields added or omitted.
- Every literal table in docs/03-sad/24-deployment.md Part 6/8 and docs/03-sad/25-security.md (Secret Categories, Rotation Policy, Supported SIEM Sources) is implemented exactly as enumerated.
- All Infrastructure-module tasks have a documented, executed operational drill (failover, restore, alert-fire, load test, or scan) recorded as evidence of completion, not just a provisioned resource.
- All application-code tasks (System/Reporting/Authentication module) have unit, integration, and API tests per docs/05-testing/.

## Acceptance Criteria (Phase 5)

- SSO Integration / External Identity Provider: an approved ADR exists; no premature implementation occurred.
- Enterprise RBAC: a user can delegate a bounded subset of their own access for a time-limited period; a Security Admin can generate and certify a full access-review snapshot; a hypothetical policy change can be simulated against the live authorization logic before being applied.
- API Gateway: all existing endpoints remain reachable through the Gateway with TLS termination, rate limiting, and sanitized request logging in front of them.
- Message Broker: every existing Phase 1–4 event consumer's own idempotency/ordering tests pass unchanged against the new broker-backed adapter.
- Central Audit / Audit Analytics: a single query surfaces every module's audit-recorded events; a trend/anomaly dashboard is available over that unified projection.
- Data Warehouse / Business Intelligence: the five named Fact tables and five named Dimension tables are populated and reconcile against source-of-truth financial data; the five named BI KPIs are computed from the warehouse.
- Executive Dashboard: a unified view combines business KPIs, infrastructure health, and SLA status for Owner/Administrator.
- Advanced Scheduler: Warehouse, HR, and Reporting's previously separate scheduled concerns are all visible and manageable from one registry.
- Reliability: the application tier survives a single-instance failure with zero dropped requests; a full DR activation drill succeeds within documented RTO/RPO; the Backend API tier auto-scales under load and back down when load subsides.
- Observability: logs, metrics, traces, and dashboards cover every literal field/source named in the SAD; alerts fire correctly by severity and route to the correct channel.
- SLA Monitoring: SLI/SLO/SLA tracking matches the literal target tables exactly, including Authentication/Billing's tighter 99.95% target.
- Enterprise Security: no hardcoded/committed secrets exist; rotation runs on the literal documented schedule; a test security event flows end-to-end from source through the SIEM to a Security Team alert; the three named threat patterns reliably alert without false-positiving on normal usage.
