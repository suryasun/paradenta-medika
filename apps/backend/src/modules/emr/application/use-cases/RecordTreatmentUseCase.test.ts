import { RecordTreatmentUseCase } from './RecordTreatmentUseCase';
import { FakeTreatmentRepository, FakeVisitRepository, FakeVisitTreatmentRepository } from '../../../../../tests/fakes/emrFakes';
import { FakeItemRepository } from '../../../../../tests/fakes/warehouseFakes';
import { FakeInvoiceRepository } from '../../../../../tests/fakes/billingFakes';
import { FakeAuditService } from '../../../../../tests/fakes/authFakes';
import { FakeEventBus } from '../../../../../tests/fakes/patientFakes';
import { TreatmentLockedException, TreatmentNotActiveException } from '../../domain/exceptions/EmrExceptions';
import { TREATMENT_RECORDED_EVENT } from '../../domain/events/EmrEvents';
import { ItemNotConsumableException, ItemNotFoundException } from '../../../warehouse/domain/exceptions/WarehouseExceptions';

async function seedVisit(repo: FakeVisitRepository) {
  return repo.create({ visitNo: 'VIS000001', patientId: 'p1', doctorId: 'd1', branchId: 'b1', queueId: 'q1', createdBy: 'doc-1' });
}

function buildSut() {
  const visitRepository = new FakeVisitRepository();
  const visitTreatmentRepository = new FakeVisitTreatmentRepository();
  const treatmentRepository = new FakeTreatmentRepository();
  const itemRepository = new FakeItemRepository();
  const invoiceRepository = new FakeInvoiceRepository();
  const auditService = new FakeAuditService();
  const eventBus = new FakeEventBus();
  const useCase = new RecordTreatmentUseCase(
    visitRepository,
    visitTreatmentRepository,
    treatmentRepository,
    itemRepository,
    invoiceRepository,
    auditService,
    eventBus,
  );
  return { visitRepository, visitTreatmentRepository, treatmentRepository, itemRepository, invoiceRepository, auditService, eventBus, useCase };
}

describe('RecordTreatmentUseCase (task-053)', () => {
  it('rejects recording a treatment against a deactivated catalog item', async () => {
    const { visitRepository, treatmentRepository, useCase } = buildSut();
    const visit = await seedVisit(visitRepository);
    const treatment = await treatmentRepository.create({ treatmentCode: 'T01', treatmentName: 'Scaling', treatmentCategoryId: 'c1', defaultPrice: 100000 });
    treatmentRepository.treatments.get(treatment.id)!.isActive = false;

    await expect(
      useCase.execute({ visitId: visit.id, treatmentId: treatment.id, actorUserId: 'doc-1' }),
    ).rejects.toBeInstanceOf(TreatmentNotActiveException);
  });

  // docs/06-tasks/task-320.md
  it('publishes emr.treatment-recorded.v1 with the entry data after a successful create', async () => {
    const { visitRepository, treatmentRepository, eventBus, useCase } = buildSut();
    const visit = await seedVisit(visitRepository);
    const treatment = await treatmentRepository.create({ treatmentCode: 'T08', treatmentName: 'Scaling', treatmentCategoryId: 'c1', defaultPrice: 100000 });

    const entry = await useCase.execute({ visitId: visit.id, treatmentId: treatment.id, quantity: 2, actorUserId: 'doc-1' });

    const published = eventBus.published.find((p) => p.eventName === TREATMENT_RECORDED_EVENT);
    expect(published).toBeDefined();
    expect(published?.payload).toMatchObject({
      visitId: visit.id,
      visitTreatmentId: entry.id,
      treatmentId: treatment.id,
      treatmentName: 'Scaling',
      quantity: 2,
      unitPrice: 100000,
      subtotal: 200000,
    });
  });

  it('snapshots the price at entry time rather than recalculating it later', async () => {
    const { visitRepository, visitTreatmentRepository, treatmentRepository, useCase } = buildSut();
    const visit = await seedVisit(visitRepository);
    const treatment = await treatmentRepository.create({ treatmentCode: 'T02', treatmentName: 'Tambal', treatmentCategoryId: 'c1', defaultPrice: 150000 });

    const entry = await useCase.execute({ visitId: visit.id, treatmentId: treatment.id, quantity: 2, actorUserId: 'doc-1' });
    expect(entry.unitPrice).toBe(150000);
    expect(entry.subtotal).toBe(300000);

    // Catalog price changes afterward must not retroactively alter the recorded entry.
    await treatmentRepository.update(treatment.id, { defaultPrice: 999999 });
    const stored = (await visitTreatmentRepository.findByVisitId(visit.id))[0];
    expect(Number(stored.unitPrice)).toBe(150000);
  });

  it('docs/03-sad/15-module-emr.md Section 23 "Material Used" (task-136): records ad-hoc materials and persists them', async () => {
    const { visitRepository, visitTreatmentRepository, treatmentRepository, itemRepository, useCase } = buildSut();
    const visit = await seedVisit(visitRepository);
    const treatment = await treatmentRepository.create({ treatmentCode: 'T03', treatmentName: 'Extraction', treatmentCategoryId: 'c1', defaultPrice: 200000 });
    const item = await itemRepository.create({
      itemCode: 'MAT01', itemName: 'Gauze', categoryId: 'cat1', unitId: 'unit1',
      minimumStock: 10, isConsumable: true, isBatchTracked: false, isExpiryTracked: false, createdBy: 'admin',
    });

    const entry = await useCase.execute({
      visitId: visit.id, treatmentId: treatment.id, actorUserId: 'doc-1',
      materials: [{ itemId: item.id, quantity: 3 }],
    });

    expect(entry.materials).toEqual([{ itemId: item.id, quantity: 3 }]);
    const stored = (await visitTreatmentRepository.findByVisitIdWithMaterials(visit.id))[0];
    expect(stored.materials).toHaveLength(1);
    expect(Number(stored.materials[0].quantity)).toBe(3);
  });

  it('rejects a material item that does not exist', async () => {
    const { visitRepository, treatmentRepository, useCase } = buildSut();
    const visit = await seedVisit(visitRepository);
    const treatment = await treatmentRepository.create({ treatmentCode: 'T04', treatmentName: 'Extraction', treatmentCategoryId: 'c1', defaultPrice: 200000 });

    await expect(
      useCase.execute({ visitId: visit.id, treatmentId: treatment.id, actorUserId: 'doc-1', materials: [{ itemId: 'does-not-exist', quantity: 1 }] }),
    ).rejects.toBeInstanceOf(ItemNotFoundException);
  });

  it('rejects a material item flagged non-consumable', async () => {
    const { visitRepository, treatmentRepository, itemRepository, useCase } = buildSut();
    const visit = await seedVisit(visitRepository);
    const treatment = await treatmentRepository.create({ treatmentCode: 'T05', treatmentName: 'Extraction', treatmentCategoryId: 'c1', defaultPrice: 200000 });
    const item = await itemRepository.create({
      itemCode: 'EQ01', itemName: 'Dental Chair Part', categoryId: 'cat1', unitId: 'unit1',
      minimumStock: 1, isConsumable: false, isBatchTracked: false, isExpiryTracked: false, createdBy: 'admin',
    });

    await expect(
      useCase.execute({ visitId: visit.id, treatmentId: treatment.id, actorUserId: 'doc-1', materials: [{ itemId: item.id, quantity: 1 }] }),
    ).rejects.toBeInstanceOf(ItemNotConsumableException);
  });

  // docs/06-tasks/task-317.md
  it('rejects recording a treatment once the linked invoice is PAID', async () => {
    const { visitRepository, treatmentRepository, invoiceRepository, useCase } = buildSut();
    const visit = await seedVisit(visitRepository);
    const treatment = await treatmentRepository.create({ treatmentCode: 'T06', treatmentName: 'Cleaning', treatmentCategoryId: 'c1', defaultPrice: 100000 });
    const invoice = await invoiceRepository.create({
      invoiceNo: 'INV000001', visitId: visit.id, patientId: 'p1', branchId: 'b1',
      subtotal: 100000, discount: 0, tax: 0, grandTotal: 100000, createdBy: 'admin',
    });
    invoiceRepository.invoices.get(invoice.id)!.status = 'PAID';

    await expect(
      useCase.execute({ visitId: visit.id, treatmentId: treatment.id, actorUserId: 'doc-1' }),
    ).rejects.toBeInstanceOf(TreatmentLockedException);
  });

  it('allows recording a treatment on a COMPLETED visit whose invoice is not yet paid', async () => {
    const { visitRepository, treatmentRepository, invoiceRepository, useCase } = buildSut();
    const visit = await seedVisit(visitRepository);
    visitRepository.visits.get(visit.id)!.status = 'COMPLETED';
    const treatment = await treatmentRepository.create({ treatmentCode: 'T07', treatmentName: 'Filling', treatmentCategoryId: 'c1', defaultPrice: 100000 });
    await invoiceRepository.create({
      invoiceNo: 'INV000002', visitId: visit.id, patientId: 'p1', branchId: 'b1',
      subtotal: 100000, discount: 0, tax: 0, grandTotal: 100000, createdBy: 'admin',
    });

    const entry = await useCase.execute({ visitId: visit.id, treatmentId: treatment.id, actorUserId: 'doc-1' });
    expect(entry.treatmentId).toBe(treatment.id);
  });
});
