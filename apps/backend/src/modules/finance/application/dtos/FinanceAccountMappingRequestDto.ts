import { IsUUID } from 'class-validator';

export class CreateFinanceAccountMappingRequestDto {
  @IsUUID('4') branchId!: string;
  @IsUUID('4') paymentMethodId!: string;
  @IsUUID('4') cashAccountId!: string;
  @IsUUID('4') revenueAccountId!: string;
}
