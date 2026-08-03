import { ConfigurationChangeRequest } from '@prisma/client';
import { IConfigurationChangeRequestRepository } from '../../domain/repositories/IConfigurationChangeRequestRepository';
import { ISystemParameterRepository } from '../../domain/repositories/ISystemParameterRepository';
import { AuditContext, IAuditService } from '../../domain/services/IAuditService';
import { ConfigVersionConflictException, RollbackReasonRequiredException, SystemParameterNotFoundException } from '../../domain/exceptions/SystemExceptions';
import { RollbackParameterDto } from '../dtos/ConfigurationChangeRequestDto';

/**
 * docs/06-tasks/task-204.md, UC-SYS-003 step 5: "Rollback creates a new
 * version using a previously validated value... Same approval gate as a
 * normal high-risk change" -- this creates a PENDING
 * ConfigurationChangeRequest (isRollback=true) from the target historical
 * version's own value, exactly like a normal proposal (task-202); it does
 * NOT activate a new SystemParameter version itself -- that still only
 * happens through the same independent Approve endpoint (task-203).
 */
export class RollbackParameterUseCase {
  constructor(
    private readonly systemParameterRepository: ISystemParameterRepository,
    private readonly changeRequestRepository: IConfigurationChangeRequestRepository,
    private readonly auditService: IAuditService,
  ) {}

  async execute(parameterKey: string, input: RollbackParameterDto, actorUserId: string, auditContext: AuditContext): Promise<ConfigurationChangeRequest> {
    if (!input.reason || input.reason.trim().length === 0) {
      throw new RollbackReasonRequiredException();
    }

    const scopeType = input.scope?.type?.toUpperCase() ?? 'GLOBAL';
    const scopeId = input.scope?.id;

    const target = await this.systemParameterRepository.findByKeyAndVersion(parameterKey, scopeType, scopeId, input.version);
    if (!target) {
      throw new SystemParameterNotFoundException();
    }

    const { items: pending } = await this.changeRequestRepository.list(
      { page: 1, limit: 1, sort: 'createdAt', order: 'desc' },
      { parameterKey, scopeType, scopeId: scopeId ?? null, status: 'PENDING' },
    );
    if (pending.length > 0) {
      throw new ConfigVersionConflictException();
    }

    const request = await this.changeRequestRepository.create({
      parameterKey,
      scopeType,
      scopeId,
      proposedValueType: target.valueType,
      proposedValue: target.value,
      reason: input.reason,
      isRollback: true,
      rollbackFromVersion: target.version,
      requestedBy: actorUserId,
    });

    await this.auditService.record(
      'ConfigurationChangeRequest',
      request.id,
      'CREATE',
      null,
      { parameterKey, isRollback: true, rollbackFromVersion: target.version, reason: input.reason },
      auditContext,
    );

    return request;
  }
}
