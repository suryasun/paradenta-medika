import { IsBoolean, IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateClinicRequestDto {
  @IsString() @MinLength(2) @MaxLength(20) clinicCode!: string;
  @IsString() @MinLength(2) @MaxLength(150) clinicName!: string;
  @IsString() @MinLength(2) @MaxLength(200) legalName!: string;
  @IsString() @MinLength(1) @MaxLength(50) taxNumber!: string;
  @IsOptional() @IsString() @MaxLength(150) ownerName?: string;
  @IsString() @MaxLength(30) phone!: string;
  @IsEmail() @MaxLength(100) email!: string;
  @IsString() @MinLength(1) address!: string;
}

export class UpdateClinicRequestDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(150) clinicName?: string;
  @IsOptional() @IsString() @MinLength(2) @MaxLength(200) legalName?: string;
  @IsOptional() @IsString() @MinLength(1) @MaxLength(50) taxNumber?: string;
  @IsOptional() @IsString() @MaxLength(150) ownerName?: string;
  @IsOptional() @IsString() @MaxLength(30) phone?: string;
  @IsOptional() @IsEmail() @MaxLength(100) email?: string;
  @IsOptional() @IsString() @MinLength(1) address?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}
