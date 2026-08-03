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
  /**
   * docs/06-tasks/task-136.md: resolves the `warehouseId` an
   * `emr.treatment-material-finalized.v1` event needs from the Visit's
   * `branchId` alone. Per the documented simplification that a branch has
   * one warehouse location in this system today, the earliest-created
   * active location for the branch is treated as the branch's warehouse.
   */
  findMainByBranchId(branchId: string): Promise<WarehouseLocation | null>;
}
