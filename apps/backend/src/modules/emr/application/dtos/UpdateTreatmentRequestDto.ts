import { IsInt, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

/**
 * docs/06-tasks/task-321.md: Edit an existing Treatment entry (Quantity /
 * Tooth Reference / Unit Price / Notes), before the Invoice is PAID. Every
 * field is optional -- the use case only recomputes `subtotal` from
 * whichever of `quantity`/`unitPrice` was actually sent, keeping the other
 * at its current value.
 */
export class UpdateTreatmentRequestDto {
  @IsOptional() @IsString() @MaxLength(50) toothReference?: string;
  @IsOptional() @IsInt() @Min(1) @Max(100) quantity?: number;
  @IsOptional() @IsNumber() @Min(0) unitPrice?: number;
  @IsOptional() @IsString() @MaxLength(1000) notes?: string;
}
