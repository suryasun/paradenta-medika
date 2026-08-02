import { IsString, MinLength } from 'class-validator';

export class ForgotPasswordRequestDto {
  @IsString()
  @MinLength(1)
  identifier!: string;
}
