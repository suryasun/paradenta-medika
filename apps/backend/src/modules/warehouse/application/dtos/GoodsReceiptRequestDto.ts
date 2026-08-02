import { ArrayMinSize, IsArray, IsDateString, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export interface GoodsReceiptItemEntryDto {
  purchaseOrderItemId: string;
  itemId: string;
  quantity: number;
  unitCost: number;
  batchNumber?: string;
  expiryDate?: string;
}

/** docs/03-sad/18-module-warehouse.md Section 6.2 literal Create Goods Receipt example. */
export class CreateGoodsReceiptRequestDto {
  @IsUUID('4') purchaseOrderId!: string;
  @IsUUID('4') warehouseId!: string;
  @IsDateString() receiptDate!: string;
  @IsOptional() @IsString() @MaxLength(50) supplierDocumentNo?: string;
  @IsArray() @ArrayMinSize(1) items!: GoodsReceiptItemEntryDto[];
}
