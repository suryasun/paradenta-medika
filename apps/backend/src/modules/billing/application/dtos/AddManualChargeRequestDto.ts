import { IsNumber, IsString, Min, MinLength } from 'class-validator';

export class AddManualChargeRequestDto {
  @IsString() @MinLength(1) itemName!: string;
  @IsNumber() @Min(0.01) amount!: number;
  @IsString() @MinLength(1) reason!: string;
}
