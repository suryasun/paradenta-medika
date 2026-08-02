import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateRoleRequestDto {
  @IsString()
  @MinLength(2)
  @MaxLength(30)
  roleCode!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  roleName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}
