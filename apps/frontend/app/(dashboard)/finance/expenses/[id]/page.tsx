import { ExpenseDetailPage } from "@/features/finance/components/ExpenseDetailPage";

export default async function FinanceExpenseDetailPage(props: PageProps<"/finance/expenses/[id]">) {
  const { id } = await props.params;
  return <ExpenseDetailPage expenseId={id} />;
}
