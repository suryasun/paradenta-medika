# Epic AE: Daily Closing, Settlement & Period — Documentation (task-162–171)

---

## Documentation Reviewed

- `docs/06-tasks/task-162.md`–`task-171.md`
- `docs/03-sad/17-module-finance.md` UC-FIN-001 (Post Billing Payment), UC-FIN-005, UC-FIN-006 (Settle Doctor Fee), UC-FIN-007 (Close Financial Period, mermaid flowchart), Section 6.4, Section 6.6
- `docs/06-tasks/phase-3-plan.md` Ambiguity #1 (Billing's payment event contract not enumerated with field-level schema) and Ambiguity #2 (Doctor Fee Settlement source records not schema-defined)

## Task List

| Task | Name |
|---|---|
| task-162 | Automatic Billing Event — Post Payment to Finance (event consumer) — P0 |
| task-163 | Daily Closing (Entity & Migration) — P0 |
| task-164 | Create Daily Closing (`POST /finance/daily-closings`) — P0 |
| task-165 | Approve and List Daily Closing (`POST .../approve`, `GET /finance/daily-closings`) — P1 |
| task-166 | Doctor Fee Settlement — Generate (`POST /finance/doctor-fee-settlements/generate`) — P1 |
| task-167 | Approve and Pay Doctor Fee Settlement — P1 |
| task-168 | Financial Period (Entity, Migration & Create/List) — pulled forward into Epic AC's build (see `epic-ac-journals.md`) — P0 |
| task-169 | Lock Period (`POST /finance/periods/{periodId}/lock`) — P1 |
| task-170 | Close Period (`POST .../close`) — P1 |
| task-171 | Reopen Period (`POST .../reopen`) — P1 |

Note: task-168 shipped alongside Epic AC (commit `2e978e9`) rather than with the rest of this epic (commit `856f244`), per `phase-3-plan.md`'s own recommended sequencing. Lock/Close/Reopen (task-169–171) shipped in this epic's own commit, explicitly noted in the commit body as "folded in from Epic AC per earlier user direction."

## Timeline note — task-162 was deferred at both the Epic AE commit and the Phase-3-completion commit; it exists working in the current source tree

Both the commit that built this epic (`856f244`, "Epic AE — daily closing, doctor fee settlement, period lifecycle, task-162-171") and the commit that later closed out Phase 3 (`9fb2771`, "Epic AL... completes Phase 3") explicitly record task-162 as blocked/deferred at their respective points in time. The Epic AE commit body states verbatim: *"task-162 (auto-posting Billing PaymentCompleted into Finance) remains blocked: the PaymentCompleted event exists, but no PaymentMethod-to-ledger-account mapping configuration exists anywhere in schema or docs. Same resolution precedent as task-136/Epic Z: skip and defer rather than invent a mapping schema."* The current source tree, however, contains a complete, working implementation of `RecordBillingPaymentUseCase` including the `FinanceAccountMapping` table this deferral note says didn't exist. Both the event contract and the account-mapping schema were built **after** both of these commits, as later (currently uncommitted) work — recorded here for accuracy rather than silently treating task-162 as having shipped inside the original Epic AE commit.

## Ambiguity #1 resolution — Finance side (verified in code)

- `finance.routes.ts` lines 144–178: Finance subscribes to `PAYMENT_COMPLETED_EVENT = 'PaymentCompleted'` (defined in `apps/backend/src/modules/billing/domain/events/BillingEvents.ts` line 5) via `eventBus.subscribe<PaymentCompletedPayload>(...)`. Resolved as **`PaymentCompleted`**, not the SAD-narrative placeholder name `PaymentReceived` — the routes.ts doc-comment explicitly notes this and states the pattern mirrors Billing's own `EMRFinished` subscription and Warehouse's material-consumption event pattern (Epic Z).
- Wrapped in try/catch (lines 168–177) so a Finance-side failure never propagates back and fails the triggering Billing payment transaction; `FIN_ACCOUNT_MAPPING_MISSING` is specifically logged with an `[OPERATIONAL ALERT]` prefix (line 176) rather than silently dropped, satisfying task-162's own AC.
- Consumer: `RecordBillingPaymentUseCase.ts` reads Billing's own `IInvoiceRepository`/`IPaymentRepository` (a cross-module read via Billing's repository interfaces, not a raw Prisma join), posts one Journal per Payment line, with idempotency enforced per-payment-line via `journalRepository.findByReference('BILLING_PAYMENT', paymentId, 'BILLING_PAYMENT')` (lines 85–88); only if every line is already posted does it raise `JournalDuplicatePostingException`.

## Ambiguity #2 resolution — Doctor Fee Settlement source (verified in code)

`GenerateDoctorFeeSettlementUseCase.ts` (doc comment, lines 21–31): resolved as EMR's `VisitTreatment` rows on finalized visits whose `Treatment.doctorFee` is configured. Query lives in `apps/backend/src/modules/emr/infrastructure/repositories/VisitTreatmentRepository.ts`, method `findUnsettledDoctorFeeSources(doctorId, branchId, periodStart, periodEnd, excludeVisitTreatmentIds)` — a Prisma query filtering `treatment.doctorFee > 0`, `visit.doctorId`/`branchId`/`status` in the finalized-visit-status set, `visitDate` in range. `FIN_SETTLEMENT_SOURCE_USED` is enforced by `settlementRepository.findSettledVisitTreatmentIds(doctorId)` computed **before** querying EMR, with `DoctorFeeSettlementItem.visitTreatmentId`'s DB-level unique constraint as a concurrency backstop against a double-include race. Read via `IVisitTreatmentRepository`, respecting the module-boundary rule (no cross-schema join).

## Files Created

- `apps/backend/src/modules/finance/application/use-cases/RecordBillingPaymentUseCase.ts` + `.test.ts`, `CreateDailyClosingUseCase.ts`, `ApproveDailyClosingUseCase.ts`, `ListDailyClosingsUseCase.ts`, `GenerateDoctorFeeSettlementUseCase.ts`, `ApproveDoctorFeeSettlementUseCase.ts`, `PayDoctorFeeSettlementUseCase.ts`, `ListDoctorFeeSettlementUseCase.ts`, `GetDoctorFeeSettlementUseCase.ts`, `LockFinancialPeriodUseCase.ts`, `CloseFinancialPeriodUseCase.ts`, `ReopenFinancialPeriodUseCase.ts`, `CreateFinanceAccountMappingUseCase.ts`, `ListFinanceAccountMappingsUseCase.ts`
- `apps/backend/src/modules/finance/application/use-cases/DailyClosingAndSettlementLifecycle.test.ts`, `RecordBillingPaymentUseCase.test.ts`
- `apps/backend/src/modules/finance/application/services/DoctorFeeSettlementNumberGenerator.ts`
- `apps/backend/src/modules/finance/application/dtos/DailyClosingRequestDto.ts`, `DailyClosingQueryDto.ts`, `DailyClosingResponseDto.ts`, `DoctorFeeSettlementRequestDto.ts`, `DoctorFeeSettlementQueryDto.ts`, `DoctorFeeSettlementResponseDto.ts`, `FinancialPeriodRequestDto.ts`, `FinancialPeriodQueryDto.ts`, `FinancialPeriodReopenRequestDto.ts`, `FinancialPeriodResponseDto.ts`, `FinanceAccountMappingRequestDto.ts`, `FinanceAccountMappingResponseDto.ts`
- `apps/backend/src/modules/finance/application/mappers/DailyClosingMapper.ts`, `DoctorFeeSettlementMapper.ts`, `FinancialPeriodMapper.ts`, `FinanceAccountMappingMapper.ts`
- `apps/backend/src/modules/finance/domain/repositories/IDailyClosingRepository.ts`, `IDoctorFeeSettlementRepository.ts`, `IFinanceAccountMappingRepository.ts` (+ Prisma implementations)
- `apps/backend/src/modules/finance/presentation/controllers/DailyClosingController.ts`, `DoctorFeeSettlementController.ts`, `FinancialPeriodController.ts`, `FinanceAccountMappingController.ts`

## Files Modified

- `FinanceExceptions.ts`, `finance.routes.ts` (lines 328–349 Period Lock/Close/Reopen, lines 419–466 Daily Closing/Settlement, lines 516–524 Account Mapping)
- `schema.prisma` (`FinanceAccountMapping`, `DailyClosing`, `DoctorFeeSettlement`, `DoctorFeeSettlementItem`, lines 2513–2800)

## Database Changes

- `FinancialPeriod` (`financial_periods`, lines 2513–2539): state machine `OPEN → LOCKED → CLOSED`, Reopen returns to `OPEN`, guarded by `FinancialPeriodNotInStatusException`. Distinct literal permission-catalog entries per SAD §8.1 (`finance.period.lock`, `.close`, `.reopen`) rather than folding all three into `finance.period.manage`. Reopen is deliberately withheld from the Finance Manager role in seed data — relies only on Administrator's blanket permission grant, matching task-171's note that reopen is a distinctly more privileged action than ordinary period management.
- `FinanceAccountMapping` (`finance_account_mappings`, lines 2611–2631): `branchId`, `paymentMethodId` (FK Master Data `PaymentMethod`), `cashAccountId` (FK `CashAccount`), `revenueAccountId` (FK `Account`), `isActive`. `@@unique([branchId, paymentMethodId])`. Kept Finance-owned per the module-contract "no cross-module DB access" rule.
- `DailyClosing` (`daily_closings`, lines 2704–2730): `branchId`, `cashAccountId`, `cashierId`, `closingDate`, `expectedBalance`, `countedBalance`, `variance`, `varianceReason?`, `denominations?` (Json), `status` enum `DailyClosingStatus` {`SUBMITTED`, `APPROVED`}, `approvedBy/At`. `@@unique([branchId, cashAccountId, cashierId, closingDate])` — the SAD's literal `shiftId` unique-scope element was dropped since no shift concept exists in this codebase. `expectedBalance` is sourced from `CashAccount.currentBalance` at closing time. Approval publishes `finance.daily-closing.approved.v1`.
- `DoctorFeeSettlement`/`DoctorFeeSettlementItem` (`doctor_fee_settlements`, lines 2746–2800): `settlementNo` (unique), `branchId`, `doctorId`, `periodStart/End`, `feeAccountId`, `grossAmount`, `deductions` (default 0), `netAmount`, `status` enum {`DRAFT`, `APPROVED`, `PAID`, `CANCELLED`}, `approvedBy/At`, `paidBy/At`, `paymentJournalId?` (unique FK `Journal`). The SAD's two-step accrual/payment posting is collapsed to a single payment posting — Pay atomically creates and posts the payment journal via `IJournalRepository.createPosted()` with system actor `system:doctor-fee-settlement`, deliberately bypassing the human maker-checker check that only applies to manual Draft→Post journals (per SAD §8.2).

## API Changes

| Endpoint | Permission |
|---|---|
| `GET/POST /finance/periods` | `finance.period.read` / `.manage` |
| `POST /finance/periods/{id}/lock` | `finance.period.lock` |
| `POST .../close` | `finance.period.close` |
| `POST .../reopen` | `finance.period.reopen` |
| `POST /finance/daily-closings` | `finance.cash.close` |
| `POST .../approve` | `finance.cash.approve_close` |
| `GET /finance/daily-closings` | `finance.cash.read` |
| `GET /finance/doctor-fee-settlements` (list) | `finance.settlement.read` — post-launch addition |
| `GET /finance/doctor-fee-settlements/{id}` (detail) | `finance.settlement.read` — post-launch addition |
| `POST /finance/doctor-fee-settlements/generate` | `finance.settlement.generate` |
| `POST .../approve` | `finance.settlement.approve` |
| `POST .../pay` | `finance.settlement.pay` |
| `GET/POST /finance/account-mappings` | `finance.account-mapping.read` / `.manage` (extrapolated verbs) |
| (event consumer, no route) — subscribes `PaymentCompleted` | n/a, trusted system worker |

**Documentation drift found:** `GET /finance/doctor-fee-settlements` (list) and `GET /finance/doctor-fee-settlements/{settlementId}` (detail) are registered in `finance.routes.ts` (lines 442–452) with an explicit doc-comment flagging them as a **post-launch addition** — *"List/detail added post-launch ... to activate the previously-reserved finance.settlement.read permission — the frontend had no way to browse/re-open a settlement after creating it"* — but are **not present in `openapi.yaml`**; only `.../generate`, `.../{id}/approve`, and `.../{id}/pay` appear in the spec. This is a real code/spec gap, not a missing feature — the frontend (`apps/frontend/app/(dashboard)/finance/doctor-fee-settlements/page.tsx` and `[id]/page.tsx`) actively consumes both undocumented endpoints. All other Epic AE endpoints are present in `openapi.yaml` and consistent.

## Frontend Changes

Doctor Fee Settlement has a real, working frontend: `apps/frontend/app/(dashboard)/finance/doctor-fee-settlements/page.tsx` + `[id]/page.tsx` → `DoctorFeeSettlementListPage.tsx`, `DoctorFeeSettlementDetailPage.tsx`, using `useDoctorFeeSettlements`, `useDoctorFeeSettlement`, `useGenerateDoctorFeeSettlement`, `useApproveDoctorFeeSettlement`, `usePayDoctorFeeSettlement` hooks, wired into `apps/frontend/config/navigation.ts`. `finance/daily-closings/page.tsx`, `finance/periods/page.tsx`, and `finance/account-mappings/page.tsx` also exist (`DailyClosingListPage.tsx`, `FinancialPeriodListPage.tsx`, `AccountMappingsAdminPage.tsx`).

## Security Validation

`FIN_SEGREGATION_OF_DUTIES` is enforced separately for Daily Closing approval (`DailyClosingSegregationOfDutiesException`) and Settlement approval (`SettlementSegregationOfDutiesException`) — two distinct exception classes, not a shared generic check. `DailyClosingVarianceReasonRequiredException` (`FIN_CLOSING_VARIANCE_REASON_REQUIRED`) and `DailyClosingDuplicateException` (`FIN_CLOSING_DUPLICATE`) are both confirmed literal exception classes. `SettlementNotApprovedException` blocks Pay on an unapproved settlement, mirroring Expense's equivalent gate in Epic AD. `RecordBillingPaymentUseCase` runs as a trusted system worker with no end-user permission gate, matching task-162's own Security Impact text.

## Architecture Validation

- `RecordBillingPaymentUseCase` and `CreateDailyClosingUseCase` both compose Epic AC's Journal-posting primitives rather than writing `JournalLine` rows directly.
- `GenerateDoctorFeeSettlementUseCase` reads EMR data exclusively through `IVisitTreatmentRepository`, never a direct cross-schema query — satisfies `docs/04-ai-contract/07-module-contract.md`'s repository-interface-as-sanctioned-channel pattern.
- `CloseFinancialPeriodUseCase` publishes an event via `eventBus` for downstream Reporting consumption, matching UC-FIN-007's AC.
- All 10 mandatory Finance error codes are confirmed present across this epic and Epics AB–AD combined: `FIN_JOURNAL_UNBALANCED`, `FIN_PERIOD_CLOSED`, `FIN_ACCOUNT_NOT_POSTABLE`, `FIN_DUPLICATE_POSTING`, `FIN_EXPENSE_NOT_APPROVED`, `FIN_CLOSING_DUPLICATE`, `FIN_CLOSING_VARIANCE_REASON_REQUIRED`, `FIN_SETTLEMENT_SOURCE_USED`, `FIN_SEGREGATION_OF_DUTIES` (4 separate exception classes emit this one code), `FIN_ACCOUNT_MAPPING_MISSING`.
- Both `phase-3-plan.md` Ambiguity #1 (Finance side) and Ambiguity #2 are resolved with concrete, cited code evidence — though, per the timeline note above, task-162's resolution landed after both the commit that built this epic and the commit that declared Phase 3 complete.
