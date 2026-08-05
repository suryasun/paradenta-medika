export interface PatientAddressResponseDto {
  id: string;
  province: { id: string; name: string };
  regency: { id: string; name: string };
  district: { id: string; name: string };
  village: { id: string; name: string };
  addressLine: string;
  postalCode: string | null;
  isPrimary: boolean;
}
