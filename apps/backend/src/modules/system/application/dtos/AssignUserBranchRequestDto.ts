import { ArrayMinSize, IsArray } from 'class-validator';

export interface BranchAssignmentEntryDto {
  branchId: string;
  isDefault: boolean;
  effectiveFrom?: string;
}

/**
 * Per-entry array validation via `@IsArray()`/`@ArrayMinSize(1)` plus
 * manual per-entry checks in AssignUserBranchUseCase, not
 * `@ValidateNested()`/`@Type()` -- same convention as
 * CreatePurchaseOrderRequestDto (warehouse module).
 */
export class AssignUserBranchRequestDto {
  @IsArray()
  @ArrayMinSize(1)
  branchAssignments!: BranchAssignmentEntryDto[];
}
