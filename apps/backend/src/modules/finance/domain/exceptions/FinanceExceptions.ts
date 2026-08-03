import { AuthorizationException, BusinessException, ConflictException, NotFoundException } from '../../../../shared/http/exceptions';

export class AccountNotFoundException extends NotFoundException {
  constructor() {
    super('Account not found');
  }
}

/** No literal Section 6.6 code for a duplicate account code -- extrapolated by the same `ITEM_CODE_EXISTS`-style convention used across other modules' Create use cases. */
export class AccountCodeExistsException extends ConflictException {
  constructor() {
    super('Account code already exists in this branch/template scope', 'FIN_ACCOUNT_CODE_EXISTS');
  }
}

export class AccountParentNotFoundException extends NotFoundException {
  constructor() {
    super('Parent account not found');
  }
}

/** docs/03-sad/17-module-finance.md Section 5.2: "parent_id ... no cyclic hierarchy." */
export class AccountCyclicHierarchyException extends BusinessException {
  constructor() {
    super('FIN_ACCOUNT_CYCLIC_HIERARCHY', 'An account cannot be its own ancestor');
  }
}

/**
 * docs/06-tasks/task-143.md AC: "Entity enforces accountType/normalBalance
 * consistency ... asset/expense = debit-normal; liability/equity/revenue
 * = credit-normal."
 */
export class AccountTypeNormalBalanceMismatchException extends BusinessException {
  constructor(accountType: string, expectedNormalBalance: string) {
    super('FIN_ACCOUNT_TYPE_MISMATCH', `${accountType} accounts must have normalBalance=${expectedNormalBalance}`);
  }
}

/** docs/03-sad/17-module-finance.md Section 6.6: "FIN_ACCOUNT_NOT_POSTABLE" (422) -- heading/inactive account selected on a journal line. */
export class AccountNotPostableException extends BusinessException {
  constructor() {
    super('FIN_ACCOUNT_NOT_POSTABLE', 'This account is a heading, inactive, or otherwise not postable');
  }
}

// ---------------------------------------------------------------------------
// Journals (docs/03-sad/17-module-finance.md UC-FIN-002, Section 6.6
// literal error codes where they exist).
// ---------------------------------------------------------------------------

export class JournalNotFoundException extends NotFoundException {
  constructor() {
    super('Journal not found');
  }
}

/** docs/03-sad/17-module-finance.md Section 6.6: "FIN_JOURNAL_UNBALANCED" (422). */
export class JournalUnbalancedException extends BusinessException {
  constructor() {
    super('FIN_JOURNAL_UNBALANCED', 'Total debit and total credit must be equal');
  }
}

/**
 * No literal Section 6.6 code covers a wrong-status journal action
 * (Update/Post/Void requiring draft, Reverse requiring posted) --
 * extrapolated by the same `WHS_*_INVALID_STATUS` naming convention
 * already established throughout the Warehouse module for the identical
 * gap.
 */
export class JournalNotInStatusException extends BusinessException {
  constructor(expected: string) {
    super('FIN_JOURNAL_INVALID_STATUS', `Journal must be in ${expected} status for this action`);
  }
}

/** docs/03-sad/17-module-finance.md Section 6.6: "FIN_SEGREGATION_OF_DUTIES" (403) -- the journal creator cannot also post it. */
export class JournalSegregationOfDutiesException extends AuthorizationException {
  constructor() {
    super('The creator of this journal cannot also post it', 'FIN_SEGREGATION_OF_DUTIES');
  }
}

/** docs/03-sad/17-module-finance.md Section 6.6: "FIN_PERIOD_CLOSED" (409) -- no open financial period covers this journal date. */
export class FinancialPeriodClosedException extends ConflictException {
  constructor() {
    super('This journal date does not fall within an open financial period', 'FIN_PERIOD_CLOSED');
  }
}

/** docs/03-sad/17-module-finance.md Section 6.6: "FIN_DUPLICATE_POSTING" (409) -- an automatic posting's source reference has already been posted. */
export class JournalDuplicatePostingException extends ConflictException {
  constructor() {
    super('This source reference has already been posted', 'FIN_DUPLICATE_POSTING');
  }
}

// ---------------------------------------------------------------------------
// Financial Period (docs/03-sad/17-module-finance.md UC-FIN-007,
// task-168 folded into Epic AC per this phase's documented sequencing).
// ---------------------------------------------------------------------------

export class FinancialPeriodNotFoundException extends NotFoundException {
  constructor() {
    super('Financial period not found');
  }
}

/** docs/03-sad/17-module-finance.md Section 5.2: "Date ranges for active periods must not overlap within a branch." */
export class FinancialPeriodOverlapException extends BusinessException {
  constructor() {
    super('FIN_PERIOD_OVERLAP', 'This period overlaps an existing open or locked period for the branch');
  }
}

// ---------------------------------------------------------------------------
// Cash Account & Cash Transfer (docs/03-sad/17-module-finance.md
// UC-FIN-004, Epic AD task-153-155).
// ---------------------------------------------------------------------------

export class CashAccountNotFoundException extends NotFoundException {
  constructor() {
    super('Cash account not found');
  }
}

/** docs/03-sad/17-module-finance.md Section 6.6: "FIN_ACCOUNT_MAPPING_MISSING" (422) -- the linked ledger account is missing, inactive, or not postable. */
export class AccountMappingMissingException extends BusinessException {
  constructor() {
    super('FIN_ACCOUNT_MAPPING_MISSING', 'The configured posting account is missing, inactive, or not postable');
  }
}

/**
 * No literal Section 6.6 code for transferring a cash account to itself
 * -- extrapolated by the same `WHS_SOURCE_DESTINATION_SAME` naming
 * convention already established in the Warehouse module for the
 * identical gap. UC-FIN-004: "between two distinct active cash accounts
 * in the same branch."
 */
export class CashTransferSourceDestinationSameException extends BusinessException {
  constructor() {
    super('FIN_CASH_TRANSFER_SOURCE_DESTINATION_SAME', 'Transfer source and destination cash account must be different');
  }
}

/** UC-FIN-004: transfers move between "two distinct active cash accounts in the same branch" -- cross-branch transfer (which requires Finance Manager approval and inter-branch clearing accounts per UC-FIN-004's own text) is out of this epic's scope. */
export class CashTransferCrossBranchException extends BusinessException {
  constructor() {
    super('FIN_CASH_TRANSFER_CROSS_BRANCH', 'Cross-branch cash transfers are not supported by this endpoint');
  }
}

// ---------------------------------------------------------------------------
// Expense (docs/03-sad/17-module-finance.md UC-FIN-003, Epic AD
// task-156-161).
// ---------------------------------------------------------------------------

export class ExpenseNotFoundException extends NotFoundException {
  constructor() {
    super('Expense not found');
  }
}

/**
 * No literal Section 6.6 code covers a wrong-status expense action
 * (Update/Submit requiring draft, Approve/Reject requiring submitted) --
 * extrapolated by the same `WHS_*_INVALID_STATUS`/`FIN_JOURNAL_INVALID_
 * STATUS` naming convention already established for the identical gap.
 */
export class ExpenseNotInStatusException extends BusinessException {
  constructor(expected: string) {
    super('FIN_EXPENSE_INVALID_STATUS', `Expense must be in ${expected} status for this action`);
  }
}

/** docs/03-sad/17-module-finance.md Section 8.2: "Expense requester cannot approve their own expense." */
export class ExpenseSegregationOfDutiesException extends AuthorizationException {
  constructor() {
    super('The requester of this expense cannot also approve it', 'FIN_SEGREGATION_OF_DUTIES');
  }
}

/** docs/03-sad/17-module-finance.md Section 6.6: "FIN_EXPENSE_NOT_APPROVED" (409) -- expense cannot be paid yet. */
export class ExpenseNotApprovedException extends ConflictException {
  constructor() {
    super('This expense has not been approved and cannot be paid', 'FIN_EXPENSE_NOT_APPROVED');
  }
}

/** docs/03-sad/17-module-finance.md Section 3.3 Expense invariant: "paid amount cannot exceed approved amount." No literal Section 6.6 code -- extrapolated. */
export class ExpensePaymentExceedsApprovedException extends BusinessException {
  constructor() {
    super('FIN_EXPENSE_PAYMENT_EXCEEDS_APPROVED', 'Payment amount cannot exceed the approved amount');
  }
}

// ---------------------------------------------------------------------------
// Daily Closing (docs/03-sad/17-module-finance.md UC-FIN-005, Epic AE
// task-163-165).
// ---------------------------------------------------------------------------

export class DailyClosingNotFoundException extends NotFoundException {
  constructor() {
    super('Daily closing not found');
  }
}

/** docs/03-sad/17-module-finance.md Section 6.6: "FIN_CLOSING_DUPLICATE" (409) -- a closing already exists for this branch/cashAccount/cashier/date scope. */
export class DailyClosingDuplicateException extends ConflictException {
  constructor() {
    super('A daily closing already exists for this scope and date', 'FIN_CLOSING_DUPLICATE');
  }
}

/** docs/03-sad/17-module-finance.md Section 6.6: "FIN_CLOSING_VARIANCE_REASON_REQUIRED" (422) -- non-zero variance lacks a reason. */
export class DailyClosingVarianceReasonRequiredException extends BusinessException {
  constructor() {
    super('FIN_CLOSING_VARIANCE_REASON_REQUIRED', 'A variance reason is required when counted balance differs from expected balance');
  }
}

/** No literal Section 6.6 code for approving an already-approved closing -- extrapolated by the same `FIN_*_INVALID_STATUS` convention. */
export class DailyClosingNotInStatusException extends BusinessException {
  constructor(expected: string) {
    super('FIN_CLOSING_INVALID_STATUS', `Daily closing must be in ${expected} status for this action`);
  }
}

/** docs/03-sad/17-module-finance.md Section 8.2: "Cashier may submit only their own drawer/shift closing; variance approval is separate" -- approver cannot be the requester. */
export class DailyClosingSegregationOfDutiesException extends AuthorizationException {
  constructor() {
    super('The requester of this closing cannot also approve it', 'FIN_SEGREGATION_OF_DUTIES');
  }
}

// ---------------------------------------------------------------------------
// Doctor Fee Settlement (docs/03-sad/17-module-finance.md UC-FIN-006,
// Epic AE task-166-167).
// ---------------------------------------------------------------------------

export class DoctorFeeSettlementNotFoundException extends NotFoundException {
  constructor() {
    super('Doctor fee settlement not found');
  }
}

/** docs/03-sad/17-module-finance.md Section 6.6: "FIN_SETTLEMENT_SOURCE_USED" (409) -- a source has already been settled. */
export class SettlementSourceUsedException extends ConflictException {
  constructor() {
    super('One or more fee sources have already been included in a prior settlement', 'FIN_SETTLEMENT_SOURCE_USED');
  }
}

/** No literal Section 6.6 code for a wrong-status settlement action -- extrapolated by the same `FIN_*_INVALID_STATUS` convention. */
export class DoctorFeeSettlementNotInStatusException extends BusinessException {
  constructor(expected: string) {
    super('FIN_SETTLEMENT_INVALID_STATUS', `Settlement must be in ${expected} status for this action`);
  }
}

/** docs/03-sad/17-module-finance.md Section 8.2 segregation-of-duties principle applied to settlement approval, the same pattern as Journal/Expense. */
export class SettlementSegregationOfDutiesException extends AuthorizationException {
  constructor() {
    super('The requester of this settlement cannot also approve it', 'FIN_SEGREGATION_OF_DUTIES');
  }
}

/** docs/06-tasks/task-167.md AC: "Pay rejected unless settlement is approved." No literal Section 6.6 code -- extrapolated by the same `FIN_EXPENSE_NOT_APPROVED` naming convention. */
export class SettlementNotApprovedException extends ConflictException {
  constructor() {
    super('This settlement has not been approved and cannot be paid', 'FIN_SETTLEMENT_NOT_APPROVED');
  }
}

// ---------------------------------------------------------------------------
// Financial Period Lock/Close/Reopen (docs/03-sad/17-module-finance.md
// UC-FIN-007, Epic AE task-169-171; Create/List landed in Epic AC).
// ---------------------------------------------------------------------------

/** No literal Section 6.6 code for a wrong-status period action -- extrapolated by the same `FIN_*_INVALID_STATUS` convention. */
export class FinancialPeriodNotInStatusException extends BusinessException {
  constructor(expected: string) {
    super('FIN_PERIOD_INVALID_STATUS', `Financial period must be in ${expected} status for this action`);
  }
}
