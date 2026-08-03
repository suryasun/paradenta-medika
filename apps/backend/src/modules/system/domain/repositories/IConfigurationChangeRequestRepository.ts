import { ConfigChangeRequestStatus, ConfigurationChangeRequest, SystemParameterValueType } from '@prisma/client';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';
import { PagedResult } from '../../../../shared/http/pagination';

export interface CreateChangeRequestInput {
  parameterKey: string;
  scopeType: string;
  scopeId?: string;
  proposedValueType: SystemParameterValueType;
  proposedValue: string;
  reason?: string;
  isRollback?: boolean;
  rollbackFromVersion?: number;
  requestedBy: string;
}

export interface ChangeRequestListFilter {
  parameterKey?: string;
  scopeType?: string;
  /** `null` explicitly matches GLOBAL-scope (no scopeId) rows; `undefined` means "don't filter by scope at all." */
  scopeId?: string | null;
  status?: ConfigChangeRequestStatus;
}

/** Reject is not in this epic's task scope (task-200-206 asks only for Create/Approve); the status enum still models it for future use. */
export interface IConfigurationChangeRequestRepository {
  create(input: CreateChangeRequestInput): Promise<ConfigurationChangeRequest>;
  findById(id: string): Promise<ConfigurationChangeRequest | null>;
  list(query: ListQueryDto, filter: ChangeRequestListFilter): Promise<PagedResult<ConfigurationChangeRequest>>;
  markApproved(id: string, approvedBy: string, approvedAt: Date, resultingVersion: number): Promise<ConfigurationChangeRequest>;
}
