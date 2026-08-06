import { IsBoolean, IsEmail, IsOptional, IsString, IsUUID, Matches, MaxLength, MinLength } from 'class-validator';

// MRN scheme hardening: 2-5 uppercase letters/digits, matching the short
// prefix MedicalRecordNumberGenerator prepends to every MRN it generates
// for this branch (e.g. "KM" -> KM260802001).
const MRN_PREFIX_PATTERN = /^[A-Z0-9]{2,5}$/;

export class CreateBranchRequestDto {
  @IsUUID('4') clinicId!: string;
  @IsString() @MinLength(2) @MaxLength(20) branchCode!: string;
  @IsString() @MinLength(2) @MaxLength(150) branchName!: string;
  @IsString() @MaxLength(30) phone!: string;
  @IsEmail() @MaxLength(100) email!: string;
  @IsString() @MinLength(1) address!: string;
  @IsOptional() @IsString() @MaxLength(50) timezone?: string;
  @IsOptional() @IsString() @Matches(MRN_PREFIX_PATTERN, { message: 'mrnPrefix must be 2-5 uppercase letters/digits' }) mrnPrefix?: string;
}

export class UpdateBranchRequestDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(150) branchName?: string;
  @IsOptional() @IsString() @MaxLength(30) phone?: string;
  @IsOptional() @IsEmail() @MaxLength(100) email?: string;
  @IsOptional() @IsString() @MinLength(1) address?: string;
  @IsOptional() @IsString() @MaxLength(50) timezone?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsString() @Matches(MRN_PREFIX_PATTERN, { message: 'mrnPrefix must be 2-5 uppercase letters/digits' }) mrnPrefix?: string;
}
