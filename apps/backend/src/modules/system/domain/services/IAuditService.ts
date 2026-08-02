/**
 * 'READ' added for docs/06-tasks/task-080.md: "Audit Trail entry required
 * for every download access (clinically/legally sensitive)" -- an access
 * event, not a data mutation, so it doesn't fit CREATE/UPDATE/DELETE.
 */
export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'READ';

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
