import { GetReservationByStatusReportUseCase } from './GetReservationByStatusReportUseCase';
import { FakeReservationRepository } from '../../../../../tests/fakes/reservationFakes';
import { parseTimeToDate } from '../../../reservation/application/services/timeUtils';
import { ReportFilterInvalidException } from '../../domain/exceptions/ReportExceptions';

async function seedReservation(
  repo: FakeReservationRepository,
  overrides: { reservationNo: string; patientId: string; reservationDate: Date; status: string },
) {
  const reservation = await repo.create({
    reservationNo: overrides.reservationNo,
    patientId: overrides.patientId,
    doctorId: 'd1',
    branchId: 'b1',
    reservationDate: overrides.reservationDate,
    reservationTime: parseTimeToDate('09:00'),
    reservationType: 'APPOINTMENT',
    source: 'PHONE',
    createdBy: 'staff-1',
  });
  repo.reservations.get(reservation.id)!.status = overrides.status as never;
  return reservation;
}

const IN_RANGE_1 = new Date('2026-03-10T00:00:00.000Z');
const IN_RANGE_2 = new Date('2026-03-12T00:00:00.000Z');
const OUT_OF_MONTH = new Date('2026-04-10T00:00:00.000Z');
const OUT_OF_RANGE = new Date('2026-05-10T00:00:00.000Z');

// docs/06-tasks/task-305.md (Reservation Module Addendum #4), renamed from
// GetCompletedReservationReportUseCase (task-299).
describe('GetReservationByStatusReportUseCase', () => {
  it('defaults to COMPLETED when no status filter is given, excluding other statuses and out-of-range rows', async () => {
    const reservationRepository = new FakeReservationRepository();
    const useCase = new GetReservationByStatusReportUseCase(reservationRepository);

    await seedReservation(reservationRepository, { reservationNo: 'RSV-1', patientId: 'p1', reservationDate: IN_RANGE_1, status: 'COMPLETED' });
    await seedReservation(reservationRepository, { reservationNo: 'RSV-2', patientId: 'p2', reservationDate: IN_RANGE_1, status: 'CANCELLED' });
    await seedReservation(reservationRepository, { reservationNo: 'RSV-3', patientId: 'p3', reservationDate: OUT_OF_RANGE, status: 'COMPLETED' });

    const result = await useCase.execute({ dateFrom: '2026-03-01', dateTo: '2026-03-31', page: 1, limit: 20, sort: 'createdAt', order: 'desc' });

    expect(result.total).toBe(1);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].reservationNumber).toBe('RSV-1');
    expect(result.summary.total).toBe(1);
  });

  it('narrows both the table and summary to an explicitly selected status', async () => {
    const reservationRepository = new FakeReservationRepository();
    const useCase = new GetReservationByStatusReportUseCase(reservationRepository);

    await seedReservation(reservationRepository, { reservationNo: 'RSV-1', patientId: 'p1', reservationDate: IN_RANGE_1, status: 'COMPLETED' });
    await seedReservation(reservationRepository, { reservationNo: 'RSV-2', patientId: 'p2', reservationDate: IN_RANGE_1, status: 'CANCELLED' });

    const result = await useCase.execute({
      dateFrom: '2026-03-01',
      dateTo: '2026-03-31',
      status: 'CANCELLED',
      page: 1,
      limit: 20,
      sort: 'createdAt',
      order: 'desc',
    });

    expect(result.total).toBe(1);
    expect(result.items[0].reservationNumber).toBe('RSV-2');
    expect(result.summary.total).toBe(1);
  });

  it('clears the status filter entirely when status=ALL, including every status in range', async () => {
    const reservationRepository = new FakeReservationRepository();
    const useCase = new GetReservationByStatusReportUseCase(reservationRepository);

    await seedReservation(reservationRepository, { reservationNo: 'RSV-1', patientId: 'p1', reservationDate: IN_RANGE_1, status: 'COMPLETED' });
    await seedReservation(reservationRepository, { reservationNo: 'RSV-2', patientId: 'p2', reservationDate: IN_RANGE_1, status: 'CANCELLED' });

    const result = await useCase.execute({
      dateFrom: '2026-03-01',
      dateTo: '2026-03-31',
      status: 'ALL',
      page: 1,
      limit: 20,
      sort: 'createdAt',
      order: 'desc',
    });

    expect(result.total).toBe(2);
    expect(result.summary.total).toBe(2);
  });

  it('builds a day-by-day trend by default', async () => {
    const reservationRepository = new FakeReservationRepository();
    const useCase = new GetReservationByStatusReportUseCase(reservationRepository);

    await seedReservation(reservationRepository, { reservationNo: 'RSV-1', patientId: 'p1', reservationDate: IN_RANGE_1, status: 'COMPLETED' });
    await seedReservation(reservationRepository, { reservationNo: 'RSV-2', patientId: 'p2', reservationDate: IN_RANGE_1, status: 'COMPLETED' });
    await seedReservation(reservationRepository, { reservationNo: 'RSV-3', patientId: 'p3', reservationDate: IN_RANGE_2, status: 'COMPLETED' });

    const result = await useCase.execute({ dateFrom: '2026-03-01', dateTo: '2026-03-31', page: 1, limit: 20, sort: 'createdAt', order: 'desc' });

    expect(result.summary.total).toBe(3);
    expect(result.summary.trend).toEqual([
      { date: '2026-03-10', count: 2 },
      { date: '2026-03-12', count: 1 },
    ]);
  });

  it('builds a month-by-month trend when groupBy=month', async () => {
    const reservationRepository = new FakeReservationRepository();
    const useCase = new GetReservationByStatusReportUseCase(reservationRepository);

    await seedReservation(reservationRepository, { reservationNo: 'RSV-1', patientId: 'p1', reservationDate: IN_RANGE_1, status: 'COMPLETED' });
    await seedReservation(reservationRepository, { reservationNo: 'RSV-2', patientId: 'p2', reservationDate: OUT_OF_MONTH, status: 'COMPLETED' });

    const result = await useCase.execute({
      dateFrom: '2026-03-01',
      dateTo: '2026-04-30',
      groupBy: 'month',
      page: 1,
      limit: 20,
      sort: 'createdAt',
      order: 'desc',
    });

    expect(result.summary.trend).toEqual([
      { date: '2026-03', count: 1 },
      { date: '2026-04', count: 1 },
    ]);
  });

  it('rejects dateFrom after dateTo', async () => {
    const reservationRepository = new FakeReservationRepository();
    const useCase = new GetReservationByStatusReportUseCase(reservationRepository);

    await expect(
      useCase.execute({ dateFrom: '2026-03-31', dateTo: '2026-03-01', page: 1, limit: 20, sort: 'createdAt', order: 'desc' }),
    ).rejects.toBeInstanceOf(ReportFilterInvalidException);
  });
});
