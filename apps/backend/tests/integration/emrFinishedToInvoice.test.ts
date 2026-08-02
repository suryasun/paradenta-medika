import { InMemoryEventBus } from '../../src/shared/events/EventBus';
import { EMR_FINISHED_EVENT, EmrFinishedPayload } from '../../src/modules/emr/domain/events/EmrEvents';
import { CloseVisitUseCase } from '../../src/modules/emr/application/use-cases/CloseVisitUseCase';
import { GenerateInvoiceUseCase } from '../../src/modules/billing/application/use-cases/GenerateInvoiceUseCase';
import { InvoiceNumberGenerator } from '../../src/modules/billing/application/services/InvoiceNumberGenerator';
import { FakeSoapNoteRepository, FakeTreatmentRepository, FakeVisitRepository, FakeVisitTreatmentRepository } from '../fakes/emrFakes';
import { FakeInvoiceItemRepository, FakeInvoiceRepository } from '../fakes/billingFakes';
import { FakeAuditService } from '../fakes/authFakes';

describe('EMR Finished -> Generate Invoice integration (task-052 / task-054 seam)', () => {
  it('closing a Visit results in exactly one Invoice being created with matching line items', async () => {
    const eventBus = new InMemoryEventBus();
    const visitRepository = new FakeVisitRepository();
    const soapNoteRepository = new FakeSoapNoteRepository();
    const visitTreatmentRepository = new FakeVisitTreatmentRepository();
    const treatmentRepository = new FakeTreatmentRepository();
    const invoiceRepository = new FakeInvoiceRepository();
    const invoiceItemRepository = new FakeInvoiceItemRepository();
    const auditService = new FakeAuditService();

    const generateInvoiceUseCase = new GenerateInvoiceUseCase(
      visitRepository,
      visitTreatmentRepository,
      treatmentRepository,
      invoiceRepository,
      invoiceItemRepository,
      new InvoiceNumberGenerator(invoiceRepository),
      auditService,
    );
    eventBus.subscribe<EmrFinishedPayload>(EMR_FINISHED_EVENT, async (payload) => {
      await generateInvoiceUseCase.execute({ visitId: payload.visitId, actorUserId: 'system:emr-finished' });
    });

    const closeVisitUseCase = new CloseVisitUseCase(visitRepository, soapNoteRepository, visitTreatmentRepository, auditService, eventBus);

    const visit = await visitRepository.create({ visitNo: 'VIS000001', patientId: 'p1', doctorId: 'd1', branchId: 'b1', queueId: 'q1', createdBy: 'doc-1' });
    await soapNoteRepository.upsert({ visitId: visit.id, subjective: 'a', objective: 'b', assessment: 'c', plan: 'd', updatedBy: 'doc-1' });
    const treatment = await treatmentRepository.create({ treatmentCode: 'T01', treatmentName: 'Scaling', treatmentCategoryId: 'c1', defaultPrice: 200000 });
    await visitTreatmentRepository.create({ visitId: visit.id, treatmentId: treatment.id, quantity: 1, unitPrice: 200000, subtotal: 200000, createdBy: 'doc-1' });

    await closeVisitUseCase.execute({ visitId: visit.id, actorUserId: 'doc-1' });

    expect(invoiceRepository.invoices.size).toBe(1);
    const invoice = [...invoiceRepository.invoices.values()][0];
    expect(invoice.visitId).toBe(visit.id);
    expect(invoice.patientId).toBe(visit.patientId);
    expect(Number(invoice.grandTotal)).toBe(200000);
    expect(invoice.status).toBe('UNPAID');

    const items = await invoiceItemRepository.findByInvoiceId(invoice.id);
    expect(items).toHaveLength(1);
    expect(items[0].itemName).toBe('Scaling');
    expect(Number(items[0].total)).toBe(200000);
  });
});
