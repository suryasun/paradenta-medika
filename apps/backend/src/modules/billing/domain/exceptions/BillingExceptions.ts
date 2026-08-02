import { BusinessException, ConflictException, NotFoundException } from '../../../../shared/http/exceptions';

export class InvoiceNotFoundException extends NotFoundException {
  constructor() {
    super('Invoice not found');
  }
}

// docs/03-sad/16-module-billing.md Section 11 "Domain Validation Rules":
// "Invoice hanya dapat dibuat apabila: Visit telah selesai."
export class VisitNotCompletedException extends BusinessException {
  constructor() {
    super('VISIT_NOT_COMPLETED', 'An Invoice can only be generated from a completed Visit');
  }
}

// task-054.md Acceptance Criteria: "Invoice cannot be generated twice for the same Visit."
export class InvoiceAlreadyExistsForVisitException extends ConflictException {
  constructor() {
    super('An Invoice has already been generated for this Visit', 'INVOICE_ALREADY_EXISTS');
  }
}

// CloseVisitUseCase (task-052) already enforces >=1 Treatment entry before a
// Visit can be completed; this is a defensive re-check, not a reachable path
// in the normal EMRFinished flow.
export class NoBillableTreatmentException extends BusinessException {
  constructor() {
    super('NO_BILLABLE_TREATMENT', 'Visit has no recorded Treatment entries to bill');
  }
}

// docs/03-sad/16-module-billing.md Section 10: "Invoice tidak boleh diedit
// setelah Paid." / task-058.md: "Invoice Closed tidak dapat dimodifikasi."
export class InvoiceAlreadyClosedException extends BusinessException {
  constructor() {
    super('INVOICE_ALREADY_CLOSED', 'A Closed invoice cannot be modified');
  }
}

// task-058.md Acceptance Criteria: "Only a fully-paid invoice can be closed."
export class InvoiceNotFullyPaidException extends BusinessException {
  constructor() {
    super('INVOICE_NOT_FULLY_PAID', 'Only a fully-paid Invoice can be closed');
  }
}

// docs/03-sad/16-module-billing.md Section 10: "Tidak boleh melebihi Outstanding."
export class PaymentExceedsOutstandingException extends BusinessException {
  constructor() {
    super('PAYMENT_EXCEEDS_OUTSTANDING', 'Payment amount exceeds the Invoice outstanding balance');
  }
}

// docs/03-sad/16-module-billing.md Section 11: "Payment Method aktif."
export class PaymentMethodNotActiveException extends BusinessException {
  constructor() {
    super('PAYMENT_METHOD_NOT_ACTIVE', 'Payment Method is not active');
  }
}
