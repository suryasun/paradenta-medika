import { GetNewPatientReportUseCase } from './GetNewPatientReportUseCase';
import { FakeReservationRepository } from '../../../../../tests/fakes/reservationFakes';
import { parseTimeToDate } from '../../../reservation/application/services/timeUtils';
import { ReportFilterInvalidException } from '../../domain/exceptions/ReportExceptions';

async function seedReservation(
  repo: FakeReservationRepository,
  overrides: { reservationNo: string; patientId: string; reservationDate: Date; patientTypeAtBooking: 'NEW' | 'OLD'; status?: string; reservationType?: string },
) {
  const reservation = await repo.create({
    reservationNo: overrides.reservationNo,
    patientId: overrides.patientId,
    doctorId: 'd1',
    branchId: 'b1',
    reservationDate: overrides.reservationDate,
    reservationTime: parseTimeToDate('09:00'),
    reservationType: overrides.reservationType ?? 'APPOINTMENT',
    source: 'PHONE',
    patientTypeAtBooking: overrides.patientTypeAtBooking,
    createdBy: 'staff-1',
  });
  if (overrides.status) {
    repo.reservations.get(reservation.id)!.status = overrides.status as never;
  }
  return reservation;
}

const IN_RANGE = new Date('2026-03-10T00:00:00.000Z');
const OUT_OF_RANGE = new Date('2026-04-10T00:00:00.000Z');

// docs/06-tasks/task-291.md Testing Required
describe('GetNewPatientReportUseCase', () => {
  it('includes only NEW-tagged reservations within the given range, excluding OLD-tagged and out-of-range rows', async () => {
    const reservationRepository = new FakeReservationRepository();
    const useCase = new GetNewPatientReportUseCase(reservationRepository);

    await seedReservation(reservationRepository, { reservationNo: 'RSV-1', patientId: 'p1', reservationDate: IN_RANGE, patientTypeAtBooking: 'NEW' });
    await seedReservation(reservationRepository, { reservationNo: 'RSV-2', patientId: 'p2', reservationDate: IN_RANGE, patientTypeAtBooking: 'OLD' });
    await seedReservation(reservationRepository, { reservationNo: 'RSV-3', patientId: 'p3', reservationDate: OUT_OF_RANGE, patientTypeAtBooking: 'NEW' });

    const result = await useCase.execute({ dateFrom: '2026-03-01', dateTo: '2026-03-31', page: 1, limit: 20, sort: 'createdAt', order: 'desc' });

    expect(result.total).toBe(1);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].reservationNumber).toBe('RSV-1');
    expect(result.summary.totalNewPatients).toBe(1);
  });

  it('computes conversionRate from Completed vs. Cancelled/No-show among New-Patient reservations only', async () => {
    const reservationRepository = new FakeReservationRepository();
    const useCase = new GetNewPatientReportUseCase(reservationRepository);

    await seedReservation(reservationRepository, { reservationNo: 'RSV-1', patientId: 'p1', reservationDate: IN_RANGE, patientTypeAtBooking: 'NEW', status: 'COMPLETED' });
    await seedReservation(reservationRepository, { reservationNo: 'RSV-2', patientId: 'p2', reservationDate: IN_RANGE, patientTypeAtBooking: 'NEW', status: 'COMPLETED' });
    await seedReservation(reservationRepository, { reservationNo: 'RSV-3', patientId: 'p3', reservationDate: IN_RANGE, patientTypeAtBooking: 'NEW', status: 'CANCELLED' });
    await seedReservation(reservationRepository, { reservationNo: 'RSV-4', patientId: 'p4', reservationDate: IN_RANGE, patientTypeAtBooking: 'NEW', status: 'BOOKED' });
    // OLD-tagged Completed row must not affect the New-Patient-only conversionRate.
    await seedReservation(reservationRepository, { reservationNo: 'RSV-5', patientId: 'p5', reservationDate: IN_RANGE, patientTypeAtBooking: 'OLD', status: 'CANCELLED' });

    const result = await useCase.execute({ dateFrom: '2026-03-01', dateTo: '2026-03-31', page: 1, limit: 20, sort: 'createdAt', order: 'desc' });

    // 2 completed / (2 completed + 1 cancelled) = 66.67%; the still-open BOOKED row is excluded from the denominator.
    expect(result.summary.conversionRate).toBeCloseTo(66.67, 1);
    expect(result.summary.totalNewPatients).toBe(4);
  });

  it('rejects dateFrom after dateTo', async () => {
    const reservationRepository = new FakeReservationRepository();
    const useCase = new GetNewPatientReportUseCase(reservationRepository);

    await expect(
      useCase.execute({ dateFrom: '2026-03-31', dateTo: '2026-03-01', page: 1, limit: 20, sort: 'createdAt', order: 'desc' }),
    ).rejects.toBeInstanceOf(ReportFilterInvalidException);
  });
});
