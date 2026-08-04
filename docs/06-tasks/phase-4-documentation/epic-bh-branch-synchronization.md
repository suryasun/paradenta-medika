# Epic BH: Branch Synchronization — Documentation (task-224–225)

---

## Documentation Reviewed

- `docs/06-tasks/task-224.md`, `task-225.md`
- `docs/03-sad/11-module-master-data.md` Section 10.1 Master Data Management Flow, Section 10.3 Cross Module Usage, Section 11.2 Branch (Business Rule: "Branch tidak boleh dihapus apabila memiliki transaksi")
- `docs/03-sad/21-module-system.md` Section 7 Event, Notification, dan Background Processing
- `phase-4-plan.md` Ambiguity #2 (Branch entity never published a domain event before this)

## Task List

| Task | Name |
|---|---|
| task-224 | New Branch Bootstrap Workflow (event consumer on `BranchCreated`) |
| task-225 | Branch Deactivation Guard |

## Implementation Plan

`BootstrapNewBranchUseCase` subscribes to a new `BranchCreated` event (published via a new optional `onCreated` hook on Branch's `buildCrudUseCases` wiring — MOD-018 mandates this event but Phase 1's task-022 never implemented it). Idempotent per branchId, it provisions three things inside the consumer, each independently checked-before-write:

1. A default `WarehouseLocation` (`locationCode: 'MAIN'`) — skipped if one already exists for the branch.
2. A starter Chart of Accounts, recursively mirroring every shared-template (`branchId: null`) `Account` into a branch-scoped copy **with hierarchy preserved** (a child account's `parentId` resolves to its newly-created branch-scoped parent's id, not the template's) — skipped per-account if a branch-scoped account with that code already exists.
3. Every `GLOBAL`-scope System Parameter, copied to `BRANCH` scope for the new branch — skipped per-key if a `BRANCH`-scope override already exists (never clobbers a pre-existing branch-level customization).

`CheckBranchHasOpenTransactionsUseCase` reads Reservation/Queue/Billing/Warehouse(x2)/Finance's own repository interfaces (5 new narrow `countOpenByBranch` methods + Billing's pre-existing `sumOutstandingByBranch`) and is wired into Branch's `validateUpdate` hook: `isActive: false` triggers the check, rejecting with every blocking module named in the error message.

## Files Created

- `apps/backend/src/modules/master-data/domain/events/MasterDataEvents.ts` (`BRANCH_CREATED_EVENT`)
- `apps/backend/src/modules/system/application/use-cases/BootstrapNewBranchUseCase.ts` + `.test.ts`
- `apps/backend/src/modules/master-data/application/use-cases/CheckBranchHasOpenTransactionsUseCase.ts` + `.test.ts`

## Files Modified

- `apps/backend/src/modules/master-data/application/shared/crudUseCaseFactory.ts` (`CrudUseCaseHooks.onCreated` — fires after create + audit record; used only by Branch's own wiring, every other entity on this factory is unaffected)
- `apps/backend/src/modules/master-data/presentation/routes/master-data.routes.ts` (publishes `BranchCreated` from Branch's `onCreated` hook; subscribes `BootstrapNewBranchUseCase` wrapped in try/catch — a bootstrap failure must never fail the Branch-creation request that triggered it, mirroring the established `EMR_FINISHED_EVENT` consumer pattern; `validateUpdate` hook wired to `CheckBranchHasOpenTransactionsUseCase`)
- `apps/backend/src/app.ts` (`buildMasterDataModule` gained an `eventBus` parameter)
- `apps/backend/src/modules/finance/domain/repositories/IAccountRepository.ts`, `AccountRepository.ts` (`listTemplateAccounts()`)
- `apps/backend/src/modules/reservation/domain/repositories/IReservationRepository.ts`, `ReservationRepository.ts` (`countOpenByBranch`)
- `apps/backend/src/modules/queue/domain/repositories/IQueueRepository.ts`, `QueueRepository.ts` (`countOpenByBranch`)
- `apps/backend/src/modules/warehouse/domain/repositories/IPurchaseOrderRepository.ts`, `PurchaseOrderRepository.ts`, `IGoodsReceiptRepository.ts`, `GoodsReceiptRepository.ts` (`countOpenByBranch`; GoodsReceipt's joins through `warehouse.branchId` since GoodsReceipt has no direct `branchId` column)
- `apps/backend/src/modules/finance/domain/repositories/IJournalRepository.ts`, `JournalRepository.ts` (`countOpenByBranch`)
- `apps/backend/src/modules/master-data/domain/exceptions/MasterDataExceptions.ts` (`BranchHasOpenTransactionsException` — `MD_BRANCH_HAS_OPEN_TRANSACTIONS`, 422)
- `apps/backend/tests/fakes/{reservationFakes,queueFakes,warehouseFakes,financeFakes}.ts` (matching `countOpenByBranch`/`listTemplateAccounts` implementations; `FakeGoodsReceiptRepository` gained a test-only `warehouseBranchMap`/`seedWarehouseBranch` helper for the warehouse→branch join)

## Database Changes

None new — reads/writes existing `warehouse_locations`, `finance_accounts`, `system_parameters`, and the existing transactional tables' `status`/`branchId` columns.

## API Changes

None new. `PUT /branches/{id}` (existing) gained a `422 MD_BRANCH_HAS_OPEN_TRANSACTIONS` response when `isActive: false` is rejected.

## Frontend Changes

None — backend-only.

## Security Validation

- `BootstrapNewBranchUseCase` runs as a trusted system worker (`system:branch-bootstrap` actor), with every write carrying an Audit Trail entry correlated to the triggering branchId, per task-224's own Security Impact.
- The deactivation rejection is explicit and auditable (`422` with the blocking module names), not a silent no-op, per task-225's own AC.

## Architecture Validation

- **Live-verified, not just unit-tested**: created a real branch against the running dev server and confirmed the Warehouse Location, all 8 mirrored Chart-of-Accounts entries (hierarchy intact), and inherited System Parameters were provisioned; then confirmed deactivating a branch with open Reservations was rejected while an empty branch succeeded. See `phase-4-implementation-report.md` Section 6.
- "Open" is defined per module using each module's own existing status enum (Reservation: not in `{COMPLETED, CANCELLED, NO_SHOW}`; Queue: not in `{COMPLETED, CANCELLED, NO_SHOW, SKIPPED}`; PurchaseOrder: not in `{RECEIVED, CANCELLED, REJECTED}`; GoodsReceipt: `DRAFT`; Journal: `DRAFT`) — no new status vocabulary invented.
- Idempotency is enforced per-step (per Warehouse Location code, per Account code, per Parameter key) rather than a single "already bootstrapped" flag on Branch, so a partially-failed prior run (e.g. Warehouse Location succeeded but the process crashed before Accounts) still completes correctly on redelivery instead of skipping everything.
