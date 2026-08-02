import { prisma } from '../../../../shared/infrastructure/prisma';
import { logger } from '../../../../shared/logging/logger';
import { AuditAction, AuditContext, IAuditService } from '../../domain/services/IAuditService';

/**
 * Fields never persisted in old_value/new_value per docs/06-tasks/task-006.md
 * Security Impact and docs/04-ai-contract/09-security-contract.md SEC-102.
 */
const REDACTED_FIELDS = ['password', 'passwordHash', 'password_hash', 'token', 'refreshToken', 'refresh_token'];

function redact(value: Record<string, unknown> | null): Record<string, unknown> | null {
  if (!value) {
    return value;
  }
  const clone: Record<string, unknown> = { ...value };
  for (const field of REDACTED_FIELDS) {
    if (field in clone) {
      delete clone[field];
    }
  }
  return clone;
}

/**
 * Infrastructure-layer Audit Trail service (docs/06-tasks/task-006.md).
 * Audit writes MUST NOT block or fail the primary business transaction
 * (docs/03-sad/03-clean-architecture.md Section 37.5): failures are logged
 * and swallowed rather than rethrown.
 */
export class AuditService implements IAuditService {
  async record(
    entity: string,
    entityId: string,
    action: AuditAction,
    oldValue: Record<string, unknown> | null,
    newValue: Record<string, unknown> | null,
    context: AuditContext,
  ): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          entity,
          entityId,
          action,
          oldValue: oldValue ? JSON.stringify(redact(oldValue)) : null,
          newValue: newValue ? JSON.stringify(redact(newValue)) : null,
          userId: context.userId,
          ipAddress: context.ipAddress,
          correlationId: context.correlationId,
        },
      });
    } catch (error) {
      logger.error('Audit write failed; business transaction continues', {
        module: 'audit-service',
        entity,
        entityId,
        action,
        correlationId: context.correlationId,
        rawMessage: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
