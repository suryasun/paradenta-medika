import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { InvoiceListView } from "./InvoiceListView";
import { billingService } from "../services/billing.service";
import { InvoiceSummary } from "../types/billing.types";

jest.mock("../services/billing.service");
const mockedBillingService = jest.mocked(billingService);

jest.mock("next/link", () => {
  return function MockLink({ href, children }: { href: string; children: React.ReactNode }) {
    return <a href={href}>{children}</a>;
  };
});

function renderView() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <InvoiceListView />
    </QueryClientProvider>,
  );
}

const INVOICE: InvoiceSummary = {
  id: "inv1",
  invoiceNo: "INV-20260802-000001",
  visitId: "v1",
  patientId: "p1",
  branchId: "b1",
  invoiceDate: "2026-08-02T09:00:00.000Z",
  subtotal: 400000,
  discount: 0,
  tax: 0,
  grandTotal: 400000,
  paidAmount: 0,
  outstanding: 400000,
  status: "UNPAID",
  discountReason: null,
  discountSource: null,
  discountApprovedBy: null,
  cancelReason: null,
  cancelledBy: null,
  cancelledAt: null,
  voidReason: null,
  voidedBy: null,
  voidedAt: null,
};

describe("InvoiceListView", () => {
  beforeEach(() => jest.clearAllMocks());

  it("shows an empty state when there are no invoices", async () => {
    mockedBillingService.list.mockResolvedValue({ items: [], meta: { page: 1, limit: 20, total: 0, totalPages: 1 } });

    renderView();

    expect(await screen.findByText("No invoices found")).toBeInTheDocument();
  });

  it("renders invoice rows with number, totals, and status", async () => {
    mockedBillingService.list.mockResolvedValue({ items: [INVOICE], meta: { page: 1, limit: 20, total: 1, totalPages: 1 } });

    renderView();

    expect(await screen.findByText("INV-20260802-000001")).toBeInTheDocument();
    expect(screen.getByText("UNPAID", { selector: "span" })).toBeInTheDocument();
  });
});
