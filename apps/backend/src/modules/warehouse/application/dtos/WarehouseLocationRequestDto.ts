import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateWarehouseLocationRequestDto {
  @IsUUID('4') branchId!: string;
  @IsString() @MinLength(2) @MaxLength(30) code!: string;
  @IsString() @MinLength(2) @MaxLength(150) name!: string;
  @IsOptional() @IsString() @MaxLength(30) locationType?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsUUID('4') managerUserId?: string;
}
