import { CloseVisitUseCase } from './CloseVisitUseCase';
import { FakeSoapNoteRepository, FakeVisitRepository, FakeVisitTreatmentRepository } from '../../../../../tests/fakes/emrFakes';
import { FakeWarehouseLocationRepository } from '../../../../../tests/fakes/warehouseFakes';
import { FakeAuditService } from '../../../../../tests/fakes/authFakes';
import { FakeEventBus } from '../../../../../tests/fakes/patientFakes';
import { MinimumDocumentationException } from '../../domain/exceptions/EmrExceptions';
import { EMR_FINISHED_EVENT, TREATMENT_MATERIAL_FINALIZED_EVENT } from '../../domain/events/EmrEvents';

async function seedVisit(repo: FakeVisitRepository) {
  return repo.create({ visitNo: 'VIS000001', patientId: 'p1', doctorId: 'd1', branchId: 'b1', queueId: 'q1', createdBy: 'doc-1' });
}

describe('CloseVisitUseCase (task-052)', () => {
  function buildSut() {
    const visitRepository = new FakeVisitRepository();
    const soapNoteRepository = new FakeSoapNoteRepository();
    const visitTreatmentRepository = new FakeVisitTreatmentRepository();
    const warehouseLocationRepository = new FakeWarehouseLocationRepository();
    const auditService = new FakeAuditService();
    const eventBus = new FakeEventBus();
    const useCase = new CloseVisitUseCase(
      visitRepository,
      soapNoteRepository,
      visitTreatmentRepository,
      warehouseLocationRepository,
      auditService,
      eventBus,
    );
    return { visitRepository, soapNoteRepository, visitTreatmentRepository, warehouseLocationRepository, eventBus, useCase };
  }

  it('rejects closing a Visit with no Treatment entries', async () => {
    const { visitRepository, soapNoteRepository, useCase } = buildSut();
    const visit = await seedVisit(visitRepository);
    await soapNoteRepository.upsert({ visitId: visit.id, subjective: 'a', objective: 'b', assessment: 'c', plan: 'd', updatedBy: 'doc-1' });

    await expect(useCase.execute({ visitId: visit.id, actorUserId: 'doc-1' })).rejects.toBeInstanceOf(MinimumDocumentationException);
  });

  it('rejects closing a Visit with no (or incomplete) SOAP note', async () => {
    const { visitRepository, visitTreatmentRepository, useCase } = buildSut();
    const visit = await seedVisit(visitRepository);
    await visitTreatmentRepository.create({
      visitId: visit.id,
      treatmentId: 't1',
      quantity: 1,
      unitPrice: 100000,
      subtotal: 100000,
      createdBy: 'doc-1',
    });

    await expect(useCase.execute({ visitId: visit.id, actorUserId: 'doc-1' })).rejects.toBeInstanceOf(MinimumDocumentationException);
  });

  it('closes a Visit with full documentation, transitions to COMPLETED, and publishes EMRFinished exactly once', async () => {
    const { visitRepository, soapNoteRepository, visitTreatmentRepository, eventBus, useCase } = buildSut();
    const visit = await seedVisit(visitRepository);
    await soapNoteRepository.upsert({ visitId: visit.id, subjective: 'a', objective: 'b', assessment: 'c', plan: 'd', updatedBy: 'doc-1' });
    await visitTreatmentRepository.create({
      visitId: visit.id,
      treatmentId: 't1',
      quantity: 1,
      unitPrice: 100000,
      subtotal: 100000,
      createdBy: 'doc-1',
    });

    const result = await useCase.execute({ visitId: visit.id, actorUserId: 'doc-1' });

    expect(result.status).toBe('COMPLETED');
    expect(eventBus.published).toHaveLength(1);
    expect(eventBus.published[0].eventName).toBe(EMR_FINISHED_EVENT);
  });

  it('docs/06-tasks/task-136.md (Epic Z): publishes a material-finalized event per treatment that recorded materials, once a warehouse location resolves for the branch', async () => {
    const { visitRepository, soapNoteRepository, visitTreatmentRepository, warehouseLocationRepository, eventBus, useCase } = buildSut();
    const visit = await seedVisit(visitRepository);
    await soapNoteRepository.upsert({ visitId: visit.id, subjective: 'a', objective: 'b', assessment: 'c', plan: 'd', updatedBy: 'doc-1' });
    await visitTreatmentRepository.create({
      visitId: visit.id,
      treatmentId: 't1',
      quantity: 1,
      unitPrice: 100000,
      subtotal: 100000,
      createdBy: 'doc-1',
      materials: [{ itemId: 'item-1', quantity: 2 }],
    });
    const warehouse = await warehouseLocationRepository.create({
      branchId: visit.branchId, locationCode: 'WH1', locationName: 'Main Warehouse', createdBy: 'admin',
    });

    await useCase.execute({ visitId: visit.id, actorUserId: 'doc-1' });

    const materialEvents = eventBus.published.filter((e) => e.eventName === TREATMENT_MATERIAL_FINALIZED_EVENT);
    expect(materialEvents).toHaveLength(1);
    expect(materialEvents[0].payload).toMatchObject({
      visitId: visit.id,
      warehouseId: warehouse.id,
      materials: [{ itemId: 'item-1', quantity: 2 }],
    });
  });

  it('does not publish a material-finalized event when no branch warehouse location can be resolved', async () => {
    const { visitRepository, soapNoteRepository, visitTreatmentRepository, eventBus, useCase } = buildSut();
    const visit = await seedVisit(visitRepository);
    await soapNoteRepository.upsert({ visitId: visit.id, subjective: 'a', objective: 'b', assessment: 'c', plan: 'd', updatedBy: 'doc-1' });
    await visitTreatmentRepository.create({
      visitId: visit.id,
      treatmentId: 't1',
      quantity: 1,
      unitPrice: 100000,
      subtotal: 100000,
      createdBy: 'doc-1',
      materials: [{ itemId: 'item-1', quantity: 2 }],
    });

    await useCase.execute({ visitId: visit.id, actorUserId: 'doc-1' });

    expect(eventBus.published.filter((e) => e.eventName === TREATMENT_MATERIAL_FINALIZED_EVENT)).toHaveLength(0);
  });
});
