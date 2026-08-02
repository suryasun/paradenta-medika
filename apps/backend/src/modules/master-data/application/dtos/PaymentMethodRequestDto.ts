import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreatePaymentMethodRequestDto {
  @IsString() @MinLength(2) @MaxLength(30) methodCode!: string;
  @IsString() @MinLength(2) @MaxLength(100) methodName!: string;
  @IsOptional() @IsBoolean() isCash?: boolean;
}

export class UpdatePaymentMethodRequestDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(100) methodName?: string;
  @IsOptional() @IsBoolean() isCash?: boolean;
  @IsOptional() @IsBoolean() isActive?: boolean;
}
