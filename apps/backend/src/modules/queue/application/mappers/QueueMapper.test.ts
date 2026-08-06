import { Queue } from '@prisma/client';
import { toQueueResponse } from './QueueMapper';

function buildQueue(overrides: Partial<Queue> = {}): Queue {
  return {
    id: 'q1',
    reservationId: null,
    branchId: 'b1',
    patientId: 'p1',
    queueNumber: 'A001',
    queuePrefix: 'A',
    queueDate: new Date('2026-08-06'),
    queueType: 'WALK_IN',
    doctorId: 'd1',
    room: null,
    priority: 'NORMAL',
    status: 'WAITING',
    currentPosition: null,
    estimatedCallTime: null,
    checkedInAt: new Date('2026-08-06T08:00:00Z'),
    calledAt: null,
    startedAt: null,
    completedAt: null,
    cancelledAt: null,
    notes: null,
    createdAt: new Date(),
    createdBy: null,
    updatedAt: new Date(),
    updatedBy: null,
    deletedAt: null,
    deletedBy: null,
    ...overrides,
  } as Queue;
}

// docs/06-tasks/task-313.md
describe('toQueueResponse', () => {
  it('populates patientMrn/patientFullName when a patient snapshot is joined', () => {
    const queue = { ...buildQueue(), patient: { medicalRecordNo: 'MRN001', patientName: 'Budi Santoso' } };

    const response = toQueueResponse(queue);

    expect(response.patientMrn).toBe('MRN001');
    expect(response.patientFullName).toBe('Budi Santoso');
  });

  it('returns null for both fields when no patient snapshot is joined', () => {
    const response = toQueueResponse(buildQueue());

    expect(response.patientMrn).toBeNull();
    expect(response.patientFullName).toBeNull();
  });

  // docs/06-tasks/task-319.md
  it('populates visitId when a Visit already exists for this queue', () => {
    const queue = { ...buildQueue(), visit: { id: 'visit-1' } };

    expect(toQueueResponse(queue).visitId).toBe('visit-1');
  });

  it('returns null visitId when no Visit exists yet for this queue', () => {
    expect(toQueueResponse(buildQueue()).visitId).toBeNull();
  });
});
