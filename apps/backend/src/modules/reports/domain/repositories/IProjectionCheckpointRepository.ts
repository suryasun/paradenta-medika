/**
 * docs/03-sad/20-module-report.md Section 2.4/5.4: idempotent inbox +
 * checkpoint, consolidated into one claim (see schema.prisma's
 * ReportProjectionCheckpoint doc comment for why). `claim` atomically
 * records (consumerName, sourceKey) and returns false if it was already
 * processed -- callers must skip applying the projection when it returns
 * false, satisfying TC-RPT-001/002 (no double count on duplicate consume).
 */
export interface IProjectionCheckpointRepository {
  claim(consumerName: string, sourceKey: string): Promise<boolean>;
}
