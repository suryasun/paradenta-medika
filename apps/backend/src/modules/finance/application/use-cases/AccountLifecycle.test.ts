import { CreateAccountUseCase } from './CreateAccountUseCase';
import { ListAccountsUseCase } from './ListAccountsUseCase';
import { UpdateAccountUseCase } from './UpdateAccountUseCase';
import { DeactivateAccountUseCase } from './DeactivateAccountUseCase';
import { FakeAccountRepository } from '../../../../../tests/fakes/financeFakes';
import { FakeAuditService } from '../../../../../tests/fakes/authFakes';
import {
  AccountCodeExistsException,
  AccountCyclicHierarchyException,
  AccountTypeNormalBalanceMismatchException,
} from '../../domain/exceptions/FinanceExceptions';

function buildSut() {
  const accountRepository = new FakeAccountRepository();
  const auditService = new FakeAuditService();
  return {
    accountRepository,
    createUseCase: new CreateAccountUseCase(accountRepository, auditService),
    listUseCase: new ListAccountsUseCase(accountRepository),
    updateUseCase: new UpdateAccountUseCase(accountRepository, auditService),
    deactivateUseCase: new DeactivateAccountUseCase(accountRepository, auditService),
  };
}

describe('Chart of Accounts lifecycle (task-143-145)', () => {
  it('creates an account with the Section 6.1 literal payload shape', async () => {
    const { createUseCase } = buildSut();
    const account = await createUseCase.execute({
      branchId: 'branch-1',
      code: '1110',
      name: 'Kas Utama',
      accountType: 'asset',
      normalBalance: 'debit',
      isPostable: true,
      actorUserId: 'manager-1',
    });

    expect(account.code).toBe('1110');
    expect(account.accountType).toBe('asset');
    expect(account.normalBalance).toBe('debit');
    expect(account.isActive).toBe(true);
  });

  it('rejects a mismatched accountType/normalBalance pair', async () => {
    const { createUseCase } = buildSut();
    await expect(
      createUseCase.execute({
        code: '2110',
        name: 'Utang Usaha',
        accountType: 'liability',
        normalBalance: 'debit',
        isPostable: true,
        actorUserId: 'manager-1',
      }),
    ).rejects.toBeInstanceOf(AccountTypeNormalBalanceMismatchException);
  });

  it('rejects a duplicate code within the same branch/template scope', async () => {
    const { createUseCase } = buildSut();
    await createUseCase.execute({
      branchId: 'branch-1',
      code: '1110',
      name: 'Kas Utama',
      accountType: 'asset',
      normalBalance: 'debit',
      isPostable: true,
      actorUserId: 'manager-1',
    });

    await expect(
      createUseCase.execute({
        branchId: 'branch-1',
        code: '1110',
        name: 'Kas Cabang',
        accountType: 'asset',
        normalBalance: 'debit',
        isPostable: true,
        actorUserId: 'manager-1',
      }),
    ).rejects.toBeInstanceOf(AccountCodeExistsException);
  });

  it('allows the same code across two different shared-template (branchId=null) creations to be rejected as duplicate, not silently allowed via NULL-distinct', async () => {
    const { createUseCase } = buildSut();
    await createUseCase.execute({
      code: '1000',
      name: 'Assets Heading',
      accountType: 'asset',
      normalBalance: 'debit',
      isPostable: false,
      actorUserId: 'manager-1',
    });

    await expect(
      createUseCase.execute({
        code: '1000',
        name: 'Duplicate Heading',
        accountType: 'asset',
        normalBalance: 'debit',
        isPostable: false,
        actorUserId: 'manager-1',
      }),
    ).rejects.toBeInstanceOf(AccountCodeExistsException);
  });

  it('lists accounts filtered by accountType', async () => {
    const { createUseCase, listUseCase } = buildSut();
    await createUseCase.execute({
      code: '1110',
      name: 'Kas',
      accountType: 'asset',
      normalBalance: 'debit',
      isPostable: true,
      actorUserId: 'manager-1',
    });
    await createUseCase.execute({
      code: '4000',
      name: 'Pendapatan',
      accountType: 'revenue',
      normalBalance: 'credit',
      isPostable: true,
      actorUserId: 'manager-1',
    });

    const { items, total } = await listUseCase.execute({ accountType: 'revenue', page: 1, limit: 20, sort: 'createdAt', order: 'desc' });
    expect(total).toBe(1);
    expect(items[0].code).toBe('4000');
  });

  it('rejects reparenting an account under its own descendant (cyclic hierarchy)', async () => {
    const { createUseCase, updateUseCase } = buildSut();
    const parent = await createUseCase.execute({
      code: '1000',
      name: 'Assets',
      accountType: 'asset',
      normalBalance: 'debit',
      isPostable: false,
      actorUserId: 'manager-1',
    });
    const child = await createUseCase.execute({
      code: '1100',
      name: 'Current Assets',
      accountType: 'asset',
      normalBalance: 'debit',
      parentId: parent.id,
      isPostable: false,
      actorUserId: 'manager-1',
    });

    await expect(
      updateUseCase.execute({ accountId: parent.id, parentId: child.id, actorUserId: 'manager-1' }),
    ).rejects.toBeInstanceOf(AccountCyclicHierarchyException);
  });

  it('deactivates an account without hard-deleting it', async () => {
    const { createUseCase, deactivateUseCase, accountRepository } = buildSut();
    const account = await createUseCase.execute({
      code: '1110',
      name: 'Kas Utama',
      accountType: 'asset',
      normalBalance: 'debit',
      isPostable: true,
      actorUserId: 'manager-1',
    });

    const deactivated = await deactivateUseCase.execute({ accountId: account.id, actorUserId: 'manager-1' });
    expect(deactivated.isActive).toBe(false);
    expect(accountRepository.accounts.has(account.id)).toBe(true);
  });
});
