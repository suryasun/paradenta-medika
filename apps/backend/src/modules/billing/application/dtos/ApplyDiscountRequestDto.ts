import { IsIn, IsNumber, IsString, Min, MinLength } from 'class-validator';

// docs/06-tasks/task-322.md: UC-BIL-005 "Discount dapat berasal dari: Dokter/Promosi/Membership/Manual".
const DISCOUNT_SOURCES = ['DOCTOR', 'PROMOTION', 'MEMBERSHIP', 'MANUAL'] as const;

export class ApplyDiscountRequestDto {
  @IsNumber() @Min(0.01) amount!: number;
  @IsIn(DISCOUNT_SOURCES) source!: (typeof DISCOUNT_SOURCES)[number];
  @IsString() @MinLength(1) reason!: string;
}
