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

export class PaymentNotFoundException extends NotFoundException {
  constructor() {
    super('Payment not found');
  }
}

// docs/06-tasks/task-322.md/task-323.md: Discount and Manual Charge both
// require the Invoice still be UNPAID/PARTIALLY_PAID -- shared guard,
// mirrors assertTreatmentEditable's "not once PAID" gate in EMR.
export class InvoiceNotEditableException extends BusinessException {
  constructor() {
    super('INVOICE_NOT_EDITABLE', 'Invoice can only be modified while UNPAID or PARTIALLY_PAID');
  }
}

// docs/06-tasks/task-322.md: discount cannot exceed the pre-discount subtotal.
export class DiscountExceedsSubtotalException extends BusinessException {
  constructor() {
    super('DISCOUNT_EXCEEDS_SUBTOTAL', 'Discount amount cannot exceed the Invoice subtotal');
  }
}

// docs/06-tasks/task-324.md: UC-BIL-014 "Only if no payment yet."
export class InvoiceHasPaymentException extends BusinessException {
  constructor() {
    super('INVOICE_HAS_PAYMENT', 'Invoice cannot be cancelled once a payment has been recorded -- use Void instead');
  }
}

export class InvoiceAlreadyCancelledException extends BusinessException {
  constructor() {
    super('INVOICE_ALREADY_CANCELLED', 'Invoice has already been cancelled');
  }
}

export class InvoiceAlreadyVoidException extends BusinessException {
  constructor() {
    super('INVOICE_ALREADY_VOID', 'Invoice has already been voided');
  }
}

// docs/06-tasks/task-325.md: not reachable from a terminal (CANCELLED/VOID) or CLOSED Invoice.
export class InvoiceNotVoidableException extends BusinessException {
  constructor() {
    super('INVOICE_NOT_VOIDABLE', 'Invoice cannot be voided from its current status');
  }
}

// docs/06-tasks/task-326.md: sum(existing refunds) + newAmount must not exceed the original Payment amount.
export class RefundExceedsPaymentException extends BusinessException {
  constructor() {
    super('REFUND_EXCEEDS_PAYMENT', 'Refund amount exceeds the remaining refundable balance for this Payment');
  }
}

// docs/06-tasks/task-332.md, docs/adr/ADR-001-insurance-coverage-model.md: a
// payment line with payerType='INSURANCE' must reference an existing, active InsuranceProvider.
export class InsuranceProviderNotActiveException extends BusinessException {
  constructor() {
    super('INSURANCE_PROVIDER_NOT_ACTIVE', 'Insurance Provider not found or not active');
  }
}
