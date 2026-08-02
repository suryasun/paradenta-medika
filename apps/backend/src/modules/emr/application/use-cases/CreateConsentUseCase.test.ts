import { CreateConsentUseCase } from './CreateConsentUseCase';
import { FakeConsentRepository, FakeConsentTemplateRepository, FakeVisitRepository } from '../../../../../tests/fakes/emrFakes';
import { FakeAuditService } from '../../../../../tests/fakes/authFakes';
import { ConsentTemplateNotActiveException } from '../../domain/exceptions/EmrExceptions';

async function seedVisit(repo: FakeVisitRepository) {
  return repo.create({ visitNo: 'VIS000001', patientId: 'p1', doctorId: 'd1', branchId: 'b1', queueId: 'q1', createdBy: 'doc-1' });
}

describe('CreateConsentUseCase (task-086)', () => {
  it('rejects an inactive Consent Template', async () => {
    const visitRepository = new FakeVisitRepository();
    const consentTemplateRepository = new FakeConsentTemplateRepository();
    const consentRepository = new FakeConsentRepository();
    const auditService = new FakeAuditService();
    const visit = await seedVisit(visitRepository);
    const template = await consentTemplateRepository.create({ category: 'SURGICAL', title: 'Extraction Consent', body: 'Body text' });
    template.isActive = false;
    const useCase = new CreateConsentUseCase(visitRepository, consentTemplateRepository, consentRepository, auditService);

    await expect(
      useCase.execute({ visitId: visit.id, templateId: template.id, procedure: 'Tooth Extraction', actorUserId: 'doc-1' }),
    ).rejects.toBeInstanceOf(ConsentTemplateNotActiveException);
  });

  it('instantiates a consent referencing the correct template, patient, and visit', async () => {
    const visitRepository = new FakeVisitRepository();
    const consentTemplateRepository = new FakeConsentTemplateRepository();
    const consentRepository = new FakeConsentRepository();
    const auditService = new FakeAuditService();
    const visit = await seedVisit(visitRepository);
    const template = await consentTemplateRepository.create({ category: 'CLINICAL', title: 'Filling Consent', body: 'Body text' });
    const useCase = new CreateConsentUseCase(visitRepository, consentTemplateRepository, consentRepository, auditService);

    const consent = await useCase.execute({ visitId: visit.id, templateId: template.id, procedure: 'Composite Filling', actorUserId: 'doc-1' });

    expect(consent.templateId).toBe(template.id);
    expect(consent.patientId).toBe('p1');
    expect(consent.visitId).toBe(visit.id);
    expect(consent.signedAt).toBeNull();
    expect(auditService.records).toHaveLength(1);
  });
});
