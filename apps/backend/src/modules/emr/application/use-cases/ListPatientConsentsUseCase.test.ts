import { ListPatientConsentsUseCase } from './ListPatientConsentsUseCase';
import { FakeConsentRepository } from '../../../../../tests/fakes/emrFakes';

describe('ListPatientConsentsUseCase (task-087)', () => {
  it('returns all consents for a patient, signed and unsigned, in chronological order', async () => {
    const consentRepository = new FakeConsentRepository();
    const first = await consentRepository.create({
      templateId: 't1',
      patientId: 'p1',
      visitId: 'v1',
      doctorId: 'd1',
      procedure: 'Scaling',
      createdBy: 'doc-1',
    });
    await consentRepository.sign(first.id, {
      signerName: 'John Doe',
      signerRelationship: 'SELF',
      signatureData: 'sig',
      hash: 'hash',
      signedAttachmentId: 'att-1',
    });
    const second = await consentRepository.create({
      templateId: 't2',
      patientId: 'p1',
      visitId: 'v2',
      doctorId: 'd1',
      procedure: 'Extraction',
      createdBy: 'doc-1',
    });
    await consentRepository.create({
      templateId: 't3',
      patientId: 'other-patient',
      visitId: 'v3',
      doctorId: 'd1',
      procedure: 'Implant',
      createdBy: 'doc-1',
    });

    const useCase = new ListPatientConsentsUseCase(consentRepository);
    const history = await useCase.execute('p1');

    expect(history.map((c) => c.id)).toEqual([first.id, second.id]);
    expect(history[0].signedAt).not.toBeNull();
    expect(history[1].signedAt).toBeNull();
  });
});
