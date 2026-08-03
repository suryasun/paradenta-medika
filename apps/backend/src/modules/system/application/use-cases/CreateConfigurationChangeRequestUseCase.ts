import { ConfigurationChangeRequest } from '@prisma/client';
import { IConfigurationChangeRequestRepository } from '../../domain/repositories/IConfigurationChangeRequestRepository';
import { validateParameterValue } from '../services/SystemParameterValueValidator';
import { AuditContext, IAuditService } from '../../domain/services/IAuditService';
import { ConfigVersionConflictException } from '../../domain/exceptions/SystemExceptions';
import { stringifyParameterValue } from './CreateParameterUseCase';
import { CreateChangeRequestDto } from '../dtos/ConfigurationChangeRequestDto';

/**
 * docs/06-tasks/task-202.md, UC-SYS-003 step 2-3 ("High risk?" branch):
 * proposes a new value; activation only happens on a separate,
 * independent Approve call (task-203) -- this use case never writes a
 * SystemParameter row itself.
 */
export class CreateConfigurationChangeRequestUseCase {
  constructor(
    private readonly changeRequestRepository: IConfigurationChangeRequestRepository,
    private readonly auditService: IAuditService,
  ) {}

  async execute(parameterKey: string, input: CreateChangeRequestDto, actorUserId: string, auditContext: AuditContext): Promise<ConfigurationChangeRequest> {
    const stringValue = stringifyParameterValue(input.valueType, input.value);
    validateParameterValue(input.valueType as never, stringValue);

    const scopeType = input.scope?.type?.toUpperCase() ?? 'GLOBAL';
    const scopeId = input.scope?.id;

    const { items: pending } = await this.changeRequestRepository.list(
      { page: 1, limit: 1, sort: 'createdAt', order: 'desc' },
      { parameterKey, scopeType, scopeId: scopeId ?? null, status: 'PENDING' },
    );
    if (pending.length > 0) {
      // docs/06-tasks/task-202.md AC: SYS_CONFIG_VERSION_CONFLICT when an
      // effective-version conflict exists -- two in-flight proposals for the
      // same parameter/scope would race on which becomes the next version.
      throw new ConfigVersionConflictException();
    }

    const request = await this.changeRequestRepository.create({
      parameterKey,
      scopeType,
      scopeId,
      proposedValueType: input.valueType as never,
      proposedValue: stringValue,
      reason: input.reason,
      requestedBy: actorUserId,
    });

    await this.auditService.record('ConfigurationChangeRequest', request.id, 'CREATE', null, { parameterKey, proposedValue: stringValue }, auditContext);

    return request;
  }
}
