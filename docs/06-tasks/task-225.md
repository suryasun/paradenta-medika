# task-225: Branch Deactivation Guard

**Phase:** Phase 4 - Multi Branch Platform
**Epic:** BH. Branch Synchronization
**Feature:** BH2. Branch Lifecycle Integrity
**Module:** Master Data
**Priority:** P1 - High

---

## Business Goal

Extend `UpdateBranchUseCase` (task-022) with a deactivation guard enforcing the literal business rule 'Branch tidak boleh dihapus apabila memiliki transaksi' (docs/03-sad/11-module-master-data.md Section 11.2), preventing a branch from being deactivated while it still has open transactions across Reservation, Queue, Billing, Warehouse, or Finance.

## Depends On

- task-022 (Branch Entity)

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md, docs/04-ai-contract/04-api-contract.md, docs/04-ai-contract/06-database-contract.md
- **PRD:** docs/01-prd/features/master-data.md, docs/01-prd/business-rules.md § 1
- **SAD:** docs/03-sad/11-module-master-data.md (Section 11.2 Branch (Business Rules: 'Branch tidak boleh dihapus apabila memiliki transaksi'))
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-022, task-013, task-014, task-006.

## Backend Scope

- Application layer: extend `UpdateBranchUseCase`'s deactivation path with `CheckBranchHasOpenTransactionsUseCase`, which queries for any open Reservation, unclosed Queue, unpaid Invoice, open Purchase Order/Goods Receipt, or unposted Journal scoped to the branch before allowing deactivation.

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

Read-only cross-module check (reads, does not write, other modules' tables — respecting the module-boundary rule by querying through each module's existing read endpoint/repository interface rather than a direct cross-schema join).

## API Impact

No new endpoint; extends the existing branch deactivation path (task-022's Update endpoint, if branch deactivation is modeled as a status field update — confirm against task-022's actual implementation).

## Workflow Impact

Prevents an operational-integrity violation: deactivating a branch that still has live transactions would orphan those records from any active branch-scoped workflow.

## Security Impact

Gated by the same permission as task-022's Update. Rejection is an explicit, auditable error, not a silent no-op.

## Testing Required

- Unit tests for the Use Case/Entity (per docs/05-testing/unit-tests.md).
- Integration test for Controller/Repository (per docs/05-testing/api-tests.md).

## Deliverables

- `CheckBranchHasOpenTransactionsUseCase`, integrated into `UpdateBranchUseCase`
- Unit + integration tests covering each open-transaction type

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/master-data.md:

- Deactivation is rejected when any open transaction exists in any of the checked modules, with an error identifying which module blocked it.
- Deactivation succeeds once all open transactions are resolved.

## Definition of Done

Guard implemented and tested against at least one open-transaction case per checked module (Reservation, Queue, Billing, Warehouse, Finance).

---

## Dependency Detail

- **Blocked By:** task-022
- **Required Before:** See phase-4-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
