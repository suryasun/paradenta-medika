import { ArrayUnique, IsArray, IsInt, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateMenuRequestDto {
  @IsString() @MinLength(1) @MaxLength(100) menuKey!: string;
  @IsString() @MinLength(1) @MaxLength(150) label!: string;
  @IsOptional() @IsString() @MaxLength(200) route?: string;
  @IsOptional() @IsUUID('4') parentId?: string;
  @IsOptional() @IsString() @MaxLength(50) icon?: string;
  @IsOptional() @IsInt() order?: number;
}

export class UpdateMenuPermissionsRequestDto {
  @IsArray() @ArrayUnique() @IsUUID('4', { each: true }) permissionIds!: string[];
}
