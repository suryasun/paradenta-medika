import { IsBoolean, IsDateString, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

const RISK_CLASSES = ['standard', 'critical'] as const;

export class CreateFeatureFlagRequestDto {
  @IsString() @MinLength(1) @MaxLength(100) flagKey!: string;
  @IsString() @MinLength(1) @MaxLength(50) ownerModule!: string;
  @IsOptional() @IsString() @MaxLength(200) targetScope?: string;
  @IsOptional() @IsBoolean() enabled?: boolean;
  @IsOptional() @IsIn(RISK_CLASSES) riskClass?: (typeof RISK_CLASSES)[number];
  @IsOptional() @IsDateString() effectiveFrom?: string;
  @IsOptional() @IsDateString() effectiveUntil?: string;
  @IsOptional() @IsDateString() reviewDate?: string;
  @IsOptional() @IsString() description?: string;
}

export class UpdateFeatureFlagRequestDto {
  @IsOptional() @IsString() @MaxLength(200) targetScope?: string;
  @IsOptional() @IsBoolean() enabled?: boolean;
  @IsOptional() @IsDateString() effectiveFrom?: string;
  @IsOptional() @IsDateString() effectiveUntil?: string;
  @IsOptional() @IsDateString() reviewDate?: string;
  @IsOptional() @IsString() description?: string;
}
