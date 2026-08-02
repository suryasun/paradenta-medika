import { Supplier } from '@prisma/client';
import { SupplierResponseDto } from '../dtos/SupplierResponseDto';

export function toSupplierResponseDto(supplier: Supplier): SupplierResponseDto {
  return {
    id: supplier.id,
    code: supplier.supplierCode,
    name: supplier.supplierName,
    picName: supplier.picName,
    phone: supplier.phone,
    address: supplier.address,
    taxNumber: supplier.taxNumber,
    isActive: supplier.isActive,
    createdAt: supplier.createdAt.toISOString(),
    createdBy: supplier.createdBy,
  };
}
