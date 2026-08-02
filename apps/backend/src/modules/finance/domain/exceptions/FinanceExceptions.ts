import { BusinessException, ConflictException, NotFoundException } from '../../../../shared/http/exceptions';

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
