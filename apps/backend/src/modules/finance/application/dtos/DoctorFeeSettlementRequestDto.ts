import { IsDateString, IsUUID } from 'class-validator';

export class GenerateDoctorFeeSettlementRequestDto {
  @IsUUID('4') branchId!: string;
  @IsUUID('4') doctorId!: string;
  @IsDateString() periodStart!: string;
  @IsDateString() periodEnd!: string;
  @IsUUID('4') feeAccountId!: string;
}

export class PayDoctorFeeSettlementRequestDto {
  @IsUUID('4') cashAccountId!: string;
  @IsDateString() paymentDate!: string;
}
