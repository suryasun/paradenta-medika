import { BranchConfigurationPage } from "@/features/system/components/BranchConfigurationPage";

export default async function MasterDataBranchConfigurationPage(props: PageProps<"/master-data/branches/[id]/configuration">) {
  const { id } = await props.params;
  return <BranchConfigurationPage branchId={id} />;
}
