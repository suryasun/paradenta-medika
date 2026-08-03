import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AdminEntityListPage } from "./AdminEntityListPage";
import { useAuthStore } from "@/stores/auth.store";
import { FieldConfig } from "../lib/fieldConfig";

interface Widget {
  id: string;
  widgetCode: string;
  widgetName: string;
  isActive: boolean;
}

const FIELDS: FieldConfig[] = [
  { name: "widgetCode", label: "Widget Code", type: "text", required: true, createOnly: true },
  { name: "widgetName", label: "Widget Name", type: "text", required: true },
];

function renderPage(service: {
  list: jest.Mock;
  create: jest.Mock;
  update: jest.Mock;
}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <AdminEntityListPage<Widget>
        title="Widgets"
        resourceKey="widgets"
        permissionPrefix="masterdata.widget"
        columns={[
          { key: "widgetCode", label: "Code" },
          { key: "widgetName", label: "Name" },
        ]}
        fields={FIELDS}
        service={service}
      />
    </QueryClientProvider>,
  );
}

describe("AdminEntityListPage (generic Master Data CRUD engine)", () => {
  beforeEach(() => {
    useAuthStore.getState().setSession({
      accessToken: "t",
      refreshToken: "r",
      user: { id: "u1", username: "admin", email: "admin@example.com" },
      role: "ADMINISTRATOR",
      roles: ["ADMINISTRATOR"],
      permissions: ["masterdata.widget.manage"],
    });
  });

  afterEach(() => useAuthStore.getState().clearSession());

  it("shows an empty state when there are no items", async () => {
    const service = { list: jest.fn().mockResolvedValue({ items: [] }), create: jest.fn(), update: jest.fn() };

    renderPage(service);

    expect(await screen.findByText("No widgets found")).toBeInTheDocument();
  });

  it("renders rows and creates a new item via the modal form", async () => {
    const user = userEvent.setup();
    const service = {
      list: jest.fn().mockResolvedValue({ items: [{ id: "w1", widgetCode: "W1", widgetName: "First Widget", isActive: true }] }),
      create: jest.fn().mockResolvedValue({ id: "w2", widgetCode: "W2", widgetName: "Second Widget", isActive: true }),
      update: jest.fn(),
    };

    renderPage(service);
    expect(await screen.findByText("First Widget")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "New Widget" }));
    await user.type(screen.getByLabelText("Widget Code"), "W2");
    await user.type(screen.getByLabelText("Widget Name"), "Second Widget");
    await user.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() => expect(service.create).toHaveBeenCalledWith({ widgetCode: "W2", widgetName: "Second Widget" }));
  });

  it("toggles isActive via the Deactivate/Activate action", async () => {
    const user = userEvent.setup();
    const service = {
      list: jest.fn().mockResolvedValue({ items: [{ id: "w1", widgetCode: "W1", widgetName: "First Widget", isActive: true }] }),
      create: jest.fn(),
      update: jest.fn().mockResolvedValue({ id: "w1", widgetCode: "W1", widgetName: "First Widget", isActive: false }),
    };

    renderPage(service);
    await screen.findByText("First Widget");
    await user.click(screen.getByRole("button", { name: "Deactivate" }));

    await waitFor(() => expect(service.update).toHaveBeenCalledWith("w1", { isActive: false }));
  });

  it("edit modal omits createOnly fields", async () => {
    const user = userEvent.setup();
    const service = {
      list: jest.fn().mockResolvedValue({ items: [{ id: "w1", widgetCode: "W1", widgetName: "First Widget", isActive: true }] }),
      create: jest.fn(),
      update: jest.fn(),
    };

    renderPage(service);
    await screen.findByText("First Widget");
    await user.click(screen.getByRole("button", { name: "Edit" }));

    expect(screen.getByRole("dialog", { name: "Edit Widget" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Widget Code")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Widget Name")).toBeInTheDocument();
  });

  it("edits a non-createOnly field inline without opening the modal", async () => {
    const user = userEvent.setup();
    const service = {
      list: jest.fn().mockResolvedValue({ items: [{ id: "w1", widgetCode: "W1", widgetName: "First Widget", isActive: true }] }),
      create: jest.fn(),
      update: jest.fn().mockResolvedValue({ id: "w1", widgetCode: "W1", widgetName: "Renamed Widget", isActive: true }),
    };

    renderPage(service);
    await screen.findByText("First Widget");

    await user.click(screen.getByRole("button", { name: "Edit Widget Name for W1" }));
    const input = screen.getByLabelText("Widget Name for W1");
    await user.clear(input);
    await user.type(input, "Renamed Widget");
    await user.keyboard("{Enter}");

    await waitFor(() => expect(service.update).toHaveBeenCalledWith("w1", { widgetName: "Renamed Widget" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("reverts an inline edit on Escape without calling update", async () => {
    const user = userEvent.setup();
    const service = {
      list: jest.fn().mockResolvedValue({ items: [{ id: "w1", widgetCode: "W1", widgetName: "First Widget", isActive: true }] }),
      create: jest.fn(),
      update: jest.fn(),
    };

    renderPage(service);
    await screen.findByText("First Widget");

    await user.click(screen.getByRole("button", { name: "Edit Widget Name for W1" }));
    await user.type(screen.getByLabelText("Widget Name for W1"), " extra");
    await user.keyboard("{Escape}");

    expect(await screen.findByText("First Widget")).toBeInTheDocument();
    expect(service.update).not.toHaveBeenCalled();
  });
});
