export interface WarehouseLocationResponseDto {
  id: string;
  branchId: string;
  code: string;
  name: string;
  locationType: string;
  address: string | null;
  managerUserId: string | null;
  isActive: boolean;
  createdAt: string;
  createdBy: string | null;
}
