import { InvoiceNotFoundException } from '../../domain/exceptions/BillingExceptions';
import { IInvoiceItemRepository } from '../../domain/repositories/IInvoiceItemRepository';
import { IInvoiceRepository } from '../../domain/repositories/IInvoiceRepository';
import { IPaymentRepository } from '../../domain/repositories/IPaymentRepository';
import { InvoiceDetailResponseDto } from '../dtos/InvoiceResponseDto';
import { toInvoiceDetailResponse } from '../mappers/InvoiceMapper';

export class GetInvoiceDetailUseCase {
  constructor(
    private readonly invoiceRepository: IInvoiceRepository,
    private readonly invoiceItemRepository: IInvoiceItemRepository,
    private readonly paymentRepository: IPaymentRepository,
  ) {}

  async execute(invoiceId: string): Promise<InvoiceDetailResponseDto> {
    const invoice = await this.invoiceRepository.findById(invoiceId);
    if (!invoice) {
      throw new InvoiceNotFoundException();
    }

    const [items, payments] = await Promise.all([
      this.invoiceItemRepository.findByInvoiceId(invoiceId),
      this.paymentRepository.findByInvoiceId(invoiceId),
    ]);

    return toInvoiceDetailResponse(invoice, items, payments);
  }
}
