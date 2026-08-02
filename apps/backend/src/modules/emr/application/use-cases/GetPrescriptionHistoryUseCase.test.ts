import { GetPrescriptionHistoryUseCase } from './GetPrescriptionHistoryUseCase';
import { FakePrescriptionRepository } from '../../../../../tests/fakes/emrFakes';

describe('GetPrescriptionHistoryUseCase (task-066)', () => {
  it('returns all prescriptions for a patient in chronological order', async () => {
    const prescriptionRepository = new FakePrescriptionRepository();
    const first = await prescriptionRepository.create({
      visitId: 'v1',
      patientId: 'p1',
      doctorId: 'd1',
      items: [{ medicineName: 'Paracetamol', dosage: '500mg', frequency: '3x', duration: '3d' }],
      createdBy: 'doc-1',
    });
    const second = await prescriptionRepository.create({
      visitId: 'v2',
      patientId: 'p1',
      doctorId: 'd1',
      items: [{ medicineName: 'Ibuprofen', dosage: '400mg', frequency: '2x', duration: '5d' }],
      createdBy: 'doc-1',
    });
    await prescriptionRepository.create({
      visitId: 'v3',
      patientId: 'other-patient',
      doctorId: 'd1',
      items: [{ medicineName: 'Amoxicillin', dosage: '500mg', frequency: '3x', duration: '5d' }],
      createdBy: 'doc-1',
    });

    const useCase = new GetPrescriptionHistoryUseCase(prescriptionRepository);
    const history = await useCase.execute('p1');

    expect(history.map((p) => p.id)).toEqual([first.id, second.id]);
  });
});
