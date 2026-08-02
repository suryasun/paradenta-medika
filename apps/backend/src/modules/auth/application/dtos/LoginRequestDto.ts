import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

/**
 * docs/06-tasks/task-007.md Backend Scope: "accept username-or-email +
 * password". Exact field names are NOT DEFINED IN SAD (docs/04-ai-contract/
 * 04-api-contract.md API-054); `identifier`/`password` chosen as the
 * clearest camelCase (API-011) names for the documented concept.
 */
export class LoginRequestDto {
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  identifier!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(64)
  password!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  deviceName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  deviceType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  deviceId?: string;
}
