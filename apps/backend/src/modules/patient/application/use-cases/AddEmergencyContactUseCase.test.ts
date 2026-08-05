import { AddEmergencyContactUseCase } from './AddEmergencyContactUseCase';
import { FakePatientEmergencyContactRepository, FakePatientRepository } from '../../../../../tests/fakes/patientFakes';
import { FakeAuditService } from '../../../../../tests/fakes/authFakes';
import { PatientNotFoundException } from '../../domain/exceptions/PatientExceptions';

function buildSut() {
  const patientRepository = new FakePatientRepository();
  const contactRepository = new FakePatientEmergencyContactRepository();
  const auditService = new FakeAuditService();
  const useCase = new AddEmergencyContactUseCase(patientRepository, contactRepository, auditService);
  return { patientRepository, contactRepository, auditService, useCase };
}

async function seedPatient(patientRepository: FakePatientRepository) {
  return patientRepository.create('MRN000001', {
    patientName: 'John Doe',
    gender: 'MALE',
    birthDate: new Date('1998-08-10'),
    phone: '08123456789',
    address: 'Jl. Contoh No. 10',
  });
}

describe('AddEmergencyContactUseCase', () => {
  it('adds an emergency contact with the required fields plus optional address', async () => {
    const { patientRepository, useCase } = buildSut();
    const patient = await seedPatient(patientRepository);

    const contact = await useCase.execute({
      patientId: patient.id,
      contactName: 'Jane Doe',
      relationship: 'Spouse',
      phone: '0899988877',
      address: 'Jl. Kontak No. 5',
      actorUserId: 'staff-1',
    });

    expect(contact.contactName).toBe('Jane Doe');
    expect(contact.relationship).toBe('Spouse');
    expect(contact.phone).toBe('0899988877');
    expect(contact.address).toBe('Jl. Kontak No. 5');
  });

  it('adds an emergency contact without an address (optional)', async () => {
    const { patientRepository, useCase } = buildSut();
    const patient = await seedPatient(patientRepository);

    const contact = await useCase.execute({
      patientId: patient.id,
      contactName: 'Jane Doe',
      relationship: 'Spouse',
      phone: '0899988877',
      actorUserId: 'staff-1',
    });

    expect(contact.address).toBeNull();
  });

  it('a patient may have any number of emergency contacts', async () => {
    const { patientRepository, contactRepository, useCase } = buildSut();
    const patient = await seedPatient(patientRepository);

    await useCase.execute({ patientId: patient.id, contactName: 'A', relationship: 'Spouse', phone: '1', actorUserId: 'staff-1' });
    await useCase.execute({ patientId: patient.id, contactName: 'B', relationship: 'Parent', phone: '2', actorUserId: 'staff-1' });

    const all = await contactRepository.listForPatient(patient.id);
    expect(all).toHaveLength(2);
  });

  it('throws PatientNotFoundException for a non-existent patient', async () => {
    const { useCase } = buildSut();

    await expect(
      useCase.execute({ patientId: 'missing', contactName: 'Jane Doe', relationship: 'Spouse', phone: '1', actorUserId: 'staff-1' }),
    ).rejects.toBeInstanceOf(PatientNotFoundException);
  });
});
