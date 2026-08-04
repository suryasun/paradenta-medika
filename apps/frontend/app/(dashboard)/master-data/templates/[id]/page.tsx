import { MasterDataTemplateDetailPage } from "@/features/master-data/components/MasterDataTemplateDetailPage";

export default async function MasterDataTemplateDetailRoutePage(props: PageProps<"/master-data/templates/[id]">) {
  const { id } = await props.params;
  return <MasterDataTemplateDetailPage templateId={id} />;
}
