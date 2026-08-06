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

  // docs/06-tasks/task-290.md Testing Required: "GET /reservations?patientType=NEW ... returns correctly filtered results"
  it('narrows results by the patientType filter (task-290)', async () => {
    const reservationRepository = new FakeReservationRepository();
    const useCase = new ListReservationsUseCase(reservationRepository);
    await reservationRepository.create({
      reservationNo: 'RSV-3',
      patientId: 'p3',
      doctorId: 'doctor-a',
      branchId: 'b1',
      reservationDate: new Date(),
      reservationTime: parseTimeToDate('09:00'),
      reservationType: 'APPOINTMENT',
      source: 'PHONE',
      patientTypeAtBooking: 'NEW',
      createdBy: 'staff-1',
    });
    await reservationRepository.create({
      reservationNo: 'RSV-4',
      patientId: 'p4',
      doctorId: 'doctor-a',
      branchId: 'b1',
      reservationDate: new Date(),
      reservationTime: parseTimeToDate('10:00'),
      reservationType: 'APPOINTMENT',
      source: 'PHONE',
      patientTypeAtBooking: 'OLD',
      createdBy: 'staff-1',
    });

    const onlyNew = await useCase.execute({ patientType: 'NEW', page: 1, limit: 20, sort: 'createdAt', order: 'desc' });
    expect(onlyNew.items).toHaveLength(1);
    expect(onlyNew.items[0].reservationNumber).toBe('RSV-3');

    const onlyOld = await useCase.execute({ patientType: 'OLD', page: 1, limit: 20, sort: 'createdAt', order: 'desc' });
    expect(onlyOld.items).toHaveLength(1);
    expect(onlyOld.items[0].reservationNumber).toBe('RSV-4');
  });
});
