import { ArrayMinSize, ArrayUnique, IsArray, IsDateString, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

/**
 * docs/06-tasks/task-128.md: opname scope is the explicit set of itemIds
 * the caller wants counted -- no auto-population from "every item with a
 * stock row" is specified anywhere in task-127-135, so `items` is
 * required rather than inventing a default-population heuristic.
 */
export class CreateStockOpnameRequestDto {
  @IsUUID('4') warehouseId!: string;
  @IsDateString() opnameDate!: string;
  @IsOptional() @IsString() @MaxLength(500) notes?: string;
  @IsArray() @ArrayMinSize(1) @ArrayUnique() @IsUUID('4', { each: true }) items!: string[];
}

/** docs/06-tasks/task-129.md AC: "update rejected once counting has started" -- DRAFT-only, enforced in the use case. */
export class UpdateStockOpnameRequestDto {
  @IsOptional() @IsString() @MaxLength(500) notes?: string;
  @IsOptional() @IsArray() @ArrayMinSize(1) @ArrayUnique() @IsUUID('4', { each: true }) items?: string[];
}

export interface SubmitStockOpnameItemEntryDto {
  itemId: string;
  physicalQuantity: number;
  notes?: string;
}

/** docs/06-tasks/task-131.md: "Submit counted quantities for approval, computing variance per line" -- counts arrive in this request body. */
export class SubmitStockOpnameRequestDto {
  @IsArray() @ArrayMinSize(1) items!: SubmitStockOpnameItemEntryDto[];
}
