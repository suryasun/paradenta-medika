import { IsOptional, IsUUID } from 'class-validator';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';

/** docs/06-tasks/task-214.md: extends GET /system/users with an optional branch filter. */
export class ListUsersQueryDto extends ListQueryDto {
  @IsOptional() @IsUUID('4') branchId?: string;
}
