import { JournalDetailPage } from "@/features/finance/components/JournalDetailPage";

export default async function FinanceJournalDetailPage(props: PageProps<"/finance/journals/[id]">) {
  const { id } = await props.params;
  return <JournalDetailPage journalId={id} />;
}
