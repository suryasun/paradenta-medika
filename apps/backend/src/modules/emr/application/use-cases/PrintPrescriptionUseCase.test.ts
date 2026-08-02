import { PrintPrescriptionUseCase } from './PrintPrescriptionUseCase';
import { FakePrescriptionRepository } from '../../../../../tests/fakes/emrFakes';
import { FakePatientRepository } from '../../../../../tests/fakes/patientFakes';
import { FakeDoctorRepository } from '../../../../../tests/fakes/masterDataFakes';
import { PrescriptionNotFoundException } from '../../domain/exceptions/EmrExceptions';

describe('PrintPrescriptionUseCase (task-066)', () => {
  it('rejects a non-existent prescription', async () => {
    const prescriptionRepository = new FakePrescriptionRepository();
    const patientRepository = new FakePatientRepository();
    const doctorRepository = new FakeDoctorRepository();
    const useCase = new PrintPrescriptionUseCase(prescriptionRepository, patientRepository, doctorRepository);

    await expect(useCase.execute('missing')).rejects.toBeInstanceOf(PrescriptionNotFoundException);
  });

  it('print output includes all required fields: patient, doctor, medicine, dosage, frequency, duration, instruction', async () => {
    const prescriptionRepository = new FakePrescriptionRepository();
    const patientRepository = new FakePatientRepository();
    const doctorRepository = new FakeDoctorRepository();
    const patient = await patientRepository.create('MRN000010', {
      patientName: 'Print Test Patient',
      gender: 'MALE',
      birthDate: new Date('1990-01-01'),
      phone: '08120008888',
      address: 'Jl. Test No. 10',
    });
    const doctor = await doctorRepository.create({ doctorCode: 'DOC30', userId: 'u30', branchId: 'branch-1', fullName: 'Dr. Print' });
    const prescription = await prescriptionRepository.create({
      visitId: 'v1',
      patientId: patient.id,
      doctorId: doctor.id,
      items: [{ medicineName: 'Amoxicillin', dosage: '500mg', frequency: '3x daily', duration: '5 days', instruction: 'After meals' }],
      createdBy: 'doc-1',
    });

    const useCase = new PrintPrescriptionUseCase(prescriptionRepository, patientRepository, doctorRepository);
    const printData = await useCase.execute(prescription.id);

    expect(printData.patientName).toBe('Print Test Patient');
    expect(printData.doctorName).toBe('Dr. Print');
    expect(printData.items[0]).toMatchObject({
      medicineName: 'Amoxicillin',
      dosage: '500mg',
      frequency: '3x daily',
      duration: '5 days',
      instruction: 'After meals',
    });
  });
});
