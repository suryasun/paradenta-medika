import { SystemParameter } from '@prisma/client';
import { ISystemParameterRepository } from '../../domain/repositories/ISystemParameterRepository';
import { validateParameterValue } from '../services/SystemParameterValueValidator';
import { AuditContext, IAuditService } from '../../domain/services/IAuditService';
import { CreateSystemParameterRequestDto } from '../dtos/SystemParameterRequestDto';

/** Converts the request DTO's raw JSON `value` into the string representation `SystemParameter.value` stores, matching how `valueType` interprets it. */
export function stringifyParameterValue(valueType: string, value: unknown): string {
  if (valueType === 'JSON') {
    return JSON.stringify(value);
  }
  return String(value);
}

/** docs/06-tasks/task-200.md AC: "Raw secret values are rejected; only secret references accepted. Schema validation matches the parameter's typed schema." */
export class CreateParameterUseCase {
  constructor(
    private readonly systemParameterRepository: ISystemParameterRepository,
    private readonly auditService: IAuditService,
  ) {}

  async execute(input: CreateSystemParameterRequestDto, actorUserId: string, auditContext: AuditContext): Promise<SystemParameter> {
    const stringValue = stringifyParameterValue(input.valueType, input.value);
    validateParameterValue(input.valueType as never, stringValue);

    const parameter = await this.systemParameterRepository.create({
      key: input.key,
      scopeType: input.scope?.type?.toUpperCase() ?? 'GLOBAL',
      scopeId: input.scope?.id,
      valueType: input.valueType as never,
      value: stringValue,
      isHighRisk: input.isHighRisk,
      effectiveFrom: input.effectiveFrom ? new Date(input.effectiveFrom) : undefined,
      changeReason: input.reason,
      createdBy: actorUserId,
    });

    await this.auditService.record('SystemParameter', parameter.id, 'CREATE', null, { key: parameter.key, version: parameter.version }, auditContext);

    return parameter;
  }
}
