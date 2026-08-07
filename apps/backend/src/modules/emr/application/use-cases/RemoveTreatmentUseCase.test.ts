import { RemoveTreatmentUseCase } from './RemoveTreatmentUseCase';
import { FakeTreatmentRepository, FakeVisitRepository, FakeVisitTreatmentRepository } from '../../../../../tests/fakes/emrFakes';
import { FakeInvoiceRepository } from '../../../../../tests/fakes/billingFakes';
import { FakeAuditService } from '../../../../../tests/fakes/authFakes';
import { FakeEventBus } from '../../../../../tests/fakes/patientFakes';
import { TreatmentLockedException, VisitTreatmentNotFoundException } from '../../domain/exceptions/EmrExceptions';
import { TREATMENT_REMOVED_EVENT } from '../../domain/events/EmrEvents';

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
  const useCase = new RemoveTreatmentUseCase(visitRepository, visitTreatmentRepository, invoiceRepository, auditService, eventBus);
  return { visitRepository, visitTreatmentRepository, treatmentRepository, invoiceRepository, eventBus, useCase };
}

// docs/06-tasks/task-321.md
describe('RemoveTreatmentUseCase', () => {
  it('soft-deletes the entry (does not physically delete it)', async () => {
    const { visitRepository, visitTreatmentRepository, treatmentRepository, useCase } = buildSut();
    const visit = await seedVisit(visitRepository);
    const treatment = await treatmentRepository.create({ treatmentCode: 'T01', treatmentName: 'Scaling', treatmentCategoryId: 'c1', defaultPrice: 100000 });
    const entry = await visitTreatmentRepository.create({ visitId: visit.id, treatmentId: treatment.id, quantity: 1, unitPrice: 100000, subtotal: 100000, createdBy: 'doc-1' });

    await useCase.execute({ visitId: visit.id, visitTreatmentId: entry.id, actorUserId: 'doc-1' });

    expect(await visitTreatmentRepository.findById(entry.id)).toBeNull();
    expect(visitTreatmentRepository.entries.get(entry.id)).toBeDefined();
    expect(visitTreatmentRepository.entries.get(entry.id)!.deletedAt).not.toBeNull();
  });

  it('excludes a removed entry from findByVisitId', async () => {
    const { visitRepository, visitTreatmentRepository, treatmentRepository, useCase } = buildSut();
    const visit = await seedVisit(visitRepository);
    const treatment = await treatmentRepository.create({ treatmentCode: 'T02', treatmentName: 'Filling', treatmentCategoryId: 'c1', defaultPrice: 100000 });
    const entry = await visitTreatmentRepository.create({ visitId: visit.id, treatmentId: treatment.id, quantity: 1, unitPrice: 100000, subtotal: 100000, createdBy: 'doc-1' });

    await useCase.execute({ visitId: visit.id, visitTreatmentId: entry.id, actorUserId: 'doc-1' });

    expect(await visitTreatmentRepository.findByVisitId(visit.id)).toHaveLength(0);
  });

  it('publishes emr.treatment-removed.v1 after a successful removal', async () => {
    const { visitRepository, visitTreatmentRepository, treatmentRepository, eventBus, useCase } = buildSut();
    const visit = await seedVisit(visitRepository);
    const treatment = await treatmentRepository.create({ treatmentCode: 'T03', treatmentName: 'Cleaning', treatmentCategoryId: 'c1', defaultPrice: 50000 });
    const entry = await visitTreatmentRepository.create({ visitId: visit.id, treatmentId: treatment.id, quantity: 1, unitPrice: 50000, subtotal: 50000, createdBy: 'doc-1' });

    await useCase.execute({ visitId: visit.id, visitTreatmentId: entry.id, actorUserId: 'doc-1' });

    const published = eventBus.published.find((p) => p.eventName === TREATMENT_REMOVED_EVENT);
    expect(published).toBeDefined();
    expect(published?.payload).toMatchObject({ visitId: visit.id, visitTreatmentId: entry.id });
  });

  it('rejects removing an entry that does not belong to the given visit', async () => {
    const { visitRepository, visitTreatmentRepository, treatmentRepository, useCase } = buildSut();
    const visit = await seedVisit(visitRepository);
    const otherVisit = await seedVisit(visitRepository);
    const treatment = await treatmentRepository.create({ treatmentCode: 'T04', treatmentName: 'X-Ray', treatmentCategoryId: 'c1', defaultPrice: 50000 });
    const entry = await visitTreatmentRepository.create({ visitId: otherVisit.id, treatmentId: treatment.id, quantity: 1, unitPrice: 50000, subtotal: 50000, createdBy: 'doc-1' });

    await expect(
      useCase.execute({ visitId: visit.id, visitTreatmentId: entry.id, actorUserId: 'doc-1' }),
    ).rejects.toBeInstanceOf(VisitTreatmentNotFoundException);
  });

  it('rejects removing once the linked invoice is PAID', async () => {
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
      useCase.execute({ visitId: visit.id, visitTreatmentId: entry.id, actorUserId: 'doc-1' }),
    ).rejects.toBeInstanceOf(TreatmentLockedException);
  });
});
