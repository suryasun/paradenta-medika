jest.mock('../../../../shared/infrastructure/prisma', () => ({
  prisma: {
    auditLog: {
      create: jest.fn(),
    },
  },
}));

import { prisma } from '../../../../shared/infrastructure/prisma';
import { AuditService } from './AuditService';

describe('AuditService', () => {
  const createMock = prisma.auditLog.create as jest.Mock;

  beforeEach(() => {
    createMock.mockReset();
  });

  it('persists a correctly-shaped audit_logs row with old/new value redacted of passwords', async () => {
    createMock.mockResolvedValue({});
    const service = new AuditService();

    await service.record(
      'Patient',
      'patient-123',
      'UPDATE',
      { patientName: 'Old Name', passwordHash: 'should-not-appear' },
      { patientName: 'New Name' },
      { userId: 'user-1', ipAddress: '127.0.0.1', correlationId: 'corr-1' },
    );

    expect(createMock).toHaveBeenCalledTimes(1);
    const call = createMock.mock.calls[0][0];
    expect(call.data.entity).toBe('Patient');
    expect(call.data.entityId).toBe('patient-123');
    expect(call.data.action).toBe('UPDATE');
    expect(call.data.userId).toBe('user-1');
    expect(call.data.ipAddress).toBe('127.0.0.1');
    expect(call.data.correlationId).toBe('corr-1');
    expect(call.data.oldValue).not.toContain('should-not-appear');
    expect(JSON.parse(call.data.oldValue)).toEqual({ patientName: 'Old Name' });
    expect(JSON.parse(call.data.newValue)).toEqual({ patientName: 'New Name' });
  });

  it('does not throw when the audit write itself fails, so the caller transaction is unaffected', async () => {
    createMock.mockRejectedValue(new Error('DB unavailable'));
    const service = new AuditService();

    await expect(
      service.record('Patient', 'patient-123', 'CREATE', null, { patientName: 'New Name' }, {}),
    ).resolves.toBeUndefined();
  });
});
