import { IsBoolean, IsNumber, IsOptional, IsString, IsUUID, Min, MaxLength, MinLength } from 'class-validator';

/** docs/03-sad/18-module-warehouse.md Section 6.1 literal Create Item example. */
export class CreateItemRequestDto {
  @IsString() @MinLength(2) @MaxLength(30) code!: string;
  @IsString() @MinLength(2) @MaxLength(150) name!: string;
  @IsUUID('4') categoryId!: string;
  @IsUUID('4') unitId!: string;
  @IsNumber() @Min(0) minimumStock!: number;
  @IsOptional() @IsNumber() @Min(0) purchasePrice?: number;
  @IsOptional() @IsNumber() @Min(0) sellingPrice?: number;
  @IsBoolean() isConsumable!: boolean;
  @IsBoolean() isBatchTracked!: boolean;
  @IsBoolean() isExpiryTracked!: boolean;
}

export class UpdateItemRequestDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(150) name?: string;
  @IsOptional() @IsUUID('4') categoryId?: string;
  @IsOptional() @IsUUID('4') unitId?: string;
  @IsOptional() @IsNumber() @Min(0) minimumStock?: number;
  @IsOptional() @IsNumber() @Min(0) purchasePrice?: number;
  @IsOptional() @IsNumber() @Min(0) sellingPrice?: number;
  @IsOptional() @IsBoolean() isConsumable?: boolean;
  @IsOptional() @IsBoolean() isBatchTracked?: boolean;
  @IsOptional() @IsBoolean() isExpiryTracked?: boolean;
  @IsOptional() @IsBoolean() isActive?: boolean;
}
