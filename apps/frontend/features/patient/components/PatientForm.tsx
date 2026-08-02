"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
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
      } satisfies CreatePatientInput);
    } else {
      onSubmit({ fullName, phoneNumber, email: email || undefined, address } satisfies UpdatePatientInput);
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
