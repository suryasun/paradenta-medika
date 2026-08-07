import { UpdateTreatmentUseCase } from './UpdateTreatmentUseCase';
import { FakeTreatmentRepository, FakeVisitRepository, FakeVisitTreatmentRepository } from '../../../../../tests/fakes/emrFakes';
import { FakeInvoiceRepository } from '../../../../../tests/fakes/billingFakes';
import { FakeAuditService } from '../../../../../tests/fakes/authFakes';
import { FakeEventBus } from '../../../../../tests/fakes/patientFakes';
import { TreatmentLockedException, VisitTreatmentNotFoundException } from '../../domain/exceptions/EmrExceptions';
import { TREATMENT_UPDATED_EVENT } from '../../domain/events/EmrEvents';

async function seedVisit(repo: FakeVisitRepository) {
  return repo.create({ visitNo: 'VIS000001', patientId: 'p1', doctorId: 'd1', branchId: 'b1', queueId: 'q1', createdBy: 'doc-1' });
}

function buildSut() {
  const visitRepository = new FakeVisitRepository();
  const visitTreatmentRepository = new FakeVisitTreatmentRepository();
  const treatmentRepository = new FakeTreatmentRepository();
  const invoiceRepository = new FakeInvoiceRepository();
  const auditService = new FakeAuditService();
  const eventBus = new FakeEventBus();
  const useCase = new UpdateTreatmentUseCase(visitRepository, visitTreatmentRepository, treatmentRepository, invoiceRepository, auditService, eventBus);
  return { visitRepository, visitTreatmentRepository, treatmentRepository, invoiceRepository, eventBus, useCase };
}

// docs/06-tasks/task-321.md
describe('UpdateTreatmentUseCase', () => {
  it('updates quantity/unitPrice/toothReference/notes and recomputes subtotal', async () => {
    const { visitRepository, visitTreatmentRepository, treatmentRepository, useCase } = buildSut();
    const visit = await seedVisit(visitRepository);
    const treatment = await treatmentRepository.create({ treatmentCode: 'T01', treatmentName: 'Scaling', treatmentCategoryId: 'c1', defaultPrice: 100000 });
    const entry = await visitTreatmentRepository.create({ visitId: visit.id, treatmentId: treatment.id, quantity: 1, unitPrice: 100000, subtotal: 100000, createdBy: 'doc-1' });

    const result = await useCase.execute({
      visitId: visit.id,
      visitTreatmentId: entry.id,
      quantity: 3,
      unitPrice: 120000,
      toothReference: '16',
      notes: 'adjusted',
      actorUserId: 'doc-1',
    });

    expect(result.quantity).toBe(3);
    expect(result.unitPrice).toBe(120000);
    expect(result.subtotal).toBe(360000);
    expect(result.toothReference).toBe('16');
    expect(result.notes).toBe('adjusted');
  });

  it('keeps unspecified fields unchanged (only recomputes subtotal from what changed)', async () => {
    const { visitRepository, visitTreatmentRepository, treatmentRepository, useCase } = buildSut();
    const visit = await seedVisit(visitRepository);
    const treatment = await treatmentRepository.create({ treatmentCode: 'T02', treatmentName: 'Filling', treatmentCategoryId: 'c1', defaultPrice: 100000 });
    const entry = await visitTreatmentRepository.create({ visitId: visit.id, treatmentId: treatment.id, toothReference: '11', quantity: 2, unitPrice: 100000, subtotal: 200000, createdBy: 'doc-1' });

    const result = await useCase.execute({ visitId: visit.id, visitTreatmentId: entry.id, quantity: 4, actorUserId: 'doc-1' });

    expect(result.quantity).toBe(4);
    expect(result.unitPrice).toBe(100000);
    expect(result.subtotal).toBe(400000);
    expect(result.toothReference).toBe('11');
  });

  it('publishes emr.treatment-updated.v1 after a successful update', async () => {
    const { visitRepository, visitTreatmentRepository, treatmentRepository, eventBus, useCase } = buildSut();
    const visit = await seedVisit(visitRepository);
    const treatment = await treatmentRepository.create({ treatmentCode: 'T03', treatmentName: 'Cleaning', treatmentCategoryId: 'c1', defaultPrice: 50000 });
    const entry = await visitTreatmentRepository.create({ visitId: visit.id, treatmentId: treatment.id, quantity: 1, unitPrice: 50000, subtotal: 50000, createdBy: 'doc-1' });

    await useCase.execute({ visitId: visit.id, visitTreatmentId: entry.id, quantity: 2, actorUserId: 'doc-1' });

    const published = eventBus.published.find((p) => p.eventName === TREATMENT_UPDATED_EVENT);
    expect(published).toBeDefined();
    expect(published?.payload).toMatchObject({ visitId: visit.id, visitTreatmentId: entry.id, quantity: 2, subtotal: 100000 });
  });

  it('rejects updating an entry that does not belong to the given visit', async () => {
    const { visitRepository, visitTreatmentRepository, treatmentRepository, useCase } = buildSut();
    const visit = await seedVisit(visitRepository);
    const otherVisit = await seedVisit(visitRepository);
    const treatment = await treatmentRepository.create({ treatmentCode: 'T04', treatmentName: 'X-Ray', treatmentCategoryId: 'c1', defaultPrice: 50000 });
    const entry = await visitTreatmentRepository.create({ visitId: otherVisit.id, treatmentId: treatment.id, quantity: 1, unitPrice: 50000, subtotal: 50000, createdBy: 'doc-1' });

    await expect(
      useCase.execute({ visitId: visit.id, visitTreatmentId: entry.id, quantity: 2, actorUserId: 'doc-1' }),
    ).rejects.toBeInstanceOf(VisitTreatmentNotFoundException);
  });

  it('rejects updating once the linked invoice is PAID', async () => {
    const { visitRepository, visitTreatmentRepository, treatmentRepository, invoiceRepository, useCase } = buildSut();
    const visit = await seedVisit(visitRepository);
    const treatment = await treatmentRepository.create({ treatmentCode: 'T05', treatmentName: 'Extraction', treatmentCategoryId: 'c1', defaultPrice: 200000 });
    const entry = await visitTreatmentRepository.create({ visitId: visit.id, treatmentId: treatment.id, quantity: 1, unitPrice: 200000, subtotal: 200000, createdBy: 'doc-1' });
    const invoice = await invoiceRepository.create({
      invoiceNo: 'INV1', visitId: visit.id, patientId: 'p1', branchId: 'b1',
      subtotal: 200000, discount: 0, tax: 0, grandTotal: 200000, createdBy: 'admin',
    });
    invoiceRepository.invoices.get(invoice.id)!.status = 'PAID';

    await expect(
      useCase.execute({ visitId: visit.id, visitTreatmentId: entry.id, quantity: 2, actorUserId: 'doc-1' }),
    ).rejects.toBeInstanceOf(TreatmentLockedException);
  });
});
