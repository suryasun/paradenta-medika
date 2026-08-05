import { IsBoolean, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreatePatientAddressRequestDto {
  @IsUUID('4') provinceId!: string;
  @IsUUID('4') regencyId!: string;
  @IsUUID('4') districtId!: string;
  @IsUUID('4') villageId!: string;
  @IsString() @MinLength(1) addressLine!: string;
  @IsOptional() @IsString() @MaxLength(10) postalCode?: string;
  @IsOptional() @IsBoolean() isPrimary?: boolean;
}

export class UpdatePatientAddressRequestDto {
  @IsOptional() @IsUUID('4') provinceId?: string;
  @IsOptional() @IsUUID('4') regencyId?: string;
  @IsOptional() @IsUUID('4') districtId?: string;
  @IsOptional() @IsUUID('4') villageId?: string;
  @IsOptional() @IsString() @MinLength(1) addressLine?: string;
  @IsOptional() @IsString() @MaxLength(10) postalCode?: string;
  @IsOptional() @IsBoolean() isPrimary?: boolean;
}

/** Body accepted on DELETE (task-286's own required-when-deleting-the-primary rule). */
export class DeletePatientAddressRequestDto {
  @IsOptional() @IsUUID('4') newPrimaryAddressId?: string;
}
