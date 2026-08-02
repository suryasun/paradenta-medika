import { IsString, MaxLength, MinLength } from 'class-validator';

export class ResetPasswordRequestDto {
  @IsString()
  @MinLength(1)
  token!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(64)
  newPassword!: string;
}
