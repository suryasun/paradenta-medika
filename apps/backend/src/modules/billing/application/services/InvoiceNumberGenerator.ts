import { IInvoiceRepository } from '../../domain/repositories/IInvoiceRepository';

const MAX_ATTEMPTS = 5;

/**
 * docs/03-sad/16-module-billing.md Section 7 example response:
 * "INV-20260731-000001" -- INV-YYYYMMDD-NNNNNN, mirroring the same
 * date-scoped sequential-counter pattern already used for Reservation
 * numbers (RSV-YYYYMMDD-NNNN).
 */
export class InvoiceNumberGenerator {
  constructor(private readonly invoiceRepository: IInvoiceRepository) {}

  async generate(date: Date = new Date()): Promise<string> {
    const datePart = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    const prefix = `INV-${datePart}-`;
    const baseCount = await this.invoiceRepository.countByInvoiceNoPrefix(prefix);

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
      const candidate = `${prefix}${String(baseCount + 1 + attempt).padStart(6, '0')}`;
      const existing = await this.invoiceRepository.findByInvoiceNo(candidate);
      if (!existing) {
        return candidate;
      }
    }

    throw new Error('Unable to generate a unique Invoice Number');
  }
}
