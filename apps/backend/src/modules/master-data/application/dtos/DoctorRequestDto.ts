import { IsBoolean, IsDateString, IsEmail, IsNumber, IsOptional, IsString, IsUUID, MaxLength, Min, MinLength } from 'class-validator';

export class CreateDoctorRequestDto {
  @IsString() @MinLength(2) @MaxLength(30) doctorCode!: string;
  @IsUUID('4') userId!: string;
  @IsUUID('4') branchId!: string;
  @IsString() @MinLength(2) @MaxLength(150) fullName!: string;
  @IsOptional() @IsString() @MaxLength(50) sipNumber?: string;
  @IsOptional() @IsString() @MaxLength(50) strNumber?: string;
  @IsOptional() @IsString() @MaxLength(100) specialization?: string;
  @IsOptional() @IsNumber() @Min(0) consultationFee?: number;
  @IsOptional() @IsDateString() joinDate?: string;
  @IsOptional() @IsString() @MaxLength(30) phone?: string;
  @IsOptional() @IsEmail() @MaxLength(100) email?: string;
}

export class UpdateDoctorRequestDto {
  @IsOptional() @IsUUID('4') branchId?: string;
  @IsOptional() @IsString() @MinLength(2) @MaxLength(150) fullName?: string;
  @IsOptional() @IsString() @MaxLength(50) sipNumber?: string;
  @IsOptional() @IsString() @MaxLength(50) strNumber?: string;
  @IsOptional() @IsString() @MaxLength(100) specialization?: string;
  @IsOptional() @IsNumber() @Min(0) consultationFee?: number;
  @IsOptional() @IsDateString() joinDate?: string;
  @IsOptional() @IsString() @MaxLength(30) phone?: string;
  @IsOptional() @IsEmail() @MaxLength(100) email?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}
