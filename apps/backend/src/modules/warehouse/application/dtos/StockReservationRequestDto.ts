import { IsNumber, IsString, IsUUID, Min, MinLength } from 'class-validator';

export class CreateStockReservationRequestDto {
  @IsUUID('4') warehouseId!: string;
  @IsUUID('4') itemId!: string;
  @IsNumber() @Min(0.01) quantity!: number;
  @IsString() @MinLength(1) referenceType!: string;
  @IsString() @MinLength(1) referenceId!: string;
}
