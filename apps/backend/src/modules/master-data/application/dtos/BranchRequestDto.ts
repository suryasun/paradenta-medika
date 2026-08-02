import { IsBoolean, IsEmail, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateBranchRequestDto {
  @IsUUID('4') clinicId!: string;
  @IsString() @MinLength(2) @MaxLength(20) branchCode!: string;
  @IsString() @MinLength(2) @MaxLength(150) branchName!: string;
  @IsString() @MaxLength(30) phone!: string;
  @IsEmail() @MaxLength(100) email!: string;
  @IsString() @MinLength(1) address!: string;
  @IsOptional() @IsString() @MaxLength(50) timezone?: string;
}

export class UpdateBranchRequestDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(150) branchName?: string;
  @IsOptional() @IsString() @MaxLength(30) phone?: string;
  @IsOptional() @IsEmail() @MaxLength(100) email?: string;
  @IsOptional() @IsString() @MinLength(1) address?: string;
  @IsOptional() @IsString() @MaxLength(50) timezone?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}
