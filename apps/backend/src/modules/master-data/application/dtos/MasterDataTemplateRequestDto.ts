import { ArrayMinSize, IsArray, IsNotEmptyObject, IsObject, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateMasterDataTemplateRequestDto {
  @IsString() @MinLength(2) @MaxLength(50) entityType!: string;
  @IsObject() @IsNotEmptyObject() templatePayload!: Record<string, unknown>;
  @IsUUID('4') ownerClinicId!: string;
}

export class UpdateMasterDataTemplateRequestDto {
  @IsOptional() @IsObject() @IsNotEmptyObject() templatePayload?: Record<string, unknown>;
}

export class PushMasterDataTemplateRequestDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  branchIds!: string[];
}
