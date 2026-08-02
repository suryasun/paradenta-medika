# task-224: New Branch Bootstrap Workflow (Event Consumer on Branch Created)

**Phase:** Phase 4 - Multi Branch Platform
**Epic:** BH. Branch Synchronization
**Feature:** BH1. Branch Provisioning
**Module:** System
**Priority:** P0 - Blocking

---

## Business Goal

Implement the `BootstrapNewBranchUseCase` event consumer, triggered when a Branch is created (task-022), that automatically provisions the cross-module defaults a new branch needs — a default Warehouse Location (Phase 3 task-100/101), a default Chart of Accounts skeleton (Phase 3 task-143/144), and branch-scoped System Parameters seeded from the clinic default (task-211/212) — the concrete mechanism behind the roadmap 'Branch Synchronization' capability.

## Depends On

- task-022 (Branch Entity)
- task-101 (Create/List Warehouse Location)
- task-144 (Create/List Account)
- task-212 (Default Branch Resolution Policy)

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md, docs/04-ai-contract/04-api-contract.md, docs/04-ai-contract/06-database-contract.md, docs/04-ai-contract/09-security-contract.md, docs/04-ai-contract/05-auth-contract.md
- **PRD:** docs/01-prd/features/system.md, docs/01-prd/business-rules.md § 10
- **SAD:** docs/03-sad/11-module-master-data.md (Section 10.1 Master Data Management Flow, Section 10.3 Cross Module Usage) and docs/03-sad/21-module-system.md Section 7 Event, Notification, dan Background Processing (Incoming/Outgoing Events pattern)
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-022, task-101, task-144, task-013, task-014, task-006.

## Backend Scope

- Application layer: `BootstrapNewBranchUseCase`, an event-driven consumer subscribing to the Branch-created domain event (published by task-022's `CreateBranchUseCase` once extended to publish it — see Ambiguity). Within a DB transaction it creates: one default `WarehouseLocation` (task-100/101) for the branch, a starter `Account` set (task-143/144) mirroring the clinic's chart-of-accounts skeleton, and any branch-scoped System Parameters (task-200) that should default from the clinic level.
- Idempotent per branchId (re-processing a bootstrap event for an already-bootstrapped branch is a safe no-op).

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

Inserts into warehouse_warehouses, finance_accounts, and system_parameters for the new branch.

## API Impact

None (event-driven consumer; no new synchronous endpoint).

## Workflow Impact

Ensures a newly created branch is immediately operable across Warehouse, Finance, and System modules without manual per-module setup — realizing 'Branch Synchronization'.

## Security Impact

Runs as a trusted system worker; all writes carry a system-actor Audit Trail entry with correlation id back to the Branch-created event.

## Testing Required

- Unit tests for the Use Case/Entity (per docs/05-testing/unit-tests.md).
- Integration test for Controller/Repository (per docs/05-testing/api-tests.md).

## Deliverables

- `BootstrapNewBranchUseCase` event consumer
- Unit + integration tests including an idempotent-redelivery test

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/system.md:

- A newly created branch has a default Warehouse Location, a starter Chart of Accounts, and inherited branch-scoped parameters immediately after creation.
- Redelivering the bootstrap event for an already-bootstrapped branch does not create duplicates.

## Definition of Done

Event consumer implemented and tested. **Ambiguity flagged (see phase-4-plan.md):** task-022 (Phase 1, Branch Entity) as originally specified does not publish a domain event on creation — Phase 1's task list only names `PatientRegistered` and `ReservationCreated` as example events. This task requires task-022 to be extended to publish a `BranchCreated` event (or an equivalent) before this consumer can be wired to a live topic; that extension is a prerequisite implementation detail, not invented business logic, since Branch creation is already an existing, specified use case.

---

## Dependency Detail

- **Blocked By:** task-022, task-101, task-144
- **Required Before:** See phase-4-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
