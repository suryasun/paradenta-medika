import { IsIn, IsOptional, IsUUID } from 'class-validator';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';

const STATUSES = ['DRAFT', 'APPROVED', 'PAID', 'CANCELLED'] as const;

export class ListDoctorFeeSettlementQueryDto extends ListQueryDto {
  @IsOptional() @IsUUID('4') branchId?: string;
  @IsOptional() @IsUUID('4') doctorId?: string;
  @IsOptional() @IsIn(STATUSES) status?: (typeof STATUSES)[number];
}
