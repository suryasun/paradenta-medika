import { ArrayMinSize, IsArray, IsOptional, IsString, IsUUID } from 'class-validator';

export interface StockTransferItemEntryDto {
  itemId: string;
  quantity: number;
}

export class CreateStockTransferRequestDto {
  @IsUUID('4') sourceWarehouseId!: string;
  @IsUUID('4') destinationWarehouseId!: string;
  @IsOptional() @IsString() notes?: string;
  @IsArray() @ArrayMinSize(1) items!: StockTransferItemEntryDto[];
}
