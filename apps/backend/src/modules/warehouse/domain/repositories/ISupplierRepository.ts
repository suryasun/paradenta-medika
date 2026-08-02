import { Supplier } from '@prisma/client';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';
import { PagedResult } from '../../../../shared/http/pagination';

export interface CreateSupplierInput {
  supplierCode: string;
  supplierName: string;
  picName?: string;
  phone?: string;
  address?: string;
  taxNumber?: string;
  createdBy: string;
}

export interface ISupplierRepository {
  create(input: CreateSupplierInput): Promise<Supplier>;
  list(query: ListQueryDto): Promise<PagedResult<Supplier>>;
  findById(id: string): Promise<Supplier | null>;
  findByCode(supplierCode: string): Promise<Supplier | null>;
}
