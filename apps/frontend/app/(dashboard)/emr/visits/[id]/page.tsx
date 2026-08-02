import { VisitWorkspace } from "@/features/emr/components/VisitWorkspace";

export default async function VisitPage(props: PageProps<"/emr/visits/[id]">) {
  const { id } = await props.params;
  return <VisitWorkspace visitId={id} />;
}
