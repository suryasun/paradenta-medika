import { IsString, MaxLength, MinLength } from 'class-validator';

export class ChangePasswordRequestDto {
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  currentPassword!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(64)
  newPassword!: string;
}
