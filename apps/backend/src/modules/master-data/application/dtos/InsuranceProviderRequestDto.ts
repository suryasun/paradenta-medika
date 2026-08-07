import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateInsuranceProviderRequestDto {
  @IsString() @MinLength(2) @MaxLength(150) providerName!: string;
}

export class UpdateInsuranceProviderRequestDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(150) providerName?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}
