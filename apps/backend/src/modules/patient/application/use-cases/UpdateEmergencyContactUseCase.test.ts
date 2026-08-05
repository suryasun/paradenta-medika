import { UpdateEmergencyContactUseCase } from './UpdateEmergencyContactUseCase';
import { FakePatientEmergencyContactRepository } from '../../../../../tests/fakes/patientFakes';
import { FakeAuditService } from '../../../../../tests/fakes/authFakes';
import { PatientEmergencyContactNotFoundException } from '../../domain/exceptions/PatientExceptions';

function buildSut() {
  const contactRepository = new FakePatientEmergencyContactRepository();
  const auditService = new FakeAuditService();
  const useCase = new UpdateEmergencyContactUseCase(contactRepository, auditService);
  return { contactRepository, useCase };
}

describe('UpdateEmergencyContactUseCase', () => {
  it('updates the contact fields', async () => {
    const { contactRepository, useCase } = buildSut();
    const contact = await contactRepository.create({
      patientId: 'p1',
      contactName: 'Jane Doe',
      relationship: 'Spouse',
      phone: '111',
    });

    const updated = await useCase.execute({
      patientId: 'p1',
      contactId: contact.id,
      phone: '222',
      address: 'Jl. Baru',
      actorUserId: 'staff-1',
    });

    expect(updated.phone).toBe('222');
    expect(updated.address).toBe('Jl. Baru');
    expect(updated.contactName).toBe('Jane Doe');
  });

  it('throws PatientEmergencyContactNotFoundException for a contact belonging to a different patient', async () => {
    const { contactRepository, useCase } = buildSut();
    const contact = await contactRepository.create({ patientId: 'p1', contactName: 'Jane Doe', relationship: 'Spouse', phone: '111' });

    await expect(
      useCase.execute({ patientId: 'other-patient', contactId: contact.id, phone: '222', actorUserId: 'staff-1' }),
    ).rejects.toBeInstanceOf(PatientEmergencyContactNotFoundException);
  });

  it('throws PatientEmergencyContactNotFoundException for a non-existent contact', async () => {
    const { useCase } = buildSut();

    await expect(
      useCase.execute({ patientId: 'p1', contactId: 'missing', phone: '222', actorUserId: 'staff-1' }),
    ).rejects.toBeInstanceOf(PatientEmergencyContactNotFoundException);
  });
});
