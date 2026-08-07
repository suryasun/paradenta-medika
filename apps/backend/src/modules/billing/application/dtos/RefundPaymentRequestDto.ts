import { IsNumber, IsString, Min, MinLength } from 'class-validator';

export class RefundPaymentRequestDto {
  @IsNumber() @Min(0.01) amount!: number;
  @IsString() @MinLength(1) reason!: string;
}
