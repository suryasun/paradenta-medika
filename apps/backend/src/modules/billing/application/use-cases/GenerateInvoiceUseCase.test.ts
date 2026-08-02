import { GenerateInvoiceUseCase } from './GenerateInvoiceUseCase';
import { FakeVisitRepository, FakeVisitTreatmentRepository, FakeTreatmentRepository } from '../../../../../tests/fakes/emrFakes';
import { FakeInvoiceItemRepository, FakeInvoiceRepository } from '../../../../../tests/fakes/billingFakes';
import { FakeAuditService } from '../../../../../tests/fakes/authFakes';
import { InvoiceNumberGenerator } from '../services/InvoiceNumberGenerator';
import { InvoiceAlreadyExistsForVisitException, NoBillableTreatmentException, VisitNotCompletedException } from '../../domain/exceptions/BillingExceptions';

async function seedCompletedVisit(repo: FakeVisitRepository) {
  const visit = await repo.create({ visitNo: 'VIS000001', patientId: 'p1', doctorId: 'd1', branchId: 'b1', queueId: 'q1', createdBy: 'doc-1' });
  repo.visits.get(visit.id)!.status = 'COMPLETED' as never;
  return visit;
}

describe('GenerateInvoiceUseCase (task-054)', () => {
  function buildSut() {
    const visitRepository = new FakeVisitRepository();
    const visitTreatmentRepository = new FakeVisitTreatmentRepository();
    const treatmentRepository = new FakeTreatmentRepository();
    const invoiceRepository = new FakeInvoiceRepository();
    const invoiceItemRepository = new FakeInvoiceItemRepository();
    const auditService = new FakeAuditService();
    const invoiceNumberGenerator = new InvoiceNumberGenerator(invoiceRepository);
    const useCase = new GenerateInvoiceUseCase(
      visitRepository,
      visitTreatmentRepository,
      treatmentRepository,
      invoiceRepository,
      invoiceItemRepository,
      invoiceNumberGenerator,
      auditService,
    );
    return { visitRepository, visitTreatmentRepository, treatmentRepository, invoiceRepository, invoiceItemRepository, useCase };
  }

  it('rejects generating an Invoice from a Visit that is not COMPLETED', async () => {
    const { visitRepository, useCase } = buildSut();
    const visit = await visitRepository.create({ visitNo: 'VIS000002', patientId: 'p1', doctorId: 'd1', branchId: 'b1', queueId: 'q1', createdBy: 'doc-1' });

    await expect(useCase.execute({ visitId: visit.id, actorUserId: 'cashier-1' })).rejects.toBeInstanceOf(VisitNotCompletedException);
  });

  it('rejects generating an Invoice for a Visit with no Treatment entries', async () => {
    const { visitRepository, useCase } = buildSut();
    const visit = await seedCompletedVisit(visitRepository);

    await expect(useCase.execute({ visitId: visit.id, actorUserId: 'cashier-1' })).rejects.toBeInstanceOf(NoBillableTreatmentException);
  });

  it('rejects generating a second Invoice for the same Visit', async () => {
    const { visitRepository, visitTreatmentRepository, treatmentRepository, useCase } = buildSut();
    const visit = await seedCompletedVisit(visitRepository);
    const treatment = await treatmentRepository.create({ treatmentCode: 'T01', treatmentName: 'Scaling', treatmentCategoryId: 'c1', defaultPrice: 100000 });
    await visitTreatmentRepository.create({ visitId: visit.id, treatmentId: treatment.id, quantity: 1, unitPrice: 100000, subtotal: 100000, createdBy: 'doc-1' });

    await useCase.execute({ visitId: visit.id, actorUserId: 'cashier-1' });

    await expect(useCase.execute({ visitId: visit.id, actorUserId: 'cashier-1' })).rejects.toBeInstanceOf(InvoiceAlreadyExistsForVisitException);
  });

  it('produces an Invoice with line items matching the recorded Treatments and their snapshotted prices exactly', async () => {
    const { visitRepository, visitTreatmentRepository, treatmentRepository, invoiceRepository, invoiceItemRepository, useCase } = buildSut();
    const visit = await seedCompletedVisit(visitRepository);
    const scaling = await treatmentRepository.create({ treatmentCode: 'T01', treatmentName: 'Scaling', treatmentCategoryId: 'c1', defaultPrice: 100000 });
    const filling = await treatmentRepository.create({ treatmentCode: 'T02', treatmentName: 'Tambal', treatmentCategoryId: 'c1', defaultPrice: 150000 });
    await visitTreatmentRepository.create({ visitId: visit.id, treatmentId: scaling.id, quantity: 1, unitPrice: 100000, subtotal: 100000, createdBy: 'doc-1' });
    await visitTreatmentRepository.create({ visitId: visit.id, treatmentId: filling.id, quantity: 2, unitPrice: 150000, subtotal: 300000, createdBy: 'doc-1' });

    const result = await useCase.execute({ visitId: visit.id, actorUserId: 'cashier-1' });

    const invoice = await invoiceRepository.findById(result.invoiceId);
    expect(Number(invoice!.grandTotal)).toBe(400000);
    expect(invoice!.status).toBe('UNPAID');

    const items = await invoiceItemRepository.findByInvoiceId(result.invoiceId);
    expect(items).toHaveLength(2);
    expect(items.map((i) => i.itemName).sort()).toEqual(['Scaling', 'Tambal']);
    expect(Number(items.find((i) => i.itemName === 'Tambal')!.total)).toBe(300000);
  });
});
