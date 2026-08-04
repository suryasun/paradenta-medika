import { IReservationRepository } from '../../../reservation/domain/repositories/IReservationRepository';
import { IQueueRepository } from '../../../queue/domain/repositories/IQueueRepository';
import { IInvoiceRepository } from '../../../billing/domain/repositories/IInvoiceRepository';
import { IPurchaseOrderRepository } from '../../../warehouse/domain/repositories/IPurchaseOrderRepository';
import { IGoodsReceiptRepository } from '../../../warehouse/domain/repositories/IGoodsReceiptRepository';
import { IJournalRepository } from '../../../finance/domain/repositories/IJournalRepository';

export interface OpenTransactionCheckResult {
  hasOpenTransactions: boolean;
  blockedByModules: string[];
}

/**
 * docs/06-tasks/task-225.md: reads Reservation/Queue/Billing/Warehouse/
 * Finance's own repository interfaces (a sanctioned cross-module channel
 * per docs/04-ai-contract/07-module-contract.md MOD-003 -- no direct
 * cross-schema join) to decide whether a branch has any open transaction
 * that would make deactivating it an operational-integrity violation.
 */
export class CheckBranchHasOpenTransactionsUseCase {
  constructor(
    private readonly reservationRepository: IReservationRepository,
    private readonly queueRepository: IQueueRepository,
    private readonly invoiceRepository: IInvoiceRepository,
    private readonly purchaseOrderRepository: IPurchaseOrderRepository,
    private readonly goodsReceiptRepository: IGoodsReceiptRepository,
    private readonly journalRepository: IJournalRepository,
  ) {}

  async execute(branchId: string): Promise<OpenTransactionCheckResult> {
    const blockedByModules: string[] = [];

    if ((await this.reservationRepository.countOpenByBranch(branchId)) > 0) {
      blockedByModules.push('Reservation');
    }
    if ((await this.queueRepository.countOpenByBranch(branchId)) > 0) {
      blockedByModules.push('Queue');
    }
    if ((await this.invoiceRepository.sumOutstandingByBranch(branchId)) > 0) {
      blockedByModules.push('Billing');
    }
    if ((await this.purchaseOrderRepository.countOpenByBranch(branchId)) > 0) {
      blockedByModules.push('Warehouse (Purchase Order)');
    }
    if ((await this.goodsReceiptRepository.countOpenByBranch(branchId)) > 0) {
      blockedByModules.push('Warehouse (Goods Receipt)');
    }
    if ((await this.journalRepository.countOpenByBranch(branchId)) > 0) {
      blockedByModules.push('Finance');
    }

    return { hasOpenTransactions: blockedByModules.length > 0, blockedByModules };
  }
}
