# Epic AB: Finance Foundation — Documentation (task-143–145)

---

## Documentation Reviewed

- `docs/06-tasks/task-143.md`–`task-145.md`
- `docs/03-sad/17-module-finance.md` Section 5 (Data Model), Section 6.1 (Chart of Accounts), Section 6.6 (10 mandatory error codes)
- `docs/01-prd/business-rules.md` § 6

## Task List

| Task | Name |
|---|---|
| task-143 | Chart of Accounts (`Account` entity & migration) — P0 |
| task-144 | Create and List Account (`POST/GET /finance/accounts`) — P0 |
| task-145 | Update and Deactivate Account (`PATCH /finance/accounts/{accountId}`, `POST .../deactivate`) — P1 |

## Implementation Plan

Foundational `Account` (Chart of Accounts) entity supporting a self-referencing hierarchy (`parentId`), an `isPostable`/`isActive` pair, and an `accountType`/`normalBalance` consistency invariant (asset/expense = debit-normal; liability/equity/revenue = credit-normal). `isPostable=false` accounts can never be a journal target (`FIN_ACCOUNT_NOT_POSTABLE`); `accountType`/`normalBalance` become immutable once any journal has posted against the account; deactivating an account with posted history is a soft-delete only (non-postable going forward), never a hard delete. All later Finance epics post against `Account` rows through this one gate.

## Files Created

- `apps/backend/src/modules/finance/application/use-cases/CreateAccountUseCase.ts`, `ListAccountsUseCase.ts`, `UpdateAccountUseCase.ts`, `DeactivateAccountUseCase.ts`
- `apps/backend/src/modules/finance/application/use-cases/AccountLifecycle.test.ts`
- `apps/backend/src/modules/finance/application/dtos/AccountRequestDto.ts`, `AccountQueryDto.ts`, `AccountResponseDto.ts`
- `apps/backend/src/modules/finance/application/mappers/AccountMapper.ts`
- `apps/backend/src/modules/finance/domain/repositories/IAccountRepository.ts` (+ Prisma implementation `AccountRepository.ts`)
- `apps/backend/src/modules/finance/presentation/controllers/AccountController.ts`

## Files Modified

- `apps/backend/src/modules/finance/domain/exceptions/FinanceExceptions.ts` — `AccountNotFoundException`, `AccountCodeExistsException` (`FIN_ACCOUNT_CODE_EXISTS`, extrapolated), `AccountParentNotFoundException`, `AccountCyclicHierarchyException` (`FIN_ACCOUNT_CYCLIC_HIERARCHY`), `AccountTypeNormalBalanceMismatchException` (`FIN_ACCOUNT_TYPE_MISMATCH`), `AccountNotPostableException` (`FIN_ACCOUNT_NOT_POSTABLE` — the mandatory Section 6.6 code)
- `apps/backend/src/modules/finance/presentation/routes/finance.routes.ts`
- `apps/backend/prisma/schema.prisma` (`Account` model → table `accounts`, lines 2386–2415)

## Database Changes

`Account` (table `accounts`): `id`, `branchId?`, `code` (VarChar30), `name` (VarChar150), `accountType` (enum `FinanceAccountType`), `normalBalance` (enum `FinanceNormalBalance`), `parentId?` (self-FK hierarchy), `isPostable` (default true), `isActive` (default true), standard audit columns. Relations: `parent`/`children` (self-referencing hierarchy), `lines` (`JournalLine[]`), `cashAccounts`, `expenses`, `feeSettlements`, `financeAccountMappings`. `@@unique([branchId, code])`; indexes on `parentId`, `accountType`.

## API Changes

| Endpoint | Permission |
|---|---|
| `GET /finance/accounts` | `finance.account.read` |
| `POST /finance/accounts` | `finance.account.manage` |
| `PATCH /finance/accounts/{accountId}` | `finance.account.manage` |
| `POST /finance/accounts/{accountId}/deactivate` | `finance.account.manage` |

Cross-checked against `openapi.yaml`: `/finance/accounts` (line 3846), `/finance/accounts/{accountId}` (3898), `.../deactivate` (3910) — all present and consistent.

## Frontend Changes

`apps/frontend/app/(dashboard)/finance/accounts/page.tsx` → `apps/frontend/features/finance/components/AccountsAdminPage.tsx`; hooks in `apps/frontend/features/finance/hooks/useAccounts.ts`; service `finance.service.ts`; types `finance.types.ts`. Notable: unlike the backend, no Finance frontend file anywhere carries a literal `task-14X` doc-comment citation — the frontend appears to have been built as a later, uncited implementation sweep covering all five Finance epics at once, rather than epic-by-epic.

## Security Validation

Read/write split via `finance.account.read`/`finance.account.manage` (deactivation reuses the manage permission rather than inventing a third code). Audit Trail entries confirmed wired via `IAuditService` injection into all four use cases.

## Architecture Validation

Clean layering respected throughout (domain entity/interface → application use case → infrastructure Prisma repo → presentation controller/route). No cross-module DB access; `Account` is referenced by other Finance sub-modules (`CashAccount`, `Expense`, `DoctorFeeSettlement`, `FinanceAccountMapping`) only via FK within the same module. No Epic AB ambiguity was flagged in `phase-3-plan.md`.
