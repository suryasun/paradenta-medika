import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreatePatientEmergencyContactRequestDto {
  @IsString() @MinLength(1) @MaxLength(150) contactName!: string;
  @IsString() @MinLength(1) @MaxLength(100) relationship!: string;
  @IsString() @MinLength(1) @MaxLength(30) phone!: string;
  @IsOptional() @IsString() address?: string;
}

export class UpdatePatientEmergencyContactRequestDto {
  @IsOptional() @IsString() @MinLength(1) @MaxLength(150) contactName?: string;
  @IsOptional() @IsString() @MinLength(1) @MaxLength(100) relationship?: string;
  @IsOptional() @IsString() @MinLength(1) @MaxLength(30) phone?: string;
  @IsOptional() @IsString() address?: string;
}
