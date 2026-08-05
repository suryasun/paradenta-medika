"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Input } from "@/components/ui/Input";
import { LoadingState } from "@/components/ui/LoadingState";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { PermissionGuard } from "@/components/guards/PermissionGuard";
import { getApiErrorMessage } from "@/lib/api-client";
import { usePatientAddresses } from "../hooks/usePatientAddresses";
import {
  useAddPatientAddress,
  useDeletePatientAddress,
  useSetPrimaryPatientAddress,
  useUpdatePatientAddress,
} from "../hooks/usePatientAddressMutations";
import { PatientAddress } from "../types/patient.types";
import { CascadingRegionSelect, RegionSelection } from "./CascadingRegionSelect";

const EMPTY_SELECTION: RegionSelection = { provinceId: "", regencyId: "", districtId: "", villageId: "" };

function toSelection(address: PatientAddress): RegionSelection {
  return {
    provinceId: address.province.id,
    regencyId: address.regency.id,
    districtId: address.district.id,
    villageId: address.village.id,
  };
}

// task-286 (Epic PE3, Patient Module Enhancement addendum): the Patient
// Detail Address tab becomes a repeatable list of address cards, per
// docs/02-design/pages/patient.md §14 -- replacing the single free-text
// address field that tab previously showed (Patient.address itself is
// retained server-side for backward compatibility, just no longer the
// primary UI here).
export function PatientAddressList({ patientId }: { patientId: string }) {
  const { data: addresses, isLoading, isError, error, refetch } = usePatientAddresses(patientId);
  const addAddress = useAddPatientAddress(patientId);
  const updateAddress = useUpdatePatientAddress(patientId);
  const deleteAddress = useDeletePatientAddress(patientId);
  const setPrimaryAddress = useSetPrimaryPatientAddress(patientId);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selection, setSelection] = useState<RegionSelection>(EMPTY_SELECTION);
  const [addressLine, setAddressLine] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [replacementPrimaryId, setReplacementPrimaryId] = useState("");

  function openAddForm() {
    setEditingId(null);
    setSelection(EMPTY_SELECTION);
    setAddressLine("");
    setPostalCode("");
    setShowForm(true);
  }

  function openEditForm(address: PatientAddress) {
    setEditingId(address.id);
    setSelection(toSelection(address));
    setAddressLine(address.addressLine);
    setPostalCode(address.postalCode ?? "");
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
  }

  function submitForm() {
    const payload = {
      provinceId: selection.provinceId,
      regencyId: selection.regencyId,
      districtId: selection.districtId,
      villageId: selection.villageId,
      addressLine,
      postalCode: postalCode || undefined,
    };
    if (editingId) {
      updateAddress.mutate({ addressId: editingId, payload }, { onSuccess: closeForm });
    } else {
      addAddress.mutate(payload, { onSuccess: closeForm });
    }
  }

  function requestDelete(address: PatientAddress) {
    const otherAddresses = (addresses ?? []).filter((a) => a.id !== address.id);
    if (address.isPrimary && otherAddresses.length > 0) {
      setDeletingId(address.id);
      setReplacementPrimaryId("");
      return;
    }
    deleteAddress.mutate({ addressId: address.id });
  }

  function confirmDeleteWithReplacement() {
    if (!deletingId || !replacementPrimaryId) return;
    deleteAddress.mutate(
      { addressId: deletingId, newPrimaryAddressId: replacementPrimaryId },
      { onSuccess: () => setDeletingId(null) },
    );
  }

  const isFormValid =
    selection.provinceId && selection.regencyId && selection.districtId && selection.villageId && addressLine.trim().length > 0;
  const isSaving = addAddress.isPending || updateAddress.isPending;
  const saveError = addAddress.isError
    ? getApiErrorMessage(addAddress.error)
    : updateAddress.isError
      ? getApiErrorMessage(updateAddress.error)
      : undefined;

  if (isLoading) return <LoadingState label="Loading addresses..." rows={2} columns={1} />;
  if (isError) return <ErrorState message={getApiErrorMessage(error)} onRetry={() => refetch()} />;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">Addresses</span>
        <PermissionGuard permission="patient.update">
          <Button variant="secondary" onClick={openAddForm}>
            Add Address
          </Button>
        </PermissionGuard>
      </div>

      {(!addresses || addresses.length === 0) && (
        <EmptyState title="No addresses yet" description="Add this patient's first address to get started." />
      )}

      {deleteAddress.isError && (
        <p role="alert" className="text-sm text-error">
          {getApiErrorMessage(deleteAddress.error)}
        </p>
      )}

      <div className="flex flex-col gap-3">
        {addresses?.map((address) => (
          <div key={address.id} className="flex flex-col gap-2 rounded-lg border border-border p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  {address.isPrimary && <Badge tone="success">Alamat Utama</Badge>}
                </div>
                <p className="mt-1 text-sm text-foreground">{address.addressLine}</p>
                <p className="text-sm text-muted">
                  {address.village.name}, {address.district.name}, {address.regency.name}, {address.province.name}
                  {address.postalCode ? ` ${address.postalCode}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <PermissionGuard permission="patient.update">
                  {!address.isPrimary && (
                    <Button
                      variant="tertiary"
                      isLoading={setPrimaryAddress.isPending}
                      onClick={() => setPrimaryAddress.mutate(address.id)}
                    >
                      Set as Primary
                    </Button>
                  )}
                  <Button variant="tertiary" onClick={() => openEditForm(address)}>
                    Edit
                  </Button>
                  <Button variant="danger" onClick={() => requestDelete(address)}>
                    Delete
                  </Button>
                </PermissionGuard>
              </div>
            </div>

            {deletingId === address.id && (
              <div className="flex flex-col gap-2 rounded-md bg-surface p-3">
                <p className="text-sm text-foreground">
                  This is the primary address. Choose a new primary address before deleting it.
                </p>
                <Select
                  id="replacementPrimaryId"
                  label="New primary address"
                  value={replacementPrimaryId}
                  onChange={(e) => setReplacementPrimaryId(e.target.value)}
                >
                  <option value="">Select a replacement...</option>
                  {addresses
                    ?.filter((a) => a.id !== address.id)
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.addressLine}
                      </option>
                    ))}
                </Select>
                <div className="flex gap-2">
                  <Button
                    isLoading={deleteAddress.isPending}
                    disabled={!replacementPrimaryId}
                    onClick={confirmDeleteWithReplacement}
                  >
                    Delete and Promote
                  </Button>
                  <Button variant="secondary" onClick={() => setDeletingId(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {showForm && (
        <Modal title={editingId ? "Edit Address" : "Add Address"} onClose={closeForm}>
          <div className="flex flex-col gap-4">
            <CascadingRegionSelect value={selection} onChange={setSelection} />
            <Input id="addressLine" label="Address Line" value={addressLine} onChange={(e) => setAddressLine(e.target.value)} required />
            <Input id="postalCode" label="Postal Code" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} />
            {saveError && (
              <p role="alert" className="text-sm text-error">
                {saveError}
              </p>
            )}
            <div className="flex justify-end gap-2 border-t border-border pt-3">
              <Button variant="secondary" onClick={closeForm}>
                Cancel
              </Button>
              <Button isLoading={isSaving} disabled={!isFormValid} onClick={submitForm}>
                {editingId ? "Save Changes" : "Add Address"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
