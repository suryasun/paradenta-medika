import { GetReservationByDoctorReportUseCase } from './GetReservationByDoctorReportUseCase';
import { FakeReservationRepository } from '../../../../../tests/fakes/reservationFakes';
import { parseTimeToDate } from '../../../reservation/application/services/timeUtils';
import { ReportFilterInvalidException } from '../../domain/exceptions/ReportExceptions';

async function seedReservation(
  repo: FakeReservationRepository,
  overrides: { reservationNo: string; patientId: string; doctorId: string; reservationDate: Date },
) {
  return repo.create({
    reservationNo: overrides.reservationNo,
    patientId: overrides.patientId,
    doctorId: overrides.doctorId,
    branchId: 'b1',
    reservationDate: overrides.reservationDate,
    reservationTime: parseTimeToDate('09:00'),
    reservationType: 'APPOINTMENT',
    source: 'PHONE',
    createdBy: 'staff-1',
  });
}

const IN_RANGE = new Date('2026-03-10T00:00:00.000Z');
const OUT_OF_RANGE = new Date('2026-04-10T00:00:00.000Z');

// docs/06-tasks/task-301.md (Reservation Module Addendum #3)
describe('GetReservationByDoctorReportUseCase', () => {
  it('builds a per-doctor breakdown over the full range, sorted by count descending', async () => {
    const reservationRepository = new FakeReservationRepository();
    const useCase = new GetReservationByDoctorReportUseCase(reservationRepository);

    await seedReservation(reservationRepository, { reservationNo: 'RSV-1', patientId: 'p1', doctorId: 'd1', reservationDate: IN_RANGE });
    await seedReservation(reservationRepository, { reservationNo: 'RSV-2', patientId: 'p2', doctorId: 'd1', reservationDate: IN_RANGE });
    await seedReservation(reservationRepository, { reservationNo: 'RSV-3', patientId: 'p3', doctorId: 'd2', reservationDate: IN_RANGE });
    await seedReservation(reservationRepository, { reservationNo: 'RSV-4', patientId: 'p4', doctorId: 'd1', reservationDate: OUT_OF_RANGE });

    const result = await useCase.execute({ dateFrom: '2026-03-01', dateTo: '2026-03-31', page: 1, limit: 20, sort: 'createdAt', order: 'desc' });

    expect(result.summary.totalDoctors).toBe(2);
    expect(result.summary.breakdown).toEqual([
      { doctorId: 'd1', count: 2 },
      { doctorId: 'd2', count: 1 },
    ]);
  });

  it('narrows the paginated items table to one doctor via doctorId, without narrowing the breakdown chart', async () => {
    const reservationRepository = new FakeReservationRepository();
    const useCase = new GetReservationByDoctorReportUseCase(reservationRepository);

    await seedReservation(reservationRepository, { reservationNo: 'RSV-1', patientId: 'p1', doctorId: 'd1', reservationDate: IN_RANGE });
    await seedReservation(reservationRepository, { reservationNo: 'RSV-2', patientId: 'p2', doctorId: 'd2', reservationDate: IN_RANGE });

    const result = await useCase.execute({
      dateFrom: '2026-03-01',
      dateTo: '2026-03-31',
      doctorId: 'd1',
      page: 1,
      limit: 20,
      sort: 'createdAt',
      order: 'desc',
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].doctorId).toBe('d1');
    // The comparison chart still reflects both doctors, unaffected by the table filter.
    expect(result.summary.breakdown).toEqual(
      expect.arrayContaining([
        { doctorId: 'd1', count: 1 },
        { doctorId: 'd2', count: 1 },
      ]),
    );
  });

  it('rejects dateFrom after dateTo', async () => {
    const reservationRepository = new FakeReservationRepository();
    const useCase = new GetReservationByDoctorReportUseCase(reservationRepository);

    await expect(
      useCase.execute({ dateFrom: '2026-03-31', dateTo: '2026-03-01', page: 1, limit: 20, sort: 'createdAt', order: 'desc' }),
    ).rejects.toBeInstanceOf(ReportFilterInvalidException);
  });
});
