import { ListPatientsUseCase } from './ListPatientsUseCase';
import { FakePatientRepository } from '../../../../../tests/fakes/patientFakes';

// docs/06-tasks/task-290.md Testing Required: "GET /patients?patientType=OLD ... returns correctly filtered results"
describe('ListPatientsUseCase patientType filter (task-290)', () => {
  it('narrows results by the patientType filter', async () => {
    const patientRepository = new FakePatientRepository();
    const useCase = new ListPatientsUseCase(patientRepository);

    const newPatient = await patientRepository.create('MRN000001', {
      patientName: 'New Patient',
      gender: 'FEMALE',
      birthDate: new Date('1998-08-10'),
      phone: '0811',
      address: 'Jl. A',
    });
    const oldPatient = await patientRepository.create('MRN000002', {
      patientName: 'Returning Patient',
      gender: 'MALE',
      birthDate: new Date('1990-01-01'),
      phone: '0812',
      address: 'Jl. B',
    });
    await patientRepository.markAsReturning(oldPatient.id, new Date());

    const onlyNew = await useCase.execute({ patientType: 'NEW', page: 1, limit: 20, sort: 'createdAt', order: 'desc' });
    expect(onlyNew.items).toHaveLength(1);
    expect(onlyNew.items[0].id).toBe(newPatient.id);

    const onlyOld = await useCase.execute({ patientType: 'OLD', page: 1, limit: 20, sort: 'createdAt', order: 'desc' });
    expect(onlyOld.items).toHaveLength(1);
    expect(onlyOld.items[0].id).toBe(oldPatient.id);
  });
});
