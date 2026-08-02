export interface SupplierResponseDto {
  id: string;
  code: string;
  name: string;
  picName: string | null;
  phone: string | null;
  address: string | null;
  taxNumber: string | null;
  isActive: boolean;
  createdAt: string;
  createdBy: string | null;
}
