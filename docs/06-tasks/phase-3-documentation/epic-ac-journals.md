# Epic AC: Journals — Documentation (task-146–152, plus task-168 pulled forward)

---

## Documentation Reviewed

- `docs/06-tasks/task-146.md`–`task-152.md`, `docs/06-tasks/task-168.md`
- `docs/03-sad/17-module-finance.md` Section 4 UC-FIN-002, Section 5 Data Model, Section 6.2 API, Section 6.6 error codes
- `docs/06-tasks/phase-3-plan.md` Ambiguity #4 (Financial Period enforcement sequencing) and its own recommended fix: build task-168 (Financial Period) alongside Journals rather than strictly after task-150 numerically

## Task List

| Task | Name |
|---|---|
| task-146 | Journal (Entity & Migration) — P0 |
| task-147 | Create Manual Journal (`POST /finance/journals`) — P0 |
| task-148 | List and Get Journal (`GET /finance/journals`, `GET /finance/journals/{journalId}`) — P1 |
| task-149 | Update Journal (`PATCH /finance/journals/{journalId}`) — P1 |
| task-150 | Post Journal (`POST /finance/journals/{journalId}/post`) — P0 |
| task-151 | Reverse Journal (`POST /finance/journals/{journalId}/reverse`) — P0 |
| task-152 | Void Journal (`POST /finance/journals/{journalId}/void`) — P0 |
| task-168 (pulled forward per plan's own Implementation Order) | Financial Period (Entity, Migration & Create/List) — P0 |

## Implementation Plan

`Journal` is the ledger-of-record aggregate: header + balanced debit/credit `JournalLine`s, rejecting unbalanced input before persistence (`FIN_JOURNAL_UNBALANCED`). Post transitions a draft into the immutable ledger (`journalNumber` assigned only on posting), enforcing segregation of duties (poster ≠ creator) and open-period status. Reverse creates a linked reversal journal against a posted one (mandatory reason); Void is draft-only and rejected once a journal is posted (must use Reverse instead). `FinancialPeriod` (task-168) was built in the **same commit** as this epic (`2e978e9`, "Epic AC — Journals + Financial Period foundation, task-146-152, task-168") rather than after task-150 numerically, directly implementing `phase-3-plan.md`'s own recommended resolution of Ambiguity #4.

## Ambiguity #4 resolution (verified in code)

`PostJournalUseCase` (lines 42–49) takes `financialPeriodRepository: IFinancialPeriodRepository` as a constructor dependency and, at lines 63–66, calls `findOpenPeriodForDate(existing.branchId, existing.journalDate)`, throwing `FinancialPeriodClosedException` (`FIN_PERIOD_CLOSED`) if no open period covers the date. The `finance.routes.ts` composition root (lines 111–117, 192) carries an explicit comment: *"task-168 (Financial Period) ... is folded in here per this phase's documented sequencing — PostJournalUseCase's FIN_PERIOD_CLOSED check needs it."* `ReverseJournalUseCase`, `CreateCashTransferUseCase`, `PayExpenseUseCase`, and `PayDoctorFeeSettlementUseCase` all also take `financialPeriodRepository`, confirming period enforcement is applied consistently across every posting path in the module, not just Post Journal itself. Post Journal genuinely checks a real `FinancialPeriod` row from day one — no follow-up integration patch was needed, exactly as the plan's own Implementation Order recommended.

## Files Created

- `apps/backend/src/modules/finance/application/use-cases/CreateManualJournalUseCase.ts`, `ListJournalsUseCase.ts`, `GetJournalUseCase.ts`, `UpdateJournalUseCase.ts`, `PostJournalUseCase.ts`, `ReverseJournalUseCase.ts`, `VoidJournalUseCase.ts`, `CreatePeriodUseCase.ts`, `ListPeriodsUseCase.ts`
- `apps/backend/src/modules/finance/application/use-cases/JournalLifecycle.test.ts`, `FinancialPeriodLifecycle.test.ts`
- `apps/backend/src/modules/finance/application/services/JournalNumberGenerator.ts`, `JournalLineValidator.ts`
- `apps/backend/src/modules/finance/application/dtos/JournalRequestDto.ts`, `JournalQueryDto.ts`, `JournalResponseDto.ts`
- `apps/backend/src/modules/finance/application/mappers/JournalMapper.ts`
- `apps/backend/src/modules/finance/domain/repositories/IJournalRepository.ts`, `IFinancialPeriodRepository.ts` (+ Prisma implementations `JournalRepository.ts`, `FinancialPeriodRepository.ts`)
- `apps/backend/src/modules/finance/presentation/controllers/JournalController.ts`

## Files Modified

- `FinanceExceptions.ts` — `JournalNotFoundException`, `JournalUnbalancedException` (`FIN_JOURNAL_UNBALANCED`), `JournalNotInStatusException` (`FIN_JOURNAL_INVALID_STATUS`, extrapolated), `JournalSegregationOfDutiesException` (`FIN_SEGREGATION_OF_DUTIES`), `FinancialPeriodClosedException` (`FIN_PERIOD_CLOSED`), `JournalDuplicatePostingException` (`FIN_DUPLICATE_POSTING`), `FinancialPeriodNotFoundException`, `FinancialPeriodOverlapException`
- `finance.routes.ts` (lines 297–349)
- `schema.prisma` (`Journal` → table `journal_entries`, `JournalLine` → table `journal_details`, `FinancialPeriod` → table `financial_periods`, lines 2443–2569)

## Database Changes

- `Journal` (`journal_entries`): `journalNo` (unique, nullable until posted per task-146's own AC), `branchId`, `journalDate`, `referenceType?`/`referenceId?`/`postingType?` (an idempotency-key trio), `description`, `status` enum `FinanceJournalStatus` {`DRAFT`, `POSTED`, `REVERSED`, `VOIDED`}, `postedAt/By`, `voidedAt/By/voidReason`, `reversalOfId` (unique self-FK), `reverseReason`. `@@unique([referenceType, referenceId, postingType], name: "idempotency_key")`.
- `JournalLine` (`journal_details`): `journalId`, `accountId`, `debit`/`credit` (`Decimal(18,2)`, default 0), `description?`, `costCenterId?`.
- `FinancialPeriod` (`financial_periods`): `branchId`, `periodName`, `startDate`/`endDate`, `status` enum `FinancialPeriodStatus` {`OPEN`, `LOCKED`, `CLOSED`}, `lockedBy/At`, `closedBy/At`, `reopenedBy/At`, `reopenReason?`. Overlap check (`FinancialPeriodOverlapException`) is enforced at the application layer for `OPEN`/`LOCKED` periods only.

## API Changes

| Endpoint | Permission |
|---|---|
| `GET /finance/journals` | `finance.journal.read` |
| `GET /finance/journals/{journalId}` | `finance.journal.read` |
| `POST /finance/journals` | `finance.journal.create` |
| `PATCH /finance/journals/{journalId}` | `finance.journal.update` |
| `POST .../post` | `finance.journal.post` |
| `POST .../reverse` | `finance.journal.reverse` |
| `POST .../void` | `finance.journal.void` |
| `GET/POST /finance/periods` | `finance.period.read` / `.manage` |

Cross-checked against `openapi.yaml`: `/finance/journals` (3924), `/finance/journals/{journalId}` (3980), `.../post` (4000), `.../reverse` (4013), `.../void` (4036) — all present.

## Frontend Changes

`apps/frontend/app/(dashboard)/finance/journals/page.tsx` + `journals/[id]/page.tsx` → `JournalListPage.tsx`, `JournalDetailPage.tsx`; hook `useJournal.ts`. No literal task-ID citations found in the frontend files (consistent with the rest of the Finance frontend).

## Security Validation

Segregation-of-duties is confirmed enforced in code, not just described: `PostJournalUseCase.execute()` throws `JournalSegregationOfDutiesException` when `existing.createdBy === input.actorUserId` (lines 59–61).

## Architecture Validation

`PostJournalUseCase` is the single write path every later automated-posting flow (Epic AE's Daily Closing and Automatic Billing Event) composes rather than re-implementing balanced-posting logic — confirmed by `RecordBillingPaymentUseCase` and `CreateDailyClosingUseCase` both importing Journal-posting primitives rather than writing `JournalLine` rows directly. This resolves Ambiguity #4 exactly as `phase-3-plan.md`'s own Implementation Order recommended, avoiding the "task-150 needs a follow-up patch" contingency it flagged.
