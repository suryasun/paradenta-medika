import { SystemParameter, SystemParameterValueType } from '@prisma/client';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';
import { PagedResult } from '../../../../shared/http/pagination';

export interface CreateSystemParameterInput {
  key: string;
  scopeType: string;
  scopeId?: string;
  valueType: SystemParameterValueType;
  value: string;
  isHighRisk?: boolean;
  effectiveFrom?: Date;
  changeReason?: string;
  createdBy: string;
}

export interface SystemParameterListFilter {
  key?: string;
  scopeType?: string;
  scopeId?: string;
}

export interface ISystemParameterRepository {
  /** Inserts a new version: `version` = 1 + the highest existing version for this (key, scopeType, scopeId). */
  create(input: CreateSystemParameterInput): Promise<SystemParameter>;
  list(query: ListQueryDto, filter: SystemParameterListFilter): Promise<PagedResult<SystemParameter>>;
  /** The active (highest-version) row for a key/scope -- what the rest of the system actually reads. */
  findLatest(key: string, scopeType: string, scopeId?: string): Promise<SystemParameter | null>;
  findVersions(key: string, query: ListQueryDto): Promise<PagedResult<SystemParameter>>;
  findByKeyAndVersion(key: string, scopeType: string, scopeId: string | undefined, version: number): Promise<SystemParameter | null>;
  /** docs/06-tasks/task-213.md: the active (highest-version) row for every distinct key at this scope -- used to aggregate a branch's full effective configuration. */
  listLatestByScope(scopeType: string, scopeId?: string): Promise<SystemParameter[]>;
}
