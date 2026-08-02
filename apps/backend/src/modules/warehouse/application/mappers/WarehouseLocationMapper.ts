import { WarehouseLocation } from '@prisma/client';
import { WarehouseLocationResponseDto } from '../dtos/WarehouseLocationResponseDto';

export function toWarehouseLocationResponseDto(location: WarehouseLocation): WarehouseLocationResponseDto {
  return {
    id: location.id,
    branchId: location.branchId,
    code: location.locationCode,
    name: location.locationName,
    locationType: location.locationType,
    address: location.address,
    managerUserId: location.managerUserId,
    isActive: location.isActive,
    createdAt: location.createdAt.toISOString(),
    createdBy: location.createdBy,
  };
}
