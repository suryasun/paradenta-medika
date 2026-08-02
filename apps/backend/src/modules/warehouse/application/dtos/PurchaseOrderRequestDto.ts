import { ArrayMinSize, IsArray, IsDateString, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export interface PurchaseOrderItemEntryDto {
  itemId: string;
  quantity: number;
  unitPrice: number;
}

/**
 * Per-entry array validation via `@IsArray()`/`@ArrayMinSize(1)` plus
 * manual per-entry checks in the use case, not `@ValidateNested()`/`@Type()`
 * -- same `reflect-metadata`-avoidance reason documented on
 * RecordDiagnosisRequestDto/CreateTreatmentPlanRequestDto in the EMR module.
 */
export class CreatePurchaseOrderRequestDto {
  @IsUUID('4') supplierId!: string;
  @IsUUID('4') warehouseId!: string;
  @IsOptional() @IsDateString() expectedDate?: string;
  @IsArray() @ArrayMinSize(1) items!: PurchaseOrderItemEntryDto[];
}

export class UpdatePurchaseOrderRequestDto {
  @IsOptional() @IsUUID('4') warehouseId?: string;
  @IsOptional() @IsDateString() expectedDate?: string;
  @IsOptional() @IsArray() @ArrayMinSize(1) items?: PurchaseOrderItemEntryDto[];
}

export class RejectPurchaseOrderRequestDto {
  @IsString() @MinLength(1) reason!: string;
}

export class CancelPurchaseOrderRequestDto {
  @IsOptional() @IsString() reason?: string;
}
