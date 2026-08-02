import { PatientDetailView } from "@/features/patient/components/PatientDetailView";

export default async function PatientDetailPage(props: PageProps<"/patients/[id]">) {
  const { id } = await props.params;
  return <PatientDetailView patientId={id} />;
}
