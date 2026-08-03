import { ConfigurationChangeRequest } from '@prisma/client';
import { IConfigurationChangeRequestRepository } from '../../domain/repositories/IConfigurationChangeRequestRepository';
import { ISystemParameterRepository } from '../../domain/repositories/ISystemParameterRepository';
import { IEventBus } from '../../../../shared/events/EventBus';
import { AuditContext, IAuditService } from '../../domain/services/IAuditService';
import {
  ConfigApprovalRequiredException,
  ConfigurationChangeRequestNotFoundException,
  ConfigurationChangeRequestNotPendingException,
} from '../../domain/exceptions/SystemExceptions';

/**
 * docs/06-tasks/task-203.md, UC-SYS-003 terminal "Activate" step:
 * independent approver required (approver != requester), writes an
 * immutable new SystemParameter version, publishes
 * system.configuration.changed.v1 exactly once.
 */
export class ApproveConfigurationChangeRequestUseCase {
  constructor(
    private readonly changeRequestRepository: IConfigurationChangeRequestRepository,
    private readonly systemParameterRepository: ISystemParameterRepository,
    private readonly auditService: IAuditService,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(requestId: string, actorUserId: string, auditContext: AuditContext): Promise<ConfigurationChangeRequest> {
    const request = await this.changeRequestRepository.findById(requestId);
    if (!request) {
      throw new ConfigurationChangeRequestNotFoundException();
    }
    if (request.status !== 'PENDING') {
      throw new ConfigurationChangeRequestNotPendingException();
    }
    if (request.requestedBy === actorUserId) {
      throw new ConfigApprovalRequiredException();
    }

    const activated = await this.systemParameterRepository.create({
      key: request.parameterKey,
      scopeType: request.scopeType,
      scopeId: request.scopeId ?? undefined,
      valueType: request.proposedValueType,
      value: request.proposedValue,
      changeReason: request.reason ?? undefined,
      createdBy: actorUserId,
    });

    const approved = await this.changeRequestRepository.markApproved(requestId, actorUserId, new Date(), activated.version);

    await this.auditService.record(
      'ConfigurationChangeRequest',
      requestId,
      'UPDATE',
      { status: 'PENDING' },
      { status: 'APPROVED', resultingVersion: activated.version },
      auditContext,
    );
    await this.eventBus.publish('system.configuration.changed.v1', {
      parameterKey: request.parameterKey,
      scopeType: request.scopeType,
      scopeId: request.scopeId,
      version: activated.version,
      isRollback: request.isRollback,
    });

    return approved;
  }
}
