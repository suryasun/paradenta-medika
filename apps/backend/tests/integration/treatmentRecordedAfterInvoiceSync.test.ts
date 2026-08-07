import { InMemoryEventBus } from '../../src/shared/events/EventBus';
import { EMR_FINISHED_EVENT, EmrFinishedPayload, TREATMENT_RECORDED_EVENT, TreatmentRecordedPayload } from '../../src/modules/emr/domain/events/EmrEvents';
import { CloseVisitUseCase } from '../../src/modules/emr/application/use-cases/CloseVisitUseCase';
import { RecordTreatmentUseCase } from '../../src/modules/emr/application/use-cases/RecordTreatmentUseCase';
import { GenerateInvoiceUseCase } from '../../src/modules/billing/application/use-cases/GenerateInvoiceUseCase';
import { SyncTreatmentToInvoiceUseCase } from '../../src/modules/billing/application/use-cases/SyncTreatmentToInvoiceUseCase';
import { InvoiceNumberGenerator } from '../../src/modules/billing/application/services/InvoiceNumberGenerator';
import { FakeSoapNoteRepository, FakeTreatmentRepository, FakeVisitRepository, FakeVisitTreatmentRepository } from '../fakes/emrFakes';
import { FakeWarehouseLocationRepository, FakeItemRepository } from '../fakes/warehouseFakes';
import { FakeInvoiceItemRepository, FakeInvoiceRepository } from '../fakes/billingFakes';
import { FakeAuditService } from '../fakes/authFakes';

// docs/06-tasks/task-320.md: reproduces the exact reported bug -- a
// Treatment recorded on a Visit AFTER its Invoice was already generated
// (e.g. via Queue's "View Visit" link, task-319, once task-316/task-317
// left the Treatment section editable on a COMPLETED-but-unpaid Visit) must
// still show up on the Invoice, not be silently excluded.
describe('Treatment recorded after Invoice generation stays in sync (task-320 fix)', () => {
  it('a Treatment recorded post-Close-Visit is added to the already-generated Invoice', async () => {
    const eventBus = new InMemoryEventBus();
    const visitRepository = new FakeVisitRepository();
    const soapNoteRepository = new FakeSoapNoteRepository();
    const visitTreatmentRepository = new FakeVisitTreatmentRepository();
    const treatmentRepository = new FakeTreatmentRepository();
    const itemRepository = new FakeItemRepository();
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

    const syncTreatmentToInvoiceUseCase = new SyncTreatmentToInvoiceUseCase(invoiceRepository, invoiceItemRepository, auditService);
    eventBus.subscribe<TreatmentRecordedPayload>(TREATMENT_RECORDED_EVENT, async (payload) => {
      await syncTreatmentToInvoiceUseCase.execute({
        visitId: payload.visitId,
        visitTreatmentId: payload.visitTreatmentId,
        treatmentId: payload.treatmentId,
        treatmentName: payload.treatmentName,
        quantity: payload.quantity,
        unitPrice: payload.unitPrice,
        subtotal: payload.subtotal,
      });
    });

    const warehouseLocationRepository = new FakeWarehouseLocationRepository();
    const closeVisitUseCase = new CloseVisitUseCase(
      visitRepository,
      soapNoteRepository,
      visitTreatmentRepository,
      warehouseLocationRepository,
      auditService,
      eventBus,
    );
    const recordTreatmentUseCase = new RecordTreatmentUseCase(
      visitRepository,
      visitTreatmentRepository,
      treatmentRepository,
      itemRepository,
      invoiceRepository,
      auditService,
      eventBus,
    );

    const visit = await visitRepository.create({ visitNo: 'VIS000001', patientId: 'p1', doctorId: 'd1', branchId: 'b1', queueId: 'q1', createdBy: 'doc-1' });
    await soapNoteRepository.upsert({ visitId: visit.id, subjective: 'a', objective: 'b', assessment: 'c', plan: 'd', updatedBy: 'doc-1' });
    const scaling = await treatmentRepository.create({ treatmentCode: 'T01', treatmentName: 'Scaling', treatmentCategoryId: 'c1', defaultPrice: 200000 });
    await recordTreatmentUseCase.execute({ visitId: visit.id, treatmentId: scaling.id, actorUserId: 'doc-1' });

    // Close Visit -> Invoice auto-generated with just the Scaling entry.
    await closeVisitUseCase.execute({ visitId: visit.id, actorUserId: 'doc-1' });
    const invoice = [...invoiceRepository.invoices.values()][0];
    expect(Number(invoice.grandTotal)).toBe(200000);
    expect(await invoiceItemRepository.findByInvoiceId(invoice.id)).toHaveLength(1);

    // Reproduces the bug: a new Treatment recorded AFTER Close Visit (as
    // task-316/task-317 now allow, while the Invoice is still UNPAID) must
    // land on the existing Invoice, not be silently dropped.
    const filling = await treatmentRepository.create({ treatmentCode: 'T02', treatmentName: 'Filling', treatmentCategoryId: 'c1', defaultPrice: 150000 });
    await recordTreatmentUseCase.execute({ visitId: visit.id, treatmentId: filling.id, actorUserId: 'doc-1' });

    const items = await invoiceItemRepository.findByInvoiceId(invoice.id);
    expect(items).toHaveLength(2);
    expect(items.map((i) => i.itemName).sort()).toEqual(['Filling', 'Scaling']);

    const updatedInvoice = invoiceRepository.invoices.get(invoice.id)!;
    expect(Number(updatedInvoice.grandTotal)).toBe(350000);
    expect(Number(updatedInvoice.subtotal)).toBe(350000);
  });
});
