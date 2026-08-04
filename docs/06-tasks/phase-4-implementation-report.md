# Phase 4 Implementation Report -- Multi Branch Platform

> Companion document to [`phase-4-plan.md`](./phase-4-plan.md). That document is the *plan*; this is the *as-built report*: what was delivered, how each flagged ambiguity was actually resolved, and current verification status. Written per `docs/04-ai-contract/01-global-rules.md`'s escalation/documentation discipline.

**Status: Application-code scope complete.** All 16 application-code tasks (task-210 through task-225, across Epics BA-BH) are implemented, unit tested, and wired into the running application (`src/app.ts`). The 5 pure Infrastructure Evolution tasks (task-226-230: dedicated DB server, load balancer, HA database, backups, object storage) were explicitly scoped out of this pass at the user's direction -- they require real cloud/ops access unavailable in a coding session -- and remain **not started**. `apps/backend/openapi.yaml` was extended to cover the full Phase 4 application-code surface.

Every task in this phase is **backend-only** by its own Frontend Scope ("No dedicated page in this task; backend-only... scoped to a later frontend task once docs/02-design coverage exists"), matching Phase 4's own documented design-spec gap. No frontend work was in scope for this pass.

---

## 1. Task-Number Discrepancy (read this before cross-referencing task IDs)

`phase-4-plan.md`'s own "Task List by Epic" summary table uses a **different, off-by-one task numbering** than the individual `docs/06-tasks/task-21X.md`/`task-22X.md` files (e.g. the plan's table assigns Epic BD "Branch Dashboard" to `task-217`, but the actual `task-218.md` file is titled "Branch Dashboard"). Per `CLAUDE.md`'s document priority order, **individual Task Specification files outrank a phase plan's own summary table** when they conflict, so this report -- and the actual implementation -- follows the individual task files' literal numbers throughout:

| Epic | Feature | Task IDs (per individual task-*.md files, authoritative) |
|---|---|---|
| BA. Multi Branch Configuration | Branch Assignment | task-210, task-211 |
| BA2. Default Branch Policy | Default Branch Resolution, Branch Configuration | task-212, task-213 |
| BB. Centralized User Management | Cross-Branch Directory, Role-Branch Matrix | task-214, task-215 |
| BC. Branch-Level Access Control | BranchScopeGuard, Role Branch Policy | task-216, task-217 |
| BD. Branch Dashboard | Single-Branch Operational Summary | task-218 |
| BE. Cross Branch Reporting | Multi-Branch Comparison | task-219 |
| BF. Branch Performance Monitoring | Trended Performance | task-220 |
| BG. Centralized Master Data | Template Entity, Push, Drift Report | task-221, task-222, task-223 |
| BH. Branch Synchronization | Bootstrap, Deactivation Guard | task-224, task-225 |
| BI. Infrastructure Evolution (deferred) | — | task-226-230 |

---

## 2. Scope Delivered

| Task | Endpoint / Deliverable | Module | Status |
|---|---|---|---|
| task-210 | `POST /system/users/{userId}/branches` -- replace branch assignments, exactly one `isDefault`, self-escalation rejected | System | Done |
| task-211 | `GET /system/users/{userId}/branches` -- self-read always allowed | System | Done |
| task-212 | `ResolveDefaultBranchUseCase` -- internal domain service (no endpoint), user-default -> clinic GLOBAL default -> explicit error | Master Data | Done |
| task-213 | `GET /system/branches/{branchId}/configuration` -- branch overrides vs. inherited GLOBAL defaults | System | Done |
| task-214 | `GET /system/users` extended with `branchId` + cross-branch-role full view / scoped-role intersected view | System | Done |
| task-215 | `GET /system/roles/branch-matrix` -- role x branch x user-count | System | Done |
| task-216 | `BranchScopeGuard` middleware + retrofit demo on Reservation (`/reservations/analytics`), Billing (`/billing/invoices`), Warehouse (`/warehouse/warehouses`) | System | Done |
| task-217 | `Role.isCrossBranch` + `PATCH /system/roles/{roleId}/branch-policy` | System | Done |
| task-218 | `GET /reports/dashboards/branch` -- Queue + Billing single-branch summary | Reports | Done |
| task-219 | `GET /reports/branch-comparison` -- multi-branch side-by-side, TC-RPT-008 | Reports | Done |
| task-220 | `GET /reports/branch-performance` -- day-by-day trended, max 90-day range | Reports | Done |
| task-221 | `MasterDataTemplate` entity + migration + versioned CRUD (`/masterdata/templates`) | Master Data | Done |
| task-222 | `POST /masterdata/templates/{templateId}/push` -- create/update/conflict per branch | Master Data | Done |
| task-223 | `GET /masterdata/templates/{templateId}/drift` -- field-by-field divergence | Master Data | Done |
| task-224 | `BootstrapNewBranchUseCase` event consumer on `BranchCreated`; idempotent per branchId | System | Done |
| task-225 | `CheckBranchHasOpenTransactionsUseCase` wired into Branch deactivation | Master Data | Done |
| task-226-230 | Dedicated DB server, load balancer, HA database, backups, object storage | Infrastructure | **Not started** (out of session scope) |

---

## 3. Architecture As Built

Every new use case follows the established Clean Architecture layering (`docs/03-sad/03-clean-architecture.md` Section 41: domain/application/infrastructure/presentation). Patterns established or reinforced this phase:

- **Repository Interface as the sanctioned cross-module channel** (`docs/04-ai-contract/07-module-contract.md` MOD-003), used repeatedly: `ResolveDefaultBranchUseCase` (Master Data) reads System's `IUserBranchRepository`/`ISystemParameterRepository`; `CheckBranchHasOpenTransactionsUseCase` (Master Data) reads Reservation/Queue/Billing/Warehouse/Finance's own repository interfaces; `BootstrapNewBranchUseCase` (System) reads/writes Warehouse's `IWarehouseLocationRepository` and Finance's `IAccountRepository`; `BranchAuthorizationService` (Reports) reads System's role/branch repositories. No direct cross-schema Prisma query was written anywhere.
- **Narrow additive repository methods over new abstractions**: `countOpenByBranch` (Reservation/Queue/PurchaseOrder/GoodsReceipt/Journal), `listLatestByScope`/`listAllAssignments` (System), `listTemplateAccounts` (Finance) -- each a single-purpose read method added to an existing interface + its Prisma implementation + its Fake, not a new query abstraction layer.
- **`buildCrudUseCases`'s hook system extended, not replaced**: a new optional `onCreated` hook (fired after create + audit record) was added to `CrudUseCaseHooks`, used only by Branch's own wiring to publish `BranchCreated` -- every other Master Data entity using the same factory is unaffected.
- **`Role.isCrossBranch` as the single source of truth for scope bypass**, read fresh on every request by three independent call sites (`BranchScopeGuard` middleware, `ListUsersUseCase`, `BranchAuthorizationService`) -- no caching, so task-217's flip is immediately effective per its own AC.
- **Scope-check placed in the use case, not route middleware**, whenever `requirePermission`'s binary allow/deny shape couldn't express the actual rule: task-211's "self-read always allowed regardless of permission" and task-214/218/219/220's branch-set intersection both live in application-layer checks for this reason.

---

## 4. Resolution of Every Ambiguity Flagged in `phase-4-plan.md` Section "Ambiguities and Gaps Reported"

| # | Flagged Ambiguity | Resolution Actually Applied |
|---|---|---|
| 1 | `/system/users/{userId}/roles` vs. `/branches` overlap with task-019 | Read `AssignRoleRequestDto.ts`'s own source comment: Phase 1 deliberately excluded `branchAssignments` from the `/roles` payload ("branch assignment is explicitly Phase 4 scope"). No overlap existed to reconcile -- task-210 is a clean new endpoint. |
| 2 | Branch entity does not publish a domain event | `MasterDataEvents.ts` adds `BranchCreated`, published via a new `onCreated` hook on Branch's `buildCrudUseCases` wiring, fulfilling `docs/04-ai-contract/07-module-contract.md` MOD-018's pre-existing (but previously unimplemented) mandate -- not an invented event. |
| 3 | No literal Master Data API spec (Section 6) | Confirmed via direct read of `docs/03-sad/11-module-master-data.md`. Template endpoint paths follow the same convention-derivation precedent already used for Branch/Clinic/etc. in Phase 1. |
| 4 | No literal schema for "Branch Comparison"/"Branch Performance" | Built against the narrative Queue "Manager Dashboard"/Billing "Reporting & Analytics" mentions, reusing the already-built `DashboardMetricAssembler`/`QueueDashboardUseCase`/`IPaymentRepository.sumAmountForDate` read paths rather than inventing a new projection or a `report_snapshots` time-series capability that doesn't exist in this codebase (no periodic snapshot job populates that table for this report). |
| 5-6 | Infrastructure Evolution has no PRD file / no named IaC tool | Not applicable this pass -- Infrastructure Evolution (task-226-230) was scoped out entirely, confirmed via `AskUserQuestion` before implementation began. |
| 7 | BranchScopeGuard retrofit is explicitly partial | `BranchScopeGuard` (task-216) was demonstrated on exactly one representative endpoint each in Reservation (`GET /reservations/analytics`), Billing (`GET /billing/invoices`), and Warehouse (`POST /warehouse/warehouses`), per the task's own Definition of Done -- the remaining ~200 Phase 1-3 endpoints were **not** retrofitted and remain future follow-up work, not silently assumed complete. |

---

## 5. Additional Judgment Calls Made During Implementation

Beyond the plan's own pre-flagged ambiguities, further document gaps surfaced task-by-task:

1. **task-212's "clinic-level default" has no CLINIC scope type to resolve against.** This codebase's actual `SystemParameter` implementation only wires `GLOBAL`/`BRANCH` scope types (`ApprovalWorkflowQueryDto`'s `@IsIn(['GLOBAL', 'BRANCH'])`), not the three-tier `branch -> clinic -> global` precedence the SAD narratively describes. `masterdata.branch.default` resolves against `GLOBAL`, the top of this codebase's actual chain -- documented in `ResolveDefaultBranchUseCase`'s own doc comment, not silently substituted.
2. **task-222's "local customization" divergence needs a write path this phase doesn't build.** No branch-side endpoint exists (in this 16-task scope) for a branch to directly edit a pushed record. `MasterDataTemplateBranchLink.currentPayload` models the branch's live copy and starts equal to `snapshotPayload` at push time; divergence is therefore only produced by a future task wiring a real branch-scoped entity's update flow to keep `currentPayload` in sync, or (in tests) by direct manipulation. Documented as an explicit, honest limitation in the Prisma schema comment and `PushMasterDataTemplateUseCase`'s doc comment.
3. **task-224's "starter Chart of Accounts" mirroring needed a hierarchy-preserving copy, not a flat one.** `BootstrapNewBranchUseCase.bootstrapChartOfAccounts` resolves each template account's branch-scoped copy recursively so a child account's `parentId` points at its newly-created branch-scoped parent, not the template's own id -- verified live (branch-scoped account `1110` correctly parents to the new branch's own `1000`, not the template's).
4. **ADMINISTRATOR's seed data never set `isCrossBranch: true`.** Caught during manual verification (not by the unit-test suite, since Fakes are built per-test with explicit role flags) -- `admin`'s `GET /system/users` returned zero results because the new branch-intersection logic treated a cross-branch-by-design role as scoped-with-no-assignments. Fixed in `prisma/seed.ts`; re-verified live afterward.

---

## 6. Codebase Footprint

New/modified files by module this phase (backend only):

| Module | New files | Notably modified |
|---|---:|---|
| `system/` | `AssignUserBranchUseCase`, `ListUserBranchesUseCase`, `GetBranchConfigurationUseCase`, `GetRoleBranchMatrixUseCase`, `UpdateRoleBranchPolicyUseCase`, `BootstrapNewBranchUseCase`, `branchScopeGuard.ts`, `IUserBranchRepository`, `UserBranchRepository` (+13 files incl. tests) | `ListUsersUseCase`, `system.routes.ts`, `SystemExceptions.ts`, `IRoleRepository`, `IUserAdminRepository`, `IUserRoleRepository`, `ISystemParameterRepository` |
| `master-data/` | `ResolveDefaultBranchUseCase`, `CheckBranchHasOpenTransactionsUseCase`, `PushMasterDataTemplateUseCase`, `GetMasterDataDriftReportUseCase`, `MasterDataTemplateRepository`, `MasterDataTemplateBranchLinkRepository`, `MasterDataEvents.ts` (+10 files incl. tests) | `master-data.routes.ts`, `MasterDataExceptions.ts`, `crudUseCaseFactory.ts` |
| `reports/` | `GetBranchDashboardUseCase`, `GetBranchComparisonReportUseCase`, `GetBranchPerformanceReportUseCase`, `BranchAuthorizationService` (+7 files incl. tests) | `reports.routes.ts`, `MetricDefinitions.ts`, `GetReportUseCase.ts` |
| `reservation/`, `billing/`, `warehouse/`, `finance/`, `queue/` | -- | `countOpenByBranch`/`listTemplateAccounts` additions to 5 repository interfaces + implementations + Fakes; `BranchScopeGuard` retrofit on 3 route files |
| `prisma/` | 2 migrations (`phase4_branch_assignment_and_role_cross_branch`, `phase4_master_data_templates`) | `schema.prisma` (+`UserBranch`, `Role.isCrossBranch`, `MasterDataTemplate`, `MasterDataTemplateBranchLink`), `seed.ts` (+7 permission codes, ADMINISTRATOR `isCrossBranch` fix) |
| `app.ts` | -- | shared `BranchScopeGuard` instance threaded into Reservation/Billing/Warehouse module builders |

Verification as of completion:

- Backend `npx tsc --noEmit` -- 0 errors.
- Backend `npx jest` -- **135 test suites, 524 tests, all passing** (Phase 3 end state: 120 suites / 470 tests -> **+15 suites / +54 tests** this phase).
- RBAC seed catalog: 180 permission codes (7 new this phase: `system.user.branch.manage`, `system.role.branch-policy.manage`, `masterdata.template.manage`, `masterdata.template.read`, `report.dashboard.branch.read`, `report.branch-comparison.read`, `report.branch-performance.read`).
- `openapi.yaml`: 217 paths (up from Phase 3's ~183), validated as well-formed YAML with `js-yaml`; version bumped 1.1.0 -> 1.2.0 (additive, no breaking change, `/api/v1` route version unchanged per API-006).
- **Live-smoke-tested** against the running dev server with a real seeded MySQL instance (not just unit tests against fakes): logged in as `admin`, created a real branch, confirmed `BootstrapNewBranchUseCase` provisioned a Warehouse Location (`MAIN`) + 8-account Chart of Accounts (hierarchy preserved) + inherited System Parameters; assigned a user (`cashier1`) to the new branch and read the assignment back; attempted to deactivate a branch with open Reservations (`422 MD_BRANCH_HAS_OPEN_TRANSACTIONS`, correctly rejected) and an empty branch (succeeded); re-activated the branch afterward to leave demo data clean.

---

## 7. Phase 4 (Application-Code) Definition of Done -- Checklist

Per `phase-4-plan.md`'s own Definition of Done, scoped to the 16 application-code tasks:

- [x] All 16 application-code tasks implemented per their individual Definition of Done, Acceptance Criteria, and the response/error envelope in `docs/04-ai-contract/04-api-contract.md`.
- [x] The task-210/task-019 overlap is explicitly resolved (confirmed no actual overlap, Section 4 #1 above).
- [x] Phase 1's task-022 (Branch Entity) now publishes `BranchCreated` before task-224's bootstrap consumer is wired live (Section 4 #2).
- [x] `BranchScopeGuard` (task-216) demonstrated on one endpoint each from Reservation, Billing, and Warehouse (Section 4 #7).
- [x] Every ambiguity is either resolved with confirmed source documentation or explicitly flagged, never silently guessed (Sections 4-5).
- [x] Unit and integration tests exist for every application-code task (135 suites / 524 tests).
- [ ] Infrastructure Evolution tasks (task-226-230) -- **not started**, out of this session's scope per explicit user direction.

---

## 8. Known Gaps Carried Forward (Not Blockers for This Pass)

- **Infrastructure Evolution (task-226-230) is entirely unbuilt** -- dedicated DB server, load balancer, HA database with tested failover, centralized backups, and production Object Storage all require real cloud/ops provisioning outside a coding session's reach.
- **`BranchScopeGuard` retrofit covers 3 of ~200 pre-Phase-4 endpoints** -- a deliberate, task-217-flagged scope boundary (Section 4 #7), not a defect. Extending it further is natural follow-up work for whichever endpoints next need branch-scoped enforcement.
- **`MasterDataTemplateBranchLink.currentPayload` has no real write path yet** (Section 5 #2) -- conflict-detection logic is fully built and unit-tested, but nothing in this phase's scope actually mutates a branch's live copy independently of a push. The natural trigger (a branch-scoped entity's own update endpoint keeping `currentPayload` in sync) belongs to whichever future task wires template-backed entities to real CRUD.
- **No frontend work** -- confirmed out of scope by every one of the 16 tasks' own Frontend Scope sections; a later frontend phase is expected once `docs/02-design` coverage exists for these screens.
- **No single scripted end-to-end test** automates the full assign-branch -> create-branch -> bootstrap -> deactivate-with-open-transaction chain; it was exercised manually against the live dev server (Section 6) but not persisted as an automated script under `docs/05-testing/e2e-tests.md`.

---

## 9. Recommended Next Step

Before starting Phase 5 (Enterprise Platform, per `docs/03-sad/26-roadmap.md`), the two carried-forward items worth closing first are: (1) deciding whether Infrastructure Evolution (task-226-230) is handled outside this coding environment (real cloud provisioning) or deferred further into Phase 5's own infrastructure epics, since Phase 5 also carries heavy Infrastructure scope (API Gateway, Message Broker, HA/DR, observability); and (2) widening the `BranchScopeGuard` retrofit opportunistically as other Phase 5+ work touches existing endpoints, rather than as a dedicated task. Read `docs/03-sad/26-roadmap.md` and `docs/06-tasks/phase-5-plan.md` (not yet written) in full per the standard per-phase workflow in `CLAUDE.md` before beginning Phase 5.
