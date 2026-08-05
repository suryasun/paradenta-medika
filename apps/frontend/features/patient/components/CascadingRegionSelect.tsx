"use client";

import { Select } from "@/components/ui/Select";
import { useDistricts, useProvinces, useRegencies, useVillages } from "@/features/master-data/hooks/useRegions";

export interface RegionSelection {
  provinceId: string;
  regencyId: string;
  districtId: string;
  villageId: string;
}

interface CascadingRegionSelectProps {
  value: RegionSelection;
  onChange: (next: RegionSelection) => void;
}

// task-286 (Epic PE3): Provinsi -> Kabupaten/Kota -> Kecamatan ->
// Kelurahan/Desa, each select stays disabled/empty until its parent is
// chosen, per docs/02-design/pages/patient.md §14. Changing a parent
// level clears every level below it (a stale child selection referencing
// the old parent would fail apps/backend's region-chain validation).
export function CascadingRegionSelect({ value, onChange }: CascadingRegionSelectProps) {
  const { data: provinces, isLoading: provincesLoading } = useProvinces();
  const { data: regencies, isLoading: regenciesLoading } = useRegencies(value.provinceId || undefined);
  const { data: districts, isLoading: districtsLoading } = useDistricts(value.regencyId || undefined);
  const { data: villages, isLoading: villagesLoading } = useVillages(value.districtId || undefined);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Select
        id="provinceId"
        label="Provinsi"
        value={value.provinceId}
        disabled={provincesLoading}
        onChange={(e) => onChange({ provinceId: e.target.value, regencyId: "", districtId: "", villageId: "" })}
        required
      >
        <option value="">Pilih provinsi...</option>
        {provinces?.map((province) => (
          <option key={province.id} value={province.id}>
            {province.provinceName}
          </option>
        ))}
      </Select>

      <Select
        id="regencyId"
        label="Kabupaten/Kota"
        value={value.regencyId}
        disabled={!value.provinceId || regenciesLoading}
        onChange={(e) => onChange({ ...value, regencyId: e.target.value, districtId: "", villageId: "" })}
        required
      >
        <option value="">Pilih kabupaten/kota...</option>
        {regencies?.map((regency) => (
          <option key={regency.id} value={regency.id}>
            {regency.regencyName}
          </option>
        ))}
      </Select>

      <Select
        id="districtId"
        label="Kecamatan"
        value={value.districtId}
        disabled={!value.regencyId || districtsLoading}
        onChange={(e) => onChange({ ...value, districtId: e.target.value, villageId: "" })}
        required
      >
        <option value="">Pilih kecamatan...</option>
        {districts?.map((district) => (
          <option key={district.id} value={district.id}>
            {district.districtName}
          </option>
        ))}
      </Select>

      <Select
        id="villageId"
        label="Kelurahan/Desa"
        value={value.villageId}
        disabled={!value.districtId || villagesLoading}
        onChange={(e) => onChange({ ...value, villageId: e.target.value })}
        required
      >
        <option value="">Pilih kelurahan/desa...</option>
        {villages?.map((village) => (
          <option key={village.id} value={village.id}>
            {village.villageName}
          </option>
        ))}
      </Select>
    </div>
  );
}
