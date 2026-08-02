import { UserDetailView } from "@/features/system/components/UserDetailView";

export default async function SystemUserDetailPage(props: PageProps<"/system/users/[id]">) {
  const { id } = await props.params;
  return <UserDetailView userId={id} />;
}
