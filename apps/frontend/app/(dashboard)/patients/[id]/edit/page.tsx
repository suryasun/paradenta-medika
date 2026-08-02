import { EditPatientForm } from "@/features/patient/components/EditPatientForm";

export default async function EditPatientPage(props: PageProps<"/patients/[id]/edit">) {
  const { id } = await props.params;
  return <EditPatientForm patientId={id} />;
}
