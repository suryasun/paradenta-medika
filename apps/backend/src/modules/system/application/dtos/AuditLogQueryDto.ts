import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';

/** docs/06-tasks/task-192.md: "filter by date, module, branch, actor, target, action, correlation id, outcome" -- module/branch/outcome are not stored by this codebase's audit_logs table (see IAuditLogRepository.ts's doc comment) and are therefore not accepted here. */
export class AuditLogQueryDto extends ListQueryDto {
  @IsOptional() @IsDateString() dateFrom?: string;
  @IsOptional() @IsDateString() dateTo?: string;
  @IsOptional() @IsUUID('4') actorUserId?: string;
  @IsOptional() @IsString() entity?: string;
  @IsOptional() @IsUUID('4') entityId?: string;
  @IsOptional() @IsString() action?: string;
  @IsOptional() @IsUUID('4') correlationId?: string;
}
