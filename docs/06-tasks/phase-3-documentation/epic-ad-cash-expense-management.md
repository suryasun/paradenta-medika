# Epic AD: Cash & Expense Management — Documentation (task-153–161)

---

## Documentation Reviewed

- `docs/06-tasks/task-153.md`–`task-161.md`
- `docs/03-sad/17-module-finance.md` Section 4 UC-FIN-003 (Record Expense), UC-FIN-004 (Transfer Cash/Bank), Section 6.3 API, Section 6.6 error codes

## Task List

| Task | Name |
|---|---|
| task-153 | Cash Account (Entity, Migration & CRUD, `GET/POST /finance/cash-accounts`) — P1 |
| task-154 | Cash Account Movements (`GET /finance/cash-accounts/{cashAccountId}/movements`) — P1 |
| task-155 | Cash Transfer (`POST /finance/cash-transfers`) — P1 |
| task-156 | Expense (Entity & Migration) — P1 |
| task-157 | Create and List Expense (`POST/GET /finance/expenses`) — P1 |
| task-158 | Get and Update Expense (`GET/PATCH /finance/expenses/{expenseId}`) — P1 |
| task-159 | Submit Expense (`POST /finance/expenses/{expenseId}/submit`) — P1 |
| task-160 | Approve and Reject Expense (`POST .../approve`, `POST .../reject`) — P1 |
| task-161 | Pay Expense (`POST .../pay`) — P1 |

## Implementation Plan

`CashAccount` is "the register used by Daily Closing and Expense payment" (task-153's own Business Goal). Cash Transfer posts a balanced system journal between two cash accounts (debit destination, credit source) within a DB transaction, updating both cached balances. `Expense` models UC-FIN-003's lifecycle exactly: draft→submitted→approved/rejected→paid, with Pay Expense posting a Journal debiting the expense account and crediting the chosen cash account.

Two deliberate, documented deviations from a literal schema reading: (1) there is no separate `cash_movements` table — task-154's Movements endpoint sources directly from posted `JournalLine`s filtered by `ledgerAccountId`, rather than a dedicated `CashMovement` aggregate; (2) there is no `expense_categories` table — `Expense.category` is a plain string field, not an FK, consistent with the codebase's established "no invented master-data catalog" precedent (mirrors Phase 2's Medicine free-text decision).

## Files Created

- `apps/backend/src/modules/finance/application/use-cases/CreateCashAccountUseCase.ts`, `ListCashAccountsUseCase.ts`, `GetCashAccountMovementsUseCase.ts`, `CreateCashTransferUseCase.ts`, `CreateExpenseUseCase.ts`, `ListExpensesUseCase.ts`, `GetExpenseUseCase.ts`, `UpdateExpenseUseCase.ts`, `SubmitExpenseUseCase.ts`, `ApproveExpenseUseCase.ts`, `RejectExpenseUseCase.ts`, `PayExpenseUseCase.ts`
- `apps/backend/src/modules/finance/application/use-cases/CashAndExpenseLifecycle.test.ts`
- `apps/backend/src/modules/finance/application/dtos/CashAccountRequestDto.ts`, `CashAccountQueryDto.ts`, `CashAccountResponseDto.ts`, `CashAccountMovementResponseDto.ts`, `CashTransferRequestDto.ts`, `ExpenseRequestDto.ts`, `ExpenseQueryDto.ts`, `ExpenseResponseDto.ts`
- `apps/backend/src/modules/finance/application/mappers/CashAccountMapper.ts`, `ExpenseMapper.ts`
- `apps/backend/src/modules/finance/application/services/ExpenseNumberGenerator.ts`
- `apps/backend/src/modules/finance/domain/repositories/ICashAccountRepository.ts`, `IExpenseRepository.ts` (+ Prisma implementations)
- `apps/backend/src/modules/finance/presentation/controllers/CashAccountController.ts`, `CashTransferController.ts`, `ExpenseController.ts`

## Files Modified

- `FinanceExceptions.ts` — `CashAccountNotFoundException`, `AccountMappingMissingException` (`FIN_ACCOUNT_MAPPING_MISSING`), `AccountMappingAlreadyExistsException` (extrapolated), `CashTransferSourceDestinationSameException` (extrapolated), `CashTransferCrossBranchException` (extrapolated, out-of-scope guard), `ExpenseNotFoundException`, `ExpenseNotInStatusException` (`FIN_EXPENSE_INVALID_STATUS`, extrapolated), `ExpenseSegregationOfDutiesException` (`FIN_SEGREGATION_OF_DUTIES`), `ExpenseNotApprovedException` (`FIN_EXPENSE_NOT_APPROVED` — the mandatory Section 6.6 code), `ExpensePaymentExceedsApprovedException` (extrapolated)
- `finance.routes.ts` (lines 351–408)
- `schema.prisma` (`CashAccount` → `cash_accounts`, `Expense` → `expenses`, lines 2570–2681)

## Database Changes

- `CashAccount` (`cash_accounts`): `branchId`, `code`, `name`, `accountType` enum `CashAccountType` {`CASH`, `BANK`, `CLEARING`}, `ledgerAccountId` (FK `Account`), `accountNumber?` (masked), `currentBalance` (`Decimal`, a cached running balance updated only by Cash Transfer/Pay Expense), `isActive`. `@@unique([branchId, code])`.
- `Expense` (`expenses`): `expenseNo` (unique), `branchId`, `expenseDate`, `category` (VarChar30, plain string), `expenseAccountId` (FK `Account`), `amount`, `approvedAmount?`, `paidAmount?`, `payeeName?`, `description?`, `evidenceUrl?`, `status` enum `FinanceExpenseStatus` {`DRAFT`, `SUBMITTED`, `APPROVED`, `REJECTED`, `PAID`, `CANCELLED`}, `submittedAt`, `approvedBy/At`, `rejectedBy/At/rejectionReason`, `paidBy/At`, `paymentJournalId?` (unique FK `Journal`).

## API Changes

| Endpoint | Permission |
|---|---|
| `GET /finance/cash-accounts` | `finance.cash.read` |
| `POST /finance/cash-accounts` | `finance.cash.manage` |
| `GET .../movements` | `finance.cash.read` |
| `POST /finance/cash-transfers` | `finance.cash.transfer` |
| `GET /finance/expenses` | `finance.expense.read` |
| `POST /finance/expenses` | `finance.expense.create` |
| `GET /finance/expenses/{id}` | `finance.expense.read` |
| `PATCH /finance/expenses/{id}` | `finance.expense.create` (reused — no literal Section 8.1 verb split exists for Update) |
| `POST .../submit` | `finance.expense.create` (reused) |
| `POST .../approve` | `finance.expense.approve` |
| `POST .../reject` | `finance.expense.approve` (reused) |
| `POST .../pay` | `finance.expense.pay` |

The `finance.routes.ts` comment documents the permission-reuse choices explicitly. Cross-checked against `openapi.yaml`: `/finance/cash-accounts` (4133), `.../movements` (4175), `/finance/cash-transfers` (4188), `/finance/expenses` (4213), `/finance/expenses/{expenseId}` (4263), `.../submit` (4283), `.../approve` (4294), `.../reject` (4313), `.../pay` (4334) — all present and consistent.

## Frontend Changes

`apps/frontend/app/(dashboard)/finance/cash-accounts/page.tsx`, `finance/cash-movements/page.tsx`, `finance/cash-transfers/page.tsx`, `finance/expenses/page.tsx`, `finance/expenses/[id]/page.tsx` → `CashAccountsAdminPage.tsx`, `CashAccountMovementsPage.tsx`, `CashTransferPage.tsx`, `ExpenseListPage.tsx`, `ExpenseDetailPage.tsx`; hooks `useCashAccount.ts`, `useExpense.ts`.

## Security Validation

`CashTransferSourceDestinationSameException` mirrors Warehouse's `WHS_SOURCE_DESTINATION_SAME` pattern for the Finance equivalent; `CashTransferCrossBranchException` additionally guards against a transfer crossing branch boundaries. `ExpenseSegregationOfDutiesException` enforces maker-checker on Approve; `ExpenseNotApprovedException` blocks Pay on an unapproved Expense; `ExpensePaymentExceedsApprovedException` prevents paying more than the approved amount. Cash Transfer and Pay Expense both take `financialPeriodRepository` as a dependency, confirming `FIN_PERIOD_CLOSED` enforcement extends to these system-generated postings, not just manual Journal entries.

## Architecture Validation

Cash Transfer and Pay Expense both compose atomically via the Journal-posting primitive established in Epic AC — shared use of `JournalNumberGenerator` and `journalRepository.createPosted`, no duplicated balanced-posting logic anywhere in this epic. No Epic AD ambiguity was flagged in `phase-3-plan.md`.
