export interface ItemResponseDto {
  id: string;
  code: string;
  name: string;
  categoryId: string;
  unitId: string;
  minimumStock: number;
  purchasePrice: number;
  sellingPrice: number;
  isConsumable: boolean;
  isBatchTracked: boolean;
  isExpiryTracked: boolean;
  isActive: boolean;
  createdAt: string;
  createdBy: string | null;
  updatedAt: string;
  updatedBy: string | null;
}
