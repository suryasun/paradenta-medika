/**
 * docs/04-ai-contract/07-module-contract.md MOD-018: "Master Data MUST
 * publish ClinicCreated, ClinicUpdated, BranchCreated, BranchUpdated...
 * when their documented changes occur." Phase 1's task-022 (Branch Entity)
 * never implemented this; task-224 (Phase 4, Epic BH) fulfills the
 * pre-existing mandate so BootstrapNewBranchUseCase has an event to
 * subscribe to.
 */
export const BRANCH_CREATED_EVENT = 'BranchCreated';

export interface BranchCreatedPayload {
  event: typeof BRANCH_CREATED_EVENT;
  branchId: string;
  clinicId: string;
  branchCode: string;
  occurredAt: string;
}
