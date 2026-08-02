# Phase 4 Task Plan — Multi Branch Platform

**Source:** docs/03-sad/26-roadmap.md Section 7 (Phase 4 — Multi Branch Platform)
**Task Range:** task-210 through task-230 (21 tasks)
**Scope:** New Capabilities (Multi Branch Configuration, Centralized User Management, Branch Dashboard, Cross Branch Reporting, Branch-Level Access Control, Branch Performance Monitoring, Centralized Master Data, Branch Synchronization) and Infrastructure Evolution (Dedicated Database Server, Load Balancer, Centralized Backup, High Availability Database, Object Storage), built on the System (docs/03-sad/21-module-system.md), Master Data (docs/03-sad/11-module-master-data.md), Reporting (docs/03-sad/20-module-report.md), and Deployment (docs/03-sad/24-deployment.md) documents.

Per explicit user instruction, this plan covers **Phase 4 only**. Phase 5 (Enterprise Platform) is out of scope and has not been started.

---

## Important Context: Phase 4 Is Thinner in the SAD Than Phase 1–3

Unlike Warehouse and Finance (Phase 3), which have dense, literal Section 6 API tables with named error codes, docs/03-sad/26-roadmap.md's Phase 4 section is eight bullet points ("New Capabilities") and five bullet points ("Infrastructure Evolution") with no dedicated module document of their own. Every Phase 4 capability had to be traced back to narrative mentions scattered across other modules (Branch entity in Master Data Section 11.2, "Manager Dashboard"/"Branch Performance"/"Branch Comparison" in Queue's UI-flow narrative, "Multi Branch Ready" notes in Billing/EMR/System Architecture, and the Deployment document's infrastructure sections). Consequently, most Phase 4 endpoint paths in this plan are **convention-derived** (per docs/04-ai-contract/04-api-contract.md's URL convention, the same precedent Phase 1's task-021/task-022 established for Clinic/Branch), not literal rows in a SAD endpoint table. Every task that derives its own path says so explicitly in its Definition of Done.

---

## Ambiguities and Gaps Reported

1. **`/system/users/{userId}/roles` and `/system/users/{userId}/branches` overlap.** docs/03-sad/21-module-system.md Section 6.1 lists these as two separate literal endpoints with two separate permissions (`system.user.role.manage` vs `system.user.branch.manage`), but the one worked example payload shown in the SAD (used to spec Phase 1's task-019) bundles `roleIds` and `branchAssignments` in a single request body. task-210 (this phase) builds the literal `/branches` endpoint per the table; reconciling its overlap with task-019's existing behavior is called out as an implementation-time decision, not resolved here.

2. **Branch entity does not currently publish a domain event.** task-224 (New Branch Bootstrap Workflow) requires a `BranchCreated` event to trigger off of, but Phase 1's task-022 (Branch Entity CRUD) was not originally specified to publish one (only `PatientRegistered` and `ReservationCreated` were named as example events in Phase 1). task-224 flags that task-022 must be extended to publish this event before the bootstrap consumer can go live — this is a necessary implementation detail of an already-specified entity, not an invented business rule.

3. **No literal API specification section exists for Master Data comparable to Warehouse/Finance's Section 6.** docs/03-sad/11-module-master-data.md (as reviewed) documents CRUD workflow and cross-module usage narratively but does not enumerate literal endpoint paths the way Warehouse and Finance do. Every Master Data task in Epic BG (Centralized Master Data) therefore derives its endpoint paths from the documented URL convention rather than a literal spec.

4. **No literal endpoint/schema exists for "Branch Comparison" or "Branch Performance" reports.** These phrases appear only as narrative report-catalog line items in Queue's "Manager Dashboard" and "Annual Report" sections and Billing's "Reporting & Analytics" summary — never as a Report-module Section 6 endpoint row. task-218 and task-219 build the capability described by these narrative mentions but flag that the literal response schema must be finalized against actual Queue/Billing/Finance projection data during implementation.

5. **Infrastructure Evolution items have no PRD acceptance-criteria file.** The five Infrastructure Evolution tasks (task-226–230) reference docs/03-sad/24-deployment.md directly as authoritative, since docs/01-prd/acceptance-criteria/ has no infrastructure-specific document — this mirrors how Phase 1–3 always treated the SAD as controlling when a narrower PRD document didn't exist.

6. **IaC tooling is not named in the SAD.** docs/03-sad/24-deployment.md describes Docker/Container-First and Infrastructure as Code principles narratively (Part 3 Container Architecture) but does not commit to a specific tool (Terraform vs. Docker Compose vs. Kubernetes manifests) for the Load Balancer/Database/Backup tasks in Epic BI. Each infrastructure task instructs the implementer to confirm the existing convention already in use elsewhere in the repository before introducing a new tool, per CLAUDE.md's "must not introduce new libraries unless approved" rule.

7. **Branch Scope Guard retrofit is explicitly partial.** task-215 builds a reusable `BranchScopeGuard` and demonstrates it on a representative sample of already-implemented endpoints; retrofitting it onto all ~200 endpoints built across Phase 1–3 is explicitly out of scope for a single AI implementation session and is called out as future follow-up work, not silently assumed complete.

---

## Task List by Epic

| Epic | Feature Area | Module | Tasks | Count |
|---|---|---|---|---|
| BA. Multi Branch Configuration | Branch Assignment, Default Branch Policy | System / Master Data | task-210–212 | 3 |
| BB. Centralized User Management | User Directory, Role-Branch Overview | System | task-213–214 | 2 |
| BC. Branch-Level Access Control | Enforcement Guard, Policy Management | System | task-215–216 | 2 |
| BD. Branch Dashboard | Single-Branch Operational Summary | Reporting | task-217 | 1 |
| BE. Cross Branch Reporting | Multi-Branch Comparison | Reporting | task-218 | 1 |
| BF. Branch Performance Monitoring | Performance Metrics | Reporting | task-219 | 1 |
| BG. Centralized Master Data | Template Definition, Distribution, Consistency Monitoring | Master Data | task-220–222 | 3 |
| BH. Branch Synchronization | Branch Provisioning, Lifecycle Integrity | System / Master Data | task-223–224 | 2 |
| BI. Infrastructure Evolution | Dedicated DB, Load Balancer, Backup, HA Database, Object Storage | Infrastructure | task-225–230 | 6 |

**Total: 21 tasks (task-210 through task-230).**

---

## Task Dependencies (Summary)

- task-210 (Assign Branch to User) depends on task-019 (Phase 1) and task-022 (Phase 1).
- task-211 depends on task-210.
- task-212 (Default Branch Resolution Policy) depends on task-022 and task-200 (Phase 3).
- task-213 (Branch Configuration View) depends on task-022 and task-200.
- task-214 (Cross-Branch User Directory) depends on task-015 (Phase 1) and task-210.
- task-215 (Branch-Scoped Role Assignment Matrix) depends on task-017 (Phase 1) and task-210.
- task-216 (Branch Scope Authorization Guard) depends on task-014 (Phase 1) and task-210.
- task-217 (Branch Access Policy per Role) depends on task-017 and task-216.
- task-218 (Branch Dashboard) depends on task-178, task-180, task-182 (Phase 3).
- task-219 (Branch Comparison Report) depends on task-178, task-179 (Phase 3).
- task-220 (Branch Performance Report) depends on task-178, task-180 (Phase 3).
- task-221 (Master Data Template entity) depends on task-021 (Phase 1).
- task-222 (Push Master Data Template) depends on task-221 and task-022.
- task-223 (Master Data Consistency Report) depends on task-222.
- task-224 (New Branch Bootstrap Workflow) depends on task-022, task-101, task-144 (Phase 3), and task-212.
- task-225 (Branch Deactivation Guard) depends on task-022.
- task-226 (Dedicated Database Server) has no application-code dependency.
- task-227 (Load Balancer) depends on task-226.
- task-228 (Centralized Backup) depends on task-226.
- task-229 (High Availability Database) depends on task-226 and task-228.
- task-230 (Production Object Storage Configuration) depends on task-228.

(Task numbers above reflect the actual generated sequence: task-210 Assign Branch, task-211 Branch Membership List, task-212 Default Branch Resolution Policy, task-213 Branch Configuration View, task-214 Cross-Branch User Directory, task-215 Branch-Scoped Role Assignment Matrix, task-216 Branch Scope Authorization Guard, task-217 Branch Access Policy per Role, task-218 Branch Dashboard, task-219 Branch Comparison Report, task-220 Branch Performance Report, task-221 Master Data Template entity, task-222 Push Master Data Template, task-223 Master Data Consistency Report, task-224 New Branch Bootstrap Workflow, task-225 Branch Deactivation Guard, task-226 Dedicated Database Server, task-227 Load Balancer, task-228 Centralized Backup, task-229 High Availability Database, task-230 Production Object Storage.)

---

## Implementation Order

1. **Branch Assignment Foundation** — task-210 (Assign Branch to User), task-211 (Branch Membership List). Depends on Phase 1's task-019/task-022 only.
2. **Default Branch & Configuration** — task-212 (Default Branch Resolution Policy), task-213 (Branch Configuration View). Depends on Group 1 and Phase 3's task-200.
3. **Centralized User Management** — task-214 (Cross-Branch User Directory), task-215 (Branch-Scoped Role Assignment Matrix). Depends on Group 1.
4. **Branch-Level Access Control** — task-216 (Branch Scope Authorization Guard), task-217 (Branch Access Policy per Role). Depends on Group 1; task-216 is the prerequisite for task-217.
5. **Centralized Master Data** — task-221 (Master Data Template entity) → task-222 (Push Master Data Template to Branches) → task-223 (Master Data Consistency Report). Depends only on Phase 1's task-021/task-022; can run in parallel with Groups 1–4.
6. **Branch Synchronization** — task-224 (New Branch Bootstrap Workflow, depends on Group 2's task-212 plus Phase 3's task-101/task-144), task-225 (Branch Deactivation Guard, depends only on task-022).
7. **Advanced Reporting Extensions** — task-218 (Branch Dashboard), task-219 (Branch Comparison Report), task-220 (Branch Performance Report). All depend on Phase 3's Epic AG (task-178–184) and can run in parallel with Groups 1–6 once Phase 3 is complete.
8. **Infrastructure Evolution** — task-226 (Dedicated Database Server) first; then task-227 (Load Balancer) and task-228 (Centralized Backup) in parallel; then task-229 (High Availability Database) and task-230 (Production Object Storage), both depending on task-228. This Epic has no dependency on Groups 1–7 and can be executed by a DevOps-focused session entirely in parallel with the application-code Epics.

**Critical path:** task-210 (Assign Branch) → task-212 (Default Branch Policy) → task-224 (New Branch Bootstrap) closes the loop on making a newly created branch fully operational. In parallel: task-216 (Branch Scope Guard) → task-217 (Branch Access Policy) hardens access control platform-wide. Independently: task-226 → task-228 → task-229/230 delivers the infrastructure foundation.

---

## Definition of Done (Phase 4)

- All 21 tasks (task-210–task-230) implemented per their individual Definition of Done, Acceptance Criteria, and the response/error envelope in docs/04-ai-contract/04-api-contract.md.
- The overlap between task-210 (this phase) and Phase 1's task-019 is explicitly resolved (not left ambiguous) in the actual implementation, per Ambiguity #1.
- Phase 1's task-022 (Branch Entity) is confirmed to publish a `BranchCreated`-equivalent event before task-224's bootstrap consumer is wired live, per Ambiguity #2.
- `BranchScopeGuard` (task-216) is demonstrated on at least one endpoint each from Reservation, Billing, and Warehouse as a proof of retrofit pattern, per Ambiguity #7.
- All three Infrastructure Evolution HA/Backup tasks (task-228, task-229, task-230) have a documented, dry-run-tested restore/failover runbook — not just a provisioned resource.
- Every Ambiguity above is either resolved with confirmed source documentation or still explicitly flagged (not silently guessed) in the corresponding task's implementation.
- Unit, integration, and API tests exist for every application-code task; infrastructure tasks have a documented validation drill (health check, failover, or restore test) in place of unit tests.

## Acceptance Criteria (Phase 4)

- Multi Branch Configuration: a user can be assigned to multiple branches with exactly one default; branch-scoped System Parameters are viewable in one consolidated view per branch.
- Centralized User Management: an Administrator/Owner can see every user across every branch from one directory view; a Clinic Manager's view is correctly scoped to their own assigned branch(es).
- Branch-Level Access Control: a non-cross-branch user cannot access data or actions outside their assigned branch(es); cross-branch roles (Owner/Administrator/Security Admin) are unaffected.
- Branch Dashboard: a Clinic Manager can view a single-branch operational summary combining Queue and Billing data.
- Cross Branch Reporting: an Owner can request a side-by-side comparison of authorised branches; scope is intersected/rejected per assignment, never silently widened.
- Branch Performance Monitoring: trended, multi-period branch performance data is available, distinct from the point-in-time comparison report.
- Centralized Master Data: a Head-Office template can be pushed to selected branches, creating or updating branch records without silently overwriting local customizations; drift from the template is reportable.
- Branch Synchronization: a newly created branch is automatically provisioned with a default Warehouse Location, starter Chart of Accounts, and inherited configuration; a branch with open transactions cannot be deactivated.
- Infrastructure Evolution: the platform runs against a dedicated database server behind a load-balanced, health-checked application tier, with centralized, RTO/RPO-compliant backups, database high availability with tested failover, and a production-grade, versioned Object Storage configuration shared across all modules.
