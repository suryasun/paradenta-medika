import { ArrayMinSize, IsArray, IsUUID } from 'class-validator';

// docs/03-sad/16-module-billing.md Section 8 "Create Payment": accepts an
// invoiceId and an array of { method, amount } to support "Mendukung
// Multiple Payment" (Section 10 Business Rules). `method` in the SAD's
// sample is a free-text label (Cash/QRIS/...); task-057.md instead says
// "accept invoiceId, paymentMethodId, amount", matching the Payment Method
// master data table already built in task-026 -- the task spec (priority 2)
// is followed over the SAD's free-text field, so each entry carries
// `paymentMethodId` instead of `method`.
//
// Nested-array validation avoids @ValidateNested()/@Type() (class-validator
// + class-transformer) because those require the `reflect-metadata` polyfill,
// which is not an approved dependency (see RecordDiagnosisRequestDto for the
// prior occurrence of this constraint). Structural/per-entry validation is
// done in CreatePaymentUseCase instead.
export interface PaymentLineDto {
  paymentMethodId: string;
  amount: number;
  referenceNo?: string;
  note?: string;
}

export class CreatePaymentRequestDto {
  @IsUUID('4') invoiceId!: string;

  @IsArray()
  @ArrayMinSize(1)
  payments!: PaymentLineDto[];
}
