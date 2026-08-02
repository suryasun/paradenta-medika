# task-242: Centralized Scheduler Service

**Phase:** Phase 5 - Enterprise Platform
**Epic:** CH. Advanced Scheduler
**Feature:** CH1. Scheduler Consolidation
**Module:** System
**Priority:** P1 - High

---

## Business Goal

Implement a centralized, enterprise-grade scheduler service consolidating the scheduling responsibilities already narratively required by three separate modules — Warehouse's 'scheduler untuk expiry/reservation release/alert' (docs/03-sad/18-module-warehouse.md), HR's 'scheduler untuk contract/document expiry dan payroll cutoff' (docs/03-sad/19-module-hr.md), and Reporting's 'scheduler untuk snapshot/reconciliation/retention' (docs/03-sad/20-module-report.md) — into one visible, retryable, dependency-aware scheduling layer, realizing the roadmap 'Advanced Scheduler' item.

## Depends On

- task-207 (Background Job Registry, Phase 3)

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md, docs/04-ai-contract/04-api-contract.md, docs/04-ai-contract/06-database-contract.md, docs/04-ai-contract/09-security-contract.md, docs/04-ai-contract/05-auth-contract.md
- **PRD:** docs/01-prd/features/system.md, docs/01-prd/business-rules.md § 10
- **SAD:** docs/03-sad/18-module-warehouse.md, docs/03-sad/19-module-hr.md, docs/03-sad/20-module-report.md (each module's Section 'Deployment/Infrastructure' narrative mention of a per-module scheduler requirement (no dedicated scheduler API spec exists in any of the three)), docs/03-sad/24-deployment.md Section on Scaling ('Scheduler | Kubernetes' component reference), and docs/03-sad/04-project-structure.md's `scheduler/` directory in the project layout
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-207, task-013, task-014, task-006.

## Backend Scope

- Domain layer: `ScheduledJobDefinition` entity (jobKey, cronExpression or interval, ownerModule, dependsOnJobKeys for chaining, timeoutPolicy).
- Infrastructure layer: Prisma migration for `system_scheduled_job_definitions`, extending task-207's existing Background Job Registry (this task does not replace task-207's execution/retry tracking; it adds a scheduling/definition layer on top of it).
- Application layer: `RegisterScheduledJobUseCase`, `ListScheduledJobsUseCase` — each existing module-level scheduled concern (Warehouse expiry alerts, HR payroll cutoff, Reporting snapshot/retention) is migrated to register itself against this central definition table instead of maintaining an ad hoc, invisible per-module cron.

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

Creates system_scheduled_job_definitions table; existing per-module scheduled tasks (if already implemented ad hoc in earlier phases) are migrated to register here.

## API Impact

Adds GET/POST /system/scheduled-jobs (convention-derived), extending task-207's job-registry read endpoints with a definition/registration surface.

## Workflow Impact

Gives Administrators one place to see every recurring job across Warehouse, HR, and Reporting, with dependency chaining and centralized retry policy — realizing 'Advanced Scheduler' over what would otherwise remain three separate, invisible per-module schedulers.

## Security Impact

Gated by an operations-manage permission (same scope as task-207/task-208/task-209).

## Testing Required

- Unit tests for the Use Case/Entity (per docs/05-testing/unit-tests.md).
- Integration test for Controller/Repository (per docs/05-testing/api-tests.md).

## Deliverables

- `ScheduledJobDefinition` entity, migration, repository
- `RegisterScheduledJobUseCase`, `ListScheduledJobsUseCase`, routes, controllers, tests
- Migration guide for moving Warehouse/HR/Reporting's existing scheduled concerns onto this registry

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/system.md:

- All three named per-module scheduled concerns (Warehouse expiry/reservation-release, HR contract/payroll-cutoff, Reporting snapshot/reconciliation/retention) are visible in one `GET /system/scheduled-jobs` call.
- A job with a declared dependency does not fire until its dependency has completed.

## Definition of Done

Registry implemented and tested; at least one real job from each of the three named modules is demonstrated registered against it. **Ambiguity flagged (see phase-5-plan.md):** none of the three source modules' SAD sections specify a literal scheduler API — each only narrates that 'a scheduler' is required as infrastructure. This task derives the consolidation design from that shared narrative requirement, not from a literal spec.

---

## Dependency Detail

- **Blocked By:** task-207
- **Required Before:** See phase-5-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
