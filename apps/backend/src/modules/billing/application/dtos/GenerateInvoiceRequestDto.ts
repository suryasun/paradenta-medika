import { IsUUID } from 'class-validator';

// docs/03-sad/16-module-billing.md Section 7 "Create Invoice": { "visitId": "UUID" }
export class GenerateInvoiceRequestDto {
  @IsUUID('4') visitId!: string;
}
