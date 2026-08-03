import { ListQueryDto } from '../../../../shared/http/ListQueryDto';
import { PagedResult } from '../../../../shared/http/pagination';
import { CashAccountNotFoundException } from '../../domain/exceptions/FinanceExceptions';
import { ICashAccountRepository } from '../../domain/repositories/ICashAccountRepository';
import { IJournalRepository } from '../../domain/repositories/IJournalRepository';
import { CashAccountMovementResponseDto } from '../dtos/CashAccountMovementResponseDto';
import { toCashAccountMovementResponseDto } from '../mappers/CashAccountMapper';

/** docs/06-tasks/task-154.md AC: "Only posted journal lines are included (draft/void excluded)." */
export class GetCashAccountMovementsUseCase {
  constructor(
    private readonly cashAccountRepository: ICashAccountRepository,
    private readonly journalRepository: IJournalRepository,
  ) {}

  async execute(cashAccountId: string, query: ListQueryDto): Promise<PagedResult<CashAccountMovementResponseDto>> {
    const cashAccount = await this.cashAccountRepository.findById(cashAccountId);
    if (!cashAccount) {
      throw new CashAccountNotFoundException();
    }

    const { items, total } = await this.journalRepository.listPostedLinesByAccount(cashAccount.ledgerAccountId, query);
    return { items: items.map(toCashAccountMovementResponseDto), total };
  }
}
