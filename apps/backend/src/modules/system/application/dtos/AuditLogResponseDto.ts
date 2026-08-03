export interface AuditLogResponseDto {
  id: string;
  entity: string;
  entityId: string;
  action: string;
  oldValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
  userId: string | null;
  ipAddress: string | null;
  correlationId: string | null;
  createdAt: string;
}
