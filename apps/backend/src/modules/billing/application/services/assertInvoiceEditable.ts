import { Invoice } from '@prisma/client';
import { InvoiceNotEditableException } from '../../domain/exceptions/BillingExceptions';

const EDITABLE_STATUSES = ['UNPAID', 'PARTIALLY_PAID'];

/**
 * docs/06-tasks/task-322.md/task-323.md: shared guard for Discount and
 * Manual Charge, both of which may only modify an Invoice that's still
 * UNPAID/PARTIALLY_PAID -- mirrors EMR's assertTreatmentEditable gate
 * (task-317), same rationale (a Invoice already PAID/CLOSED/CANCELLED/VOID
 * must go through Void/Refund instead, not have its line items mutated).
 */
export function assertInvoiceEditable(invoice: Invoice): void {
  if (!EDITABLE_STATUSES.includes(invoice.status)) {
    throw new InvoiceNotEditableException();
  }
}
