import { Reservation } from '@prisma/client';
import { toReservationResponse } from './ReservationMapper';
import { ReservationWithOptionalPatient } from '../../domain/repositories/IReservationRepository';

const BASE: Reservation = {
  id: 'r1',
  reservationNo: 'RSV-1',
  patientId: 'p1',
  doctorId: 'd1',
  branchId: 'b1',
  scheduleId: null,
  reservationDate: new Date('2026-08-06T00:00:00.000Z'),
  reservationTime: new Date('1970-01-01T09:00:00.000Z'),
  reservationType: 'APPOINTMENT',
  complaint: null,
  notes: null,
  status: 'BOOKED',
  source: 'PHONE',
  checkedInAt: null,
  cancelledReason: null,
  cancelledAt: null,
  createdAt: new Date(),
  createdBy: null,
  updatedAt: new Date(),
  updatedBy: null,
  deletedAt: null,
  deletedBy: null,
  treatmentPlanItemId: null,
  patientTypeAtBooking: 'NEW',
} as Reservation;

// docs/06-tasks/task-296.md (Reservation Module Addendum #2, R1)
describe('toReservationResponse patient snapshot (R1)', () => {
  it('populates patientMrn/patientFullName when the row carries a joined patient snapshot', () => {
    const row: ReservationWithOptionalPatient = { ...BASE, patient: { medicalRecordNo: 'MRN000001', patientName: 'Jane Doe' } };

    const result = toReservationResponse(row);

    expect(result.patientMrn).toBe('MRN000001');
    expect(result.patientFullName).toBe('Jane Doe');
  });

  it('returns null for both fields when no patient snapshot was joined (e.g. create/update/detail responses)', () => {
    const result = toReservationResponse(BASE);

    expect(result.patientMrn).toBeNull();
    expect(result.patientFullName).toBeNull();
  });
});
