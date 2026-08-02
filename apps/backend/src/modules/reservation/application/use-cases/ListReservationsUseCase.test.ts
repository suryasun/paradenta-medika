import { ListReservationsUseCase } from './ListReservationsUseCase';
import { FakeReservationRepository } from '../../../../../tests/fakes/reservationFakes';
import { parseTimeToDate } from '../services/timeUtils';

describe('ListReservationsUseCase', () => {
  it('narrows results by doctorId and status filters, individually and combined', async () => {
    const reservationRepository = new FakeReservationRepository();
    const useCase = new ListReservationsUseCase(reservationRepository);
    const r1 = await reservationRepository.create({
      reservationNo: 'RSV-1',
      patientId: 'p1',
      doctorId: 'doctor-a',
      branchId: 'b1',
      reservationDate: new Date(),
      reservationTime: parseTimeToDate('09:00'),
      reservationType: 'APPOINTMENT',
      source: 'PHONE',
      createdBy: 'staff-1',
    });
    await reservationRepository.create({
      reservationNo: 'RSV-2',
      patientId: 'p2',
      doctorId: 'doctor-b',
      branchId: 'b1',
      reservationDate: new Date(),
      reservationTime: parseTimeToDate('10:00'),
      reservationType: 'APPOINTMENT',
      source: 'PHONE',
      createdBy: 'staff-1',
    });
    reservationRepository.reservations.get(r1.id)!.status = 'CANCELLED';

    const byDoctorOnly = await useCase.execute({ doctorId: 'doctor-a', page: 1, limit: 20, sort: 'createdAt', order: 'desc' });
    expect(byDoctorOnly.items).toHaveLength(1);

    const byStatusOnly = await useCase.execute({ status: 'CANCELLED', page: 1, limit: 20, sort: 'createdAt', order: 'desc' });
    expect(byStatusOnly.items).toHaveLength(1);
    expect(byStatusOnly.items[0].reservationNumber).toBe('RSV-1');

    const combined = await useCase.execute({ doctorId: 'doctor-a', status: 'CANCELLED', page: 1, limit: 20, sort: 'createdAt', order: 'desc' });
    expect(combined.items).toHaveLength(1);

    const noMatch = await useCase.execute({ doctorId: 'doctor-b', status: 'CANCELLED', page: 1, limit: 20, sort: 'createdAt', order: 'desc' });
    expect(noMatch.items).toHaveLength(0);
  });
});
