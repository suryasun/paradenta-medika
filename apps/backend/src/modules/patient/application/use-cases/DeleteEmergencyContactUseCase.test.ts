import { DeleteEmergencyContactUseCase } from './DeleteEmergencyContactUseCase';
import { FakePatientEmergencyContactRepository } from '../../../../../tests/fakes/patientFakes';
import { FakeAuditService } from '../../../../../tests/fakes/authFakes';
import { PatientEmergencyContactNotFoundException } from '../../domain/exceptions/PatientExceptions';

function buildSut() {
  const contactRepository = new FakePatientEmergencyContactRepository();
  const auditService = new FakeAuditService();
  const useCase = new DeleteEmergencyContactUseCase(contactRepository, auditService);
  return { contactRepository, useCase };
}

describe('DeleteEmergencyContactUseCase', () => {
  it('deletes an emergency contact', async () => {
    const { contactRepository, useCase } = buildSut();
    const contact = await contactRepository.create({ patientId: 'p1', contactName: 'Jane Doe', relationship: 'Spouse', phone: '111' });

    await useCase.execute({ patientId: 'p1', contactId: contact.id, actorUserId: 'staff-1' });

    expect(await contactRepository.findById(contact.id)).toBeNull();
  });

  it('throws PatientEmergencyContactNotFoundException for a contact belonging to a different patient', async () => {
    const { contactRepository, useCase } = buildSut();
    const contact = await contactRepository.create({ patientId: 'p1', contactName: 'Jane Doe', relationship: 'Spouse', phone: '111' });

    await expect(
      useCase.execute({ patientId: 'other-patient', contactId: contact.id, actorUserId: 'staff-1' }),
    ).rejects.toBeInstanceOf(PatientEmergencyContactNotFoundException);
  });
});
