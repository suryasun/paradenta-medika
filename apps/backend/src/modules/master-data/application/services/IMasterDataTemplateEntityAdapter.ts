/**
 * Phase 4 hardening (Centralized Master Data Template real-entity wiring,
 * docs/06-tasks/task-222.md/task-223.md): before this, pushing a template
 * only wrote to MasterDataTemplateBranchLink's JSON snapshot/current
 * payload -- never to the real Treatment/PaymentMethod/ToothCondition
 * table the template describes. An adapter maps one `entityType` string to
 * the concrete repository operations needed to actually create/update the
 * branch-specific override row (see Treatment's Prisma model comment for
 * the nullable-branchId design those three tables now have) and to read
 * that row's current live values back for drift comparison.
 *
 * `entityType` values outside the registry (masterDataTemplateEntityAdapters.ts)
 * keep behaving exactly as before this change: JSON-only, no real write --
 * this is additive, not a breaking change to the push/drift contract.
 */
export interface AppliedEntityResult {
  created: boolean;
  entityId: string;
}

export interface IMasterDataTemplateEntityAdapter {
  /** Creates the branch-specific override row if absent, or updates it if already present for this exact branch. Never touches the global (branchId: null) row. */
  applyToEntity(branchId: string, payload: Record<string, unknown>): Promise<AppliedEntityResult>;
  /** The entity's current live field values, in the same shape as templatePayload, for drift comparison. */
  readEntitySnapshot(branchId: string, entityId: string): Promise<Record<string, unknown>>;
}
