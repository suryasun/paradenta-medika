import { IsString, MinLength } from 'class-validator';

export class CancelInvoiceRequestDto {
  @IsString() @MinLength(1) reason!: string;
}
