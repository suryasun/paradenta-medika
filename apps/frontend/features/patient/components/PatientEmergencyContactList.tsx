"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Input } from "@/components/ui/Input";
import { LoadingState } from "@/components/ui/LoadingState";
import { Modal } from "@/components/ui/Modal";
import { PermissionGuard } from "@/components/guards/PermissionGuard";
import { getApiErrorMessage } from "@/lib/api-client";
import { usePatientEmergencyContacts } from "../hooks/usePatientEmergencyContacts";
import {
  useAddEmergencyContact,
  useDeleteEmergencyContact,
  useUpdateEmergencyContact,
} from "../hooks/usePatientEmergencyContactMutations";
import { PatientEmergencyContact } from "../types/patient.types";

// task-288 (Epic PE5, Patient Module Enhancement addendum): the Emergency
// Contact tab on Patient Detail becomes a real repeatable list -- name,
// relationship, phone, optional address, with add/edit/delete actions.
// No primary/default concept, unlike PatientAddressList (task-286) --
// not part of the literal §12.5 source this entity mirrors.
export function PatientEmergencyContactList({ patientId }: { patientId: string }) {
  const { data: contacts, isLoading, isError, error, refetch } = usePatientEmergencyContacts(patientId);
  const addContact = useAddEmergencyContact(patientId);
  const updateContact = useUpdateEmergencyContact(patientId);
  const deleteContact = useDeleteEmergencyContact(patientId);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [contactName, setContactName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  function openAddForm() {
    setEditingId(null);
    setContactName("");
    setRelationship("");
    setPhone("");
    setAddress("");
    setShowForm(true);
  }

  function openEditForm(contact: PatientEmergencyContact) {
    setEditingId(contact.id);
    setContactName(contact.contactName);
    setRelationship(contact.relationship);
    setPhone(contact.phone);
    setAddress(contact.address ?? "");
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
  }

  function submitForm() {
    const payload = { contactName, relationship, phone, address: address || undefined };
    if (editingId) {
      updateContact.mutate({ contactId: editingId, payload }, { onSuccess: closeForm });
    } else {
      addContact.mutate(payload, { onSuccess: closeForm });
    }
  }

  const isFormValid = contactName.trim().length > 0 && relationship.trim().length > 0 && phone.trim().length > 0;
  const isSaving = addContact.isPending || updateContact.isPending;
  const saveError = addContact.isError
    ? getApiErrorMessage(addContact.error)
    : updateContact.isError
      ? getApiErrorMessage(updateContact.error)
      : undefined;

  if (isLoading) return <LoadingState label="Loading emergency contacts..." rows={2} columns={1} />;
  if (isError) return <ErrorState message={getApiErrorMessage(error)} onRetry={() => refetch()} />;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">Emergency Contacts</span>
        <PermissionGuard permission="patient.update">
          <Button variant="secondary" onClick={openAddForm}>
            Add Emergency Contact
          </Button>
        </PermissionGuard>
      </div>

      {(!contacts || contacts.length === 0) && (
        <EmptyState title="No emergency contacts yet" description="Add who to contact in a clinical emergency." />
      )}

      {deleteContact.isError && (
        <p role="alert" className="text-sm text-error">
          {getApiErrorMessage(deleteContact.error)}
        </p>
      )}

      <div className="flex flex-col gap-3">
        {contacts?.map((contact) => (
          <div key={contact.id} className="flex items-start justify-between gap-2 rounded-lg border border-border p-4">
            <div>
              <p className="text-sm font-medium text-foreground">{contact.contactName}</p>
              <p className="text-sm text-muted">
                {contact.relationship} · {contact.phone}
              </p>
              {contact.address && <p className="text-sm text-muted">{contact.address}</p>}
            </div>
            <PermissionGuard permission="patient.update">
              <div className="flex shrink-0 gap-2">
                <Button variant="tertiary" onClick={() => openEditForm(contact)}>
                  Edit
                </Button>
                <Button
                  variant="danger"
                  isLoading={deleteContact.isPending}
                  onClick={() => deleteContact.mutate(contact.id)}
                >
                  Delete
                </Button>
              </div>
            </PermissionGuard>
          </div>
        ))}
      </div>

      {showForm && (
        <Modal title={editingId ? "Edit Emergency Contact" : "Add Emergency Contact"} onClose={closeForm}>
          <div className="flex flex-col gap-4">
            <Input id="contactName" label="Name" value={contactName} onChange={(e) => setContactName(e.target.value)} required />
            <Input id="relationship" label="Relationship" value={relationship} onChange={(e) => setRelationship(e.target.value)} required />
            <Input id="phone" label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} required />
            <Input id="address" label="Address" value={address} onChange={(e) => setAddress(e.target.value)} />
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
                {editingId ? "Save Changes" : "Add Contact"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
