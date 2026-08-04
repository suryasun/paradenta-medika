import { ListQueryDto } from '../../../../shared/http/ListQueryDto';
import { PagedResult } from '../../../../shared/http/pagination';
import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import { IMasterDataRepository } from '../../domain/repositories/IMasterDataRepository';
import { MasterDataNotFoundException } from '../../domain/exceptions/MasterDataExceptions';

export interface ActorContext {
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

export interface CrudUseCaseHooks<TCreate, TUpdate> {
  validateCreate?: (input: TCreate) => Promise<void>;
  validateUpdate?: (id: string, input: TUpdate) => Promise<void>;
  /** docs/06-tasks/task-224.md: fired after a successful create + audit record, e.g. to publish a domain event. Used only by Branch's wiring; every other entity using this factory leaves it unset. */
  onCreated?: (entity: unknown, actor: ActorContext) => Promise<void>;
}

export interface CrudUseCases<T, TCreate, TUpdate> {
  create(input: TCreate, actor: ActorContext): Promise<T>;
  list(query: ListQueryDto): Promise<PagedResult<T>>;
  get(id: string): Promise<T>;
  update(id: string, input: TUpdate, actor: ActorContext): Promise<T>;
}

function toAuditContext(actor: ActorContext): AuditContext {
  return { userId: actor.actorUserId, ipAddress: actor.ipAddress, correlationId: actor.correlationId };
}

/**
 * Every Master Data entity in Phase 1 (task-021..026) follows the identical
 * Create/List/Get/Update + uniqueness/reference-validation + audit shape;
 * this factory implements that shape once, parameterized per entity by its
 * repository and reference-validation hooks (e.g. Branch validating its
 * Clinic FK, Treatment validating its Category FK).
 */
export function buildCrudUseCases<T extends { id: string }, TCreate, TUpdate>(
  entityName: string,
  repository: IMasterDataRepository<T, TCreate, TUpdate>,
  auditService: IAuditService,
  hooks: CrudUseCaseHooks<TCreate, TUpdate> = {},
): CrudUseCases<T, TCreate, TUpdate> {
  return {
    async create(input, actor) {
      if (hooks.validateCreate) {
        await hooks.validateCreate(input);
      }
      const entity = await repository.create(input);
      await auditService.record(
        entityName,
        entity.id,
        'CREATE',
        null,
        input as unknown as Record<string, unknown>,
        toAuditContext(actor),
      );
      if (hooks.onCreated) {
        await hooks.onCreated(entity, actor);
      }
      return entity;
    },

    async list(query) {
      return repository.list(query);
    },

    async get(id) {
      const entity = await repository.findById(id);
      if (!entity) {
        throw new MasterDataNotFoundException(entityName);
      }
      return entity;
    },

    async update(id, input, actor) {
      const existing = await repository.findById(id);
      if (!existing) {
        throw new MasterDataNotFoundException(entityName);
      }
      if (hooks.validateUpdate) {
        await hooks.validateUpdate(id, input);
      }
      const updated = await repository.update(id, input);
      await auditService.record(
        entityName,
        id,
        'UPDATE',
        existing as unknown as Record<string, unknown>,
        input as unknown as Record<string, unknown>,
        toAuditContext(actor),
      );
      return updated;
    },
  };
}
