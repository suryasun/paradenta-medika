import { WarehouseLocation } from '@prisma/client';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';
import { PagedResult } from '../../../../shared/http/pagination';

export interface CreateWarehouseLocationInput {
  branchId: string;
  locationCode: string;
  locationName: string;
  locationType?: string;
  address?: string;
  managerUserId?: string;
  createdBy: string;
}

export interface IWarehouseLocationRepository {
  create(input: CreateWarehouseLocationInput): Promise<WarehouseLocation>;
  list(query: ListQueryDto): Promise<PagedResult<WarehouseLocation>>;
  findById(id: string): Promise<WarehouseLocation | null>;
  findByBranchAndCode(branchId: string, locationCode: string): Promise<WarehouseLocation | null>;
}
