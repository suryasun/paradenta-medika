export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE';

export interface AuditContext {
  userId?: string;
  ipAddress?: string;
  correlationId?: string;
}

/**
 * Application-facing contract for the Audit Trail service
 * (docs/06-tasks/task-006.md). Any module's Use Case may depend on this
 * interface without depending on the Infrastructure implementation, per
 * docs/04-ai-contract/02-architecture-contract.md CLEAN-002/CLEAN-003.
 */
export interface IAuditService {
  record(
    entity: string,
    entityId: string,
    action: AuditAction,
    oldValue: Record<string, unknown> | null,
    newValue: Record<string, unknown> | null,
    context: AuditContext,
  ): Promise<void>;
}
