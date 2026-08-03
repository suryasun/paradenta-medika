import { SystemParameterValueType } from '@prisma/client';
import { ConfigSchemaInvalidException, SecretValueForbiddenException } from '../../domain/exceptions/SystemExceptions';

const SECRET_REFERENCE_PREFIXES = ['ref:', 'vault:'];

/**
 * docs/03-sad/21-module-system.md Section 3.4 rule 2/3: typed value
 * validation, and "direct clear-text secret value ... is rejected."
 * Used identically by parameter creation (task-200) and change-request
 * proposal (task-202) so the two can never diverge on what's valid.
 */
export function validateParameterValue(valueType: SystemParameterValueType, value: string): void {
  if (valueType === 'SECRET_REF') {
    if (!SECRET_REFERENCE_PREFIXES.some((prefix) => value.startsWith(prefix))) {
      throw new SecretValueForbiddenException();
    }
    return;
  }

  switch (valueType) {
    case 'INTEGER':
      if (!/^-?\d+$/.test(value)) {
        throw new ConfigSchemaInvalidException('expected an integer');
      }
      break;
    case 'DECIMAL':
      if (Number.isNaN(Number(value))) {
        throw new ConfigSchemaInvalidException('expected a decimal number');
      }
      break;
    case 'BOOLEAN':
      if (value !== 'true' && value !== 'false') {
        throw new ConfigSchemaInvalidException('expected "true" or "false"');
      }
      break;
    case 'DATE':
      if (Number.isNaN(new Date(value).getTime())) {
        throw new ConfigSchemaInvalidException('expected a valid ISO-8601 date');
      }
      break;
    case 'DURATION':
      if (!/^\d+$/.test(value)) {
        throw new ConfigSchemaInvalidException('expected a duration in whole seconds');
      }
      break;
    case 'JSON':
      try {
        JSON.parse(value);
      } catch {
        throw new ConfigSchemaInvalidException('expected valid JSON');
      }
      break;
    case 'STRING':
    case 'ENUM':
      if (value.length === 0) {
        throw new ConfigSchemaInvalidException('expected a non-empty value');
      }
      break;
    default:
      break;
  }
}
