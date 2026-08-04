import { BusinessException, ConflictException, NotFoundException } from '../../../../shared/http/exceptions';

export class MasterDataNotFoundException extends NotFoundException {
  constructor(entityName: string) {
    super(`${entityName} not found`);
  }
}

export class MasterDataCodeExistsException extends ConflictException {
  constructor(entityName: string) {
    super(`${entityName} code already exists`);
  }
}

export class MasterDataReferenceInvalidException extends NotFoundException {
  constructor(message: string) {
    super(message);
  }
}

/** docs/06-tasks/task-212.md AC: "neither exists, the caller receives an explicit error rather than a silently guessed branch." */
export class NoDefaultBranchConfiguredException extends BusinessException {
  constructor() {
    super('MD_NO_DEFAULT_BRANCH', 'No default branch is assigned to this user and no clinic-level default branch is configured');
  }
}

/** docs/06-tasks/task-225.md: "Deactivation is rejected when any open transaction exists in any of the checked modules, with an error identifying which module blocked it." */
export class BranchHasOpenTransactionsException extends BusinessException {
  constructor(blockedByModules: string[]) {
    super('MD_BRANCH_HAS_OPEN_TRANSACTIONS', `Branch cannot be deactivated: open transactions exist in ${blockedByModules.join(', ')}`);
  }
}
