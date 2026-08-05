"use client";

import { FormEvent, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useReferralSources } from "@/features/master-data/hooks/useReferralSources";
import { userService } from "@/features/system/services/user.service";
import { CreatePatientInput, PatientDetail, UpdatePatientInput } from "../types/patient.types";

interface PatientFormProps {
  mode: "create" | "edit";
  initialPatient?: PatientDetail;
  isSubmitting: boolean;
  submitError?: string;
  onSubmit: (payload: CreatePatientInput | UpdatePatientInput) => void;
}

// docs/03-sad/12-module-patient.md Section 21.1/21.2 field shape. Identity
// fields (identityType/identityNumber) are create-only: apps/backend's
// UpdatePatientRequestDto intentionally excludes them (Section 5.4 treats
// identity changes as a separately-permissioned, not-yet-specified action).
export function PatientForm({ mode, initialPatient, isSubmitting, submitError, onSubmit }: PatientFormProps) {
  const [fullName, setFullName] = useState(initialPatient?.profile.fullName ?? "");
  const [gender, setGender] = useState(initialPatient?.profile.gender ?? "MALE");
  const [dateOfBirth, setDateOfBirth] = useState(initialPatient?.profile.dateOfBirth ?? "");
  const [placeOfBirth, setPlaceOfBirth] = useState(initialPatient?.profile.placeOfBirth ?? "");
  const [phoneNumber, setPhoneNumber] = useState(initialPatient?.profile.phoneNumber ?? "");
  const [email, setEmail] = useState(initialPatient?.profile.email ?? "");
  const [identityType, setIdentityType] = useState(initialPatient?.identity.identityType ?? "");
  const [identityNumber, setIdentityNumber] = useState(initialPatient?.identity.identityNumber ?? "");
  const [address, setAddress] = useState(initialPatient?.addresses[0] ?? "");
  // task-284 (Epic PE1): "Kontak Tambahan" fields, available in both
  // create and edit mode per the task's Frontend Scope.
  const [insuranceNumber, setInsuranceNumber] = useState(initialPatient?.profile.insuranceNumber ?? "");
  const [instagramHandle, setInstagramHandle] = useState(initialPatient?.profile.instagramHandle ?? "");
  const [facebookHandle, setFacebookHandle] = useState(initialPatient?.profile.facebookHandle ?? "");
  const [tiktokHandle, setTiktokHandle] = useState(initialPatient?.profile.tiktokHandle ?? "");
  const [whatsappNumber, setWhatsappNumber] = useState(initialPatient?.profile.whatsappNumber ?? "");
  // task-287 (Epic PE4): referredByUserId is only shown/meaningful when
  // the selected source has requiresReferrer:true (currently only "Staf
  // Klinik"), per docs/02-design/pages/patient.md §14.
  const [referralSourceId, setReferralSourceId] = useState(initialPatient?.profile.referralSourceId ?? "");
  const [referredByUserId, setReferredByUserId] = useState(initialPatient?.profile.referredByUserId ?? "");
  const { data: referralSources } = useReferralSources();
  const selectedReferralSource = referralSources?.find((source) => source.id === referralSourceId);
  const { data: staffUsers } = useQuery({
    queryKey: ["system", "users", "referrer-picker"],
    queryFn: () => userService.list({ limit: 100 }),
    enabled: Boolean(selectedReferralSource?.requiresReferrer),
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mode === "create") {
      onSubmit({
        fullName,
        gender: gender as "MALE" | "FEMALE",
        dateOfBirth,
        placeOfBirth: placeOfBirth || undefined,
        phoneNumber,
        email: email || undefined,
        identityType: (identityType || undefined) as CreatePatientInput["identityType"],
        identityNumber: identityNumber || undefined,
        address,
        insuranceNumber: insuranceNumber || undefined,
        instagramHandle: instagramHandle || undefined,
        facebookHandle: facebookHandle || undefined,
        tiktokHandle: tiktokHandle || undefined,
        whatsappNumber: whatsappNumber || undefined,
        referralSourceId: referralSourceId || undefined,
        referredByUserId: referredByUserId || undefined,
      } satisfies CreatePatientInput);
    } else {
      onSubmit({
        fullName,
        phoneNumber,
        email: email || undefined,
        address,
        insuranceNumber: insuranceNumber || undefined,
        instagramHandle: instagramHandle || undefined,
        facebookHandle: facebookHandle || undefined,
        tiktokHandle: tiktokHandle || undefined,
        whatsappNumber: whatsappNumber || undefined,
        referralSourceId: referralSourceId || undefined,
        referredByUserId: referredByUserId || undefined,
      } satisfies UpdatePatientInput);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-2xl flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input id="fullName" label="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        <Input
          id="phoneNumber"
          label="Phone Number"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          required
        />
      </div>

      {mode === "create" && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            id="gender"
            label="Gender"
            value={gender}
            onChange={(e) => setGender(e.target.value as "MALE" | "FEMALE")}
            required
          >
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
          </Select>
          <Input
            id="dateOfBirth"
            label="Date of Birth"
            type="date"
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
            required
          />
        </div>
      )}

      {mode === "create" && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input id="placeOfBirth" label="Place of Birth" value={placeOfBirth} onChange={(e) => setPlaceOfBirth(e.target.value)} />
          <Select id="identityType" label="Identity Type" value={identityType} onChange={(e) => setIdentityType(e.target.value)}>
            <option value="">None</option>
            <option value="KTP">KTP</option>
            <option value="PASSPORT">Passport</option>
            <option value="SIM">SIM</option>
          </Select>
        </div>
      )}

      {mode === "create" && identityType && (
        <Input id="identityNumber" label="Identity Number" value={identityNumber} onChange={(e) => setIdentityNumber(e.target.value)} />
      )}

      <Input id="email" label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <Input id="address" label="Address" value={address} onChange={(e) => setAddress(e.target.value)} required />

      {/* task-284 (Epic PE1): docs/02-design/pages/patient.md §14 groups these
          5 optional fields under a "Kontak Tambahan" sub-heading, distinct
          from the core identity fields above. */}
      <div className="flex flex-col gap-4 border-t border-border pt-4">
        <span className="text-sm font-medium text-foreground">Kontak Tambahan</span>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            id="insuranceNumber"
            label="Insurance Number"
            value={insuranceNumber}
            onChange={(e) => setInsuranceNumber(e.target.value)}
          />
          <Input
            id="whatsappNumber"
            label="WhatsApp Number"
            value={whatsappNumber}
            onChange={(e) => setWhatsappNumber(e.target.value)}
          />
          <Input
            id="instagramHandle"
            label="Instagram Handle"
            value={instagramHandle}
            onChange={(e) => setInstagramHandle(e.target.value)}
          />
          <Input
            id="facebookHandle"
            label="Facebook Handle"
            value={facebookHandle}
            onChange={(e) => setFacebookHandle(e.target.value)}
          />
          <Input id="tiktokHandle" label="TikTok Handle" value={tiktokHandle} onChange={(e) => setTiktokHandle(e.target.value)} />
        </div>
      </div>

      {/* task-287 (Epic PE4): docs/02-design/pages/patient.md §14 -- the
          staff-picker field is hidden entirely (not just disabled) unless
          the selected source has requiresReferrer:true. */}
      <div className="flex flex-col gap-4 border-t border-border pt-4">
        <span className="text-sm font-medium text-foreground">Sumber Rujukan</span>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            id="referralSourceId"
            label="Dari mana Anda mengetahui klinik kami?"
            value={referralSourceId}
            onChange={(e) => {
              setReferralSourceId(e.target.value);
              setReferredByUserId("");
            }}
          >
            <option value="">Pilih sumber...</option>
            {referralSources?.map((source) => (
              <option key={source.id} value={source.id}>
                {source.referralSourceName}
              </option>
            ))}
          </Select>
          {selectedReferralSource?.requiresReferrer && (
            <Select
              id="referredByUserId"
              label="Staf yang merujuk"
              value={referredByUserId}
              onChange={(e) => setReferredByUserId(e.target.value)}
            >
              <option value="">Pilih staf...</option>
              {staffUsers?.items.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.username}
                </option>
              ))}
            </Select>
          )}
        </div>
      </div>

      {submitError && (
        <p role="alert" className="text-sm text-error">
          {submitError}
        </p>
      )}

      <Button type="submit" isLoading={isSubmitting} className="mt-2 self-start">
        {mode === "create" ? "Register Patient" : "Save Changes"}
      </Button>
    </form>
  );
}
