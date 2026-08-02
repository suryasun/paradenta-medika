import { ArrayUnique, IsArray, IsUUID } from 'class-validator';

export class AssignPermissionsRequestDto {
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  permissionIds!: string[];
}
