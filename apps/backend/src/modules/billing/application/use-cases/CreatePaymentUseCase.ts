import { IEventBus } from '../../../../shared/events/EventBus';
import { ValidationException } from '../../../../shared/http/exceptions';
import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import { IPaymentMethodRepository } from '../../../master-data/domain/repositories/IPaymentMethodRepository';
import { IInsuranceProviderRepository } from '../../../master-data/domain/repositories/IInsuranceProviderRepository';
import { PAYMENT_COMPLETED_EVENT, PaymentCompletedPayload } from '../../domain/events/BillingEvents';
import {
  InsuranceProviderNotActiveException,
  InvoiceAlreadyClosedException,
  InvoiceNotFoundException,
  PaymentExceedsOutstandingException,
  PaymentMethodNotActiveException,
} from '../../domain/exceptions/BillingExceptions';
import { IInvoiceRepository } from '../../domain/repositories/IInvoiceRepository';
import { IPaymentRepository } from '../../domain/repositories/IPaymentRepository';
import { PaymentLineDto } from '../dtos/CreatePaymentRequestDto';
import { InvoiceSummaryResponseDto } from '../dtos/InvoiceResponseDto';
import { toInvoiceSummaryResponse } from '../mappers/InvoiceMapper';

export interface CreatePaymentInput {
  invoiceId: string;
  payments: PaymentLineDto[];
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

/**
 * task-057.md: full or partial payment against an Invoice, "Mendukung
 * Multiple Payment" (docs/03-sad/16-module-billing.md Section 10) via the
 * `payments` array. Business rules enforced (Section 10/11): amount > 0,
 * total must not exceed Outstanding, Payment Method must be active, and the
 * Invoice must not already be Closed.
 */
export class CreatePaymentUseCase {
  constructor(
    private readonly invoiceRepository: IInvoiceRepository,
    private readonly paymentRepository: IPaymentRepository,
    private readonly paymentMethodRepository: IPaymentMethodRepository,
    private readonly auditService: IAuditService,
    private readonly eventBus: IEventBus,
    private readonly insuranceProviderRepository: IInsuranceProviderRepository,
  ) {}

  async execute(input: CreatePaymentInput): Promise<InvoiceSummaryResponseDto> {
    const invoice = await this.invoiceRepository.findById(input.invoiceId);
    if (!invoice) {
      throw new InvoiceNotFoundException();
    }
    if (invoice.status === 'CLOSED') {
      throw new InvoiceAlreadyClosedException();
    }

    const errors: Array<{ field?: string; message: string }> = [];
    input.payments.forEach((line, index) => {
      if (!(Number(line.amount) > 0)) {
        errors.push({ field: `payments[${index}].amount`, message: 'amount must be greater than zero' });
      }
      if (!line.paymentMethodId) {
        errors.push({ field: `payments[${index}].paymentMethodId`, message: 'paymentMethodId is required' });
      }
      if (line.payerType && line.payerType !== 'PATIENT' && line.payerType !== 'INSURANCE') {
        errors.push({ field: `payments[${index}].payerType`, message: 'payerType must be PATIENT or INSURANCE' });
      }
      if (line.payerType === 'INSURANCE' && !line.insuranceProviderId) {
        errors.push({ field: `payments[${index}].insuranceProviderId`, message: 'insuranceProviderId is required when payerType is INSURANCE' });
      }
    });
    if (errors.length > 0) {
      throw new ValidationException(errors);
    }

    const totalPaymentAmount = input.payments.reduce((sum, line) => sum + Number(line.amount), 0);
    const outstanding = Number(invoice.grandTotal) - Number(invoice.paidAmount);
    if (totalPaymentAmount > outstanding) {
      throw new PaymentExceedsOutstandingException();
    }

    for (const line of input.payments) {
      const paymentMethod = await this.paymentMethodRepository.findById(line.paymentMethodId);
      if (!paymentMethod || !paymentMethod.isActive) {
        throw new PaymentMethodNotActiveException();
      }
      // docs/06-tasks/task-332.md, docs/adr/ADR-001-insurance-coverage-model.md:
      // UC-BIL-006 Apply Insurance -- payerType='INSURANCE' must reference an
      // existing, active InsuranceProvider. Coverage amount is Cashier-entered
      // (this payment line's `amount`), not system-computed.
      if (line.payerType === 'INSURANCE') {
        const provider = await this.insuranceProviderRepository.findById(line.insuranceProviderId!);
        if (!provider || !provider.isActive) {
          throw new InsuranceProviderNotActiveException();
        }
      }
    }

    const createdPaymentIds: string[] = [];
    for (const line of input.payments) {
      const payment = await this.paymentRepository.create({
        invoiceId: invoice.id,
        paymentMethodId: line.paymentMethodId,
        amount: Number(line.amount),
        referenceNo: line.referenceNo,
        receivedBy: input.actorUserId,
        note: line.note,
        createdBy: input.actorUserId,
        payerType: line.payerType ?? 'PATIENT',
        insuranceProviderId: line.payerType === 'INSURANCE' ? line.insuranceProviderId : undefined,
        policyNumber: line.payerType === 'INSURANCE' ? line.policyNumber : undefined,
      });
      createdPaymentIds.push(payment.id);
    }

    const newPaidAmount = Number(invoice.paidAmount) + totalPaymentAmount;
    const newStatus = newPaidAmount >= Number(invoice.grandTotal) ? 'PAID' : 'PARTIALLY_PAID';
    const updated = await this.invoiceRepository.updatePayment(invoice.id, {
      paidAmount: newPaidAmount,
      status: newStatus,
      updatedBy: input.actorUserId,
    });

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record(
      'Invoice',
      invoice.id,
      'UPDATE',
      { paidAmount: Number(invoice.paidAmount), status: invoice.status },
      { paidAmount: newPaidAmount, status: newStatus },
      auditContext,
    );

    const eventPayload: PaymentCompletedPayload = {
      event: PAYMENT_COMPLETED_EVENT,
      invoiceId: updated.id,
      invoiceNo: updated.invoiceNo,
      paymentAmount: totalPaymentAmount,
      invoiceStatus: newStatus,
      paymentIds: createdPaymentIds,
      occurredAt: new Date().toISOString(),
    };
    await this.eventBus.publish(PAYMENT_COMPLETED_EVENT, eventPayload);

    return toInvoiceSummaryResponse(updated);
  }
}
