import { IsInt, IsOptional, IsString, IsUUID, MaxLength, Max, Min } from 'class-validator';

export class RecordToothConditionRequestDto {
  @IsInt() @Min(11) @Max(85) toothNumber!: number;

  @IsOptional() @IsString() @MaxLength(10) surface?: string;

  @IsUUID('4') toothConditionId!: string;

  @IsOptional() @IsString() @MaxLength(1000) note?: string;
}
