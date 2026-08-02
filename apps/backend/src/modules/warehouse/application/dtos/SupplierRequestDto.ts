import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateSupplierRequestDto {
  @IsString() @MinLength(2) @MaxLength(30) code!: string;
  @IsString() @MinLength(2) @MaxLength(150) name!: string;
  @IsOptional() @IsString() @MaxLength(100) picName?: string;
  @IsOptional() @IsString() @MaxLength(30) phone?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() @MaxLength(50) taxNumber?: string;
}
