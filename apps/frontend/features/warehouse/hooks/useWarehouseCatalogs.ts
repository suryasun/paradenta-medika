import { useQuery } from "@tanstack/react-query";
import { itemService, supplierService, warehouseLocationService } from "../services/warehouse.service";

export function useItems() {
  return useQuery({ queryKey: ["warehouse", "items", "list"], queryFn: () => itemService.list() });
}

export function useSuppliers() {
  return useQuery({ queryKey: ["warehouse", "suppliers", "list"], queryFn: () => supplierService.list() });
}

export function useWarehouseLocations() {
  return useQuery({ queryKey: ["warehouse", "warehouses", "list"], queryFn: () => warehouseLocationService.list() });
}
