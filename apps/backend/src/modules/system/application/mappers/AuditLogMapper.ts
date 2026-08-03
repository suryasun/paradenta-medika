import { AuditLog } from '@prisma/client';
import { AuditLogResponseDto } from '../dtos/AuditLogResponseDto';

function parseJson(value: string | null): Record<string, unknown> | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function toAuditLogResponseDto(log: AuditLog): AuditLogResponseDto {
  return {
    id: log.id,
    entity: log.entity,
    entityId: log.entityId,
    action: log.action,
    oldValue: parseJson(log.oldValue),
    newValue: parseJson(log.newValue),
    userId: log.userId,
    ipAddress: log.ipAddress,
    correlationId: log.correlationId,
    createdAt: log.createdAt.toISOString(),
  };
}
