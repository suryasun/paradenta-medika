import { PagedResult } from '../../../../shared/http/pagination';
import { InvoiceSummaryResponseDto } from '../dtos/InvoiceResponseDto';
import { toInvoiceSummaryResponse } from '../mappers/InvoiceMapper';
import { IInvoiceRepository, ListInvoiceFilter } from '../../domain/repositories/IInvoiceRepository';

export class ListInvoicesUseCase {
  constructor(private readonly invoiceRepository: IInvoiceRepository) {}

  async execute(query: ListInvoiceFilter): Promise<PagedResult<InvoiceSummaryResponseDto>> {
    const { items, total } = await this.invoiceRepository.list(query);
    return { items: items.map(toInvoiceSummaryResponse), total };
  }
}
