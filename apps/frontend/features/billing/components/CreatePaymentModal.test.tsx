import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CreatePaymentModal } from "./CreatePaymentModal";
import { billingService } from "../services/billing.service";
import { paymentMethodService } from "@/features/master-data/services/paymentMethod.service";
import { insuranceProviderService } from "@/features/master-data/services/insuranceProvider.service";

jest.mock("../services/billing.service");
jest.mock("@/features/master-data/services/paymentMethod.service");
jest.mock("@/features/master-data/services/insuranceProvider.service");
const mockedBillingService = jest.mocked(billingService);
const mockedPaymentMethodService = jest.mocked(paymentMethodService);
const mockedInsuranceProviderService = jest.mocked(insuranceProviderService);

function renderModal(outstanding = 400000) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <CreatePaymentModal invoiceId="inv1" outstanding={outstanding} onClose={jest.fn()} />
    </QueryClientProvider>,
  );
}

describe("CreatePaymentModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedPaymentMethodService.list.mockResolvedValue({
      items: [
        { id: "pm1", methodCode: "CASH", methodName: "Cash", isCash: true, isActive: true },
        { id: "pm2", methodCode: "QRIS", methodName: "QRIS", isCash: false, isActive: true },
      ],
      meta: { page: 1, limit: 100, total: 2, totalPages: 1 },
    });
    mockedInsuranceProviderService.list.mockResolvedValue({
      items: [{ id: "ins1", providerName: "BPJS Kesehatan", isActive: true }],
      meta: { page: 1, limit: 100, total: 1, totalPages: 1 },
    });
  });

  // Confirmed with the user: partial payment already worked end-to-end
  // (CreatePaymentUseCase accepts any amount <= outstanding), the ask was to
  // make it an explicit, discoverable choice in the form.
  it("clears the Amount field when switching to Partial Payment, and re-fills it on Full Payment", async () => {
    const user = userEvent.setup();
    renderModal(400000);

    await screen.findByText("Cash");
    expect(screen.getByLabelText("Amount")).toHaveValue(400000);

    await user.selectOptions(screen.getByLabelText("Payment Type"), "PARTIAL");
    expect(screen.getByLabelText("Amount")).toHaveValue(null);

    await user.selectOptions(screen.getByLabelText("Method"), "pm1");
    await user.type(screen.getByLabelText("Amount"), "150000");
    expect(screen.getByLabelText("Amount")).toHaveValue(150000);
    expect(screen.getByRole("button", { name: "Confirm Payment" })).toBeEnabled();

    await user.selectOptions(screen.getByLabelText("Payment Type"), "FULL");
    expect(screen.getByLabelText("Amount")).toHaveValue(400000);
  });

  it("disables Confirm when total exceeds the outstanding balance", async () => {
    const user = userEvent.setup();
    renderModal(400000);

    await screen.findByText("Cash");
    await user.selectOptions(screen.getByLabelText("Method"), "pm1");
    await user.clear(screen.getByLabelText("Amount"));
    await user.type(screen.getByLabelText("Amount"), "500000");

    expect(screen.getByText("exceeds outstanding balance")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirm Payment" })).toBeDisabled();
  });

  it("splits payment across two methods and submits both lines", async () => {
    const user = userEvent.setup();
    mockedBillingService.createPayment.mockResolvedValue({
      id: "inv1",
      invoiceNo: "INV-1",
      visitId: "v1",
      patientId: "p1",
      branchId: "b1",
      invoiceDate: "2026-08-02T09:00:00.000Z",
      subtotal: 400000,
      discount: 0,
      tax: 0,
      grandTotal: 400000,
      paidAmount: 400000,
      outstanding: 0,
      status: "PAID",
      discountReason: null,
      discountSource: null,
      discountApprovedBy: null,
      cancelReason: null,
      cancelledBy: null,
      cancelledAt: null,
      voidReason: null,
      voidedBy: null,
      voidedAt: null,
    });

    renderModal(400000);
    await screen.findByText("Cash");
    await user.selectOptions(screen.getByLabelText("Method"), "pm1");
    await user.clear(screen.getByLabelText("Amount"));
    await user.type(screen.getByLabelText("Amount"), "100000");

    await user.click(screen.getByRole("button", { name: "Split Payment (+)" }));
    const methodSelects = screen.getAllByLabelText("Method");
    await user.selectOptions(methodSelects[1], "pm2");
    const amountInputs = screen.getAllByLabelText("Amount");
    await user.type(amountInputs[1], "300000");

    await user.click(screen.getByRole("button", { name: "Confirm Payment" }));

    await waitFor(() =>
      expect(mockedBillingService.createPayment).toHaveBeenCalledWith("inv1", [
        { paymentMethodId: "pm1", amount: 100000, payerType: "PATIENT" },
        { paymentMethodId: "pm2", amount: 300000, payerType: "PATIENT" },
      ]),
    );
  });

  // docs/06-tasks/task-332.md, docs/adr/ADR-001-insurance-coverage-model.md
  it("submits an Insurance-payer line with insuranceProviderId and policyNumber", async () => {
    const user = userEvent.setup();
    mockedBillingService.createPayment.mockResolvedValue({
      id: "inv1",
      invoiceNo: "INV-1",
      visitId: "v1",
      patientId: "p1",
      branchId: "b1",
      invoiceDate: "2026-08-02T09:00:00.000Z",
      subtotal: 400000,
      discount: 0,
      tax: 0,
      grandTotal: 400000,
      paidAmount: 400000,
      outstanding: 0,
      status: "PAID",
      discountReason: null,
      discountSource: null,
      discountApprovedBy: null,
      cancelReason: null,
      cancelledBy: null,
      cancelledAt: null,
      voidReason: null,
      voidedBy: null,
      voidedAt: null,
    });

    renderModal(400000);
    await screen.findByText("Cash");
    await user.selectOptions(screen.getByLabelText("Method"), "pm1");
    await user.clear(screen.getByLabelText("Amount"));
    await user.type(screen.getByLabelText("Amount"), "400000");

    await user.selectOptions(screen.getByLabelText("Payer"), "INSURANCE");
    await screen.findByText("BPJS Kesehatan");
    await user.selectOptions(screen.getByLabelText("Insurance Provider"), "ins1");
    await user.type(screen.getByLabelText("Policy Number"), "POL-001");

    await user.click(screen.getByRole("button", { name: "Confirm Payment" }));

    await waitFor(() =>
      expect(mockedBillingService.createPayment).toHaveBeenCalledWith("inv1", [
        { paymentMethodId: "pm1", amount: 400000, payerType: "INSURANCE", insuranceProviderId: "ins1", policyNumber: "POL-001" },
      ]),
    );
  });
});
