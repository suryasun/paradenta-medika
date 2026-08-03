import { IsDefined, IsIn, IsInt, IsObject, IsOptional, IsString, MinLength } from 'class-validator';

const VALUE_TYPES = ['STRING', 'INTEGER', 'DECIMAL', 'BOOLEAN', 'ENUM', 'DATE', 'DURATION', 'JSON', 'SECRET_REF'] as const;

export class CreateChangeRequestDto {
  @IsOptional() @IsObject() scope?: { type?: string; id?: string };
  @IsIn(VALUE_TYPES) valueType!: (typeof VALUE_TYPES)[number];
  @IsDefined() value: unknown;
  @IsOptional() @IsString() reason?: string;
}

export class RollbackParameterDto {
  @IsOptional() @IsObject() scope?: { type?: string; id?: string };
  @IsInt() version!: number;
  @IsString() @MinLength(1) reason!: string;
}
