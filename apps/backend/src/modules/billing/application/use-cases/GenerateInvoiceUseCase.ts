import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import { IVisitRepository } from '../../../emr/domain/repositories/IVisitRepository';
import { IVisitTreatmentRepository } from '../../../emr/domain/repositories/IVisitTreatmentRepository';
import { ITreatmentRepository } from '../../../master-data/domain/repositories/ITreatmentRepository';
import {
  InvoiceAlreadyExistsForVisitException,
  NoBillableTreatmentException,
  VisitNotCompletedException,
} from '../../domain/exceptions/BillingExceptions';
import { IInvoiceItemRepository } from '../../domain/repositories/IInvoiceItemRepository';
import { IInvoiceRepository } from '../../domain/repositories/IInvoiceRepository';
import { InvoiceNumberGenerator } from '../services/InvoiceNumberGenerator';
import { GenerateInvoiceResponseDto } from '../dtos/InvoiceResponseDto';
import { VisitNotFoundException } from '../../../emr/domain/exceptions/EmrExceptions';

export interface GenerateInvoiceInput {
  visitId: string;
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

/**
 * task-054.md: triggered by the EMRFinished event published by
 * CloseVisitUseCase (task-052); reads all visit_treatments for the Visit
 * and produces one Invoice with one line item per treatment, using the
 * price snapshot already captured in VisitTreatment (task-053). Also
 * reachable via POST /billing/invoices for the manual-trigger path the SAD
 * documents at the same endpoint -- idempotency (one Invoice per Visit) is
 * enforced identically for both callers.
 */
export class GenerateInvoiceUseCase {
  constructor(
    private readonly visitRepository: IVisitRepository,
    private readonly visitTreatmentRepository: IVisitTreatmentRepository,
    private readonly treatmentRepository: ITreatmentRepository,
    private readonly invoiceRepository: IInvoiceRepository,
    private readonly invoiceItemRepository: IInvoiceItemRepository,
    private readonly invoiceNumberGenerator: InvoiceNumberGenerator,
    private readonly auditService: IAuditService,
  ) {}

  async execute(input: GenerateInvoiceInput): Promise<GenerateInvoiceResponseDto> {
    const visit = await this.visitRepository.findById(input.visitId);
    if (!visit) {
      throw new VisitNotFoundException();
    }
    if (visit.status !== 'COMPLETED') {
      throw new VisitNotCompletedException();
    }

    const existing = await this.invoiceRepository.findByVisitId(input.visitId);
    if (existing) {
      throw new InvoiceAlreadyExistsForVisitException();
    }

    const treatmentEntries = await this.visitTreatmentRepository.findByVisitId(input.visitId);
    if (treatmentEntries.length === 0) {
      throw new NoBillableTreatmentException();
    }

    const subtotal = treatmentEntries.reduce((sum, entry) => sum + Number(entry.subtotal), 0);
    const invoiceNo = await this.invoiceNumberGenerator.generate();

    const invoice = await this.invoiceRepository.create({
      invoiceNo,
      visitId: visit.id,
      patientId: visit.patientId,
      branchId: visit.branchId,
      subtotal,
      discount: 0,
      tax: 0,
      grandTotal: subtotal,
      createdBy: input.actorUserId,
    });

    const treatments = await Promise.all(treatmentEntries.map((entry) => this.treatmentRepository.findById(entry.treatmentId)));

    await this.invoiceItemRepository.createMany(
      treatmentEntries.map((entry, index) => ({
        invoiceId: invoice.id,
        referenceType: 'Treatment',
        referenceId: entry.treatmentId,
        // docs/06-tasks/task-321.md: precise correlation, so a later Edit/Remove
        // of this specific entry can find and sync the matching InvoiceItem.
        visitTreatmentId: entry.id,
        itemName: treatments[index]?.treatmentName ?? 'Treatment',
        quantity: Number(entry.quantity),
        unitPrice: Number(entry.unitPrice),
        discount: 0,
        tax: 0,
        total: Number(entry.subtotal),
      })),
    );

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record(
      'Invoice',
      invoice.id,
      'CREATE',
      null,
      { invoiceNo: invoice.invoiceNo, visitId: invoice.visitId, grandTotal: subtotal },
      auditContext,
    );

    return { invoiceId: invoice.id, invoiceNumber: invoice.invoiceNo };
  }
}
