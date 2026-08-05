import { useQuery } from "@tanstack/react-query";
import { regionService } from "../services/region.service";

// task-285/task-286: cascading-select hooks -- each level stays disabled/
// empty (query `enabled: false`) until its parent is chosen, per
// docs/02-design/pages/patient.md §14.
export function useProvinces() {
  return useQuery({ queryKey: ["master-data", "provinces"], queryFn: () => regionService.listProvinces() });
}

export function useRegencies(provinceId: string | undefined) {
  return useQuery({
    queryKey: ["master-data", "regencies", provinceId],
    queryFn: () => regionService.listRegencies(provinceId),
    enabled: Boolean(provinceId),
  });
}

export function useDistricts(regencyId: string | undefined) {
  return useQuery({
    queryKey: ["master-data", "districts", regencyId],
    queryFn: () => regionService.listDistricts(regencyId),
    enabled: Boolean(regencyId),
  });
}

export function useVillages(districtId: string | undefined) {
  return useQuery({
    queryKey: ["master-data", "villages", districtId],
    queryFn: () => regionService.listVillages(districtId),
    enabled: Boolean(districtId),
  });
}
