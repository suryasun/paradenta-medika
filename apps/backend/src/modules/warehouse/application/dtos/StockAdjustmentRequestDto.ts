import { ArrayMinSize, IsArray, IsEnum, IsString, MaxLength, MinLength, IsUUID } from 'class-validator';

export enum StockAdjustmentDirectionDto {
  IN = 'IN',
  OUT = 'OUT',
}

export interface StockAdjustmentItemEntryDto {
  itemId: string;
  quantity: number;
}

/** docs/06-tasks/task-122.md AC: "Draft created with mandatory reason field." */
export class CreateStockAdjustmentRequestDto {
  @IsUUID('4') warehouseId!: string;
  @IsEnum(StockAdjustmentDirectionDto) direction!: StockAdjustmentDirectionDto;
  @IsString() @MinLength(1) @MaxLength(50) reasonCode!: string;
  @IsArray() @ArrayMinSize(1) items!: StockAdjustmentItemEntryDto[];
}
