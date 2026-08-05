import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PatientAddressList } from "./PatientAddressList";
import { patientAddressService } from "../services/patientAddress.service";
import { regionService } from "@/features/master-data/services/region.service";
import { useAuthStore } from "@/stores/auth.store";
import { PatientAddress } from "../types/patient.types";

jest.mock("../services/patientAddress.service");
jest.mock("@/features/master-data/services/region.service");
const mockedPatientAddressService = jest.mocked(patientAddressService);
const mockedRegionService = jest.mocked(regionService);

function renderList() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <PatientAddressList patientId="p1" />
    </QueryClientProvider>,
  );
}

function buildAddress(overrides: Partial<PatientAddress> = {}): PatientAddress {
  return {
    id: "a1",
    province: { id: "prov-1", name: "DKI Jakarta" },
    regency: { id: "reg-1", name: "Jakarta Selatan" },
    district: { id: "dist-1", name: "Kebayoran Baru" },
    village: { id: "vil-1", name: "Gandaria Utara" },
    addressLine: "Jl. Gandaria I No. 10",
    postalCode: "12140",
    isPrimary: true,
    ...overrides,
  };
}

describe("PatientAddressList", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.getState().setSession({
      accessToken: "t",
      refreshToken: "r",
      user: { id: "u1", username: "staff", email: "staff@example.com" },
      role: "REGISTRATION",
      roles: ["REGISTRATION"],
      permissions: ["patient.update"],
    });
    mockedRegionService.listProvinces.mockResolvedValue([{ id: "prov-1", provinceCode: "DKI", provinceName: "DKI Jakarta", isActive: true }]);
    mockedRegionService.listRegencies.mockResolvedValue([
      { id: "reg-1", provinceId: "prov-1", regencyCode: "JKT-SEL", regencyName: "Jakarta Selatan", isActive: true },
    ]);
    mockedRegionService.listDistricts.mockResolvedValue([
      { id: "dist-1", regencyId: "reg-1", districtCode: "KBY", districtName: "Kebayoran Baru", isActive: true },
    ]);
    mockedRegionService.listVillages.mockResolvedValue([
      { id: "vil-1", districtId: "dist-1", villageCode: "GNDR", villageName: "Gandaria Utara", postalCode: "12140", isActive: true },
    ]);
  });

  afterEach(() => useAuthStore.getState().clearSession());

  it("shows an empty state when the patient has no addresses", async () => {
    mockedPatientAddressService.list.mockResolvedValue([]);

    renderList();

    expect(await screen.findByText("No addresses yet")).toBeInTheDocument();
  });

  it("renders an address card with its resolved region names and a Primary badge", async () => {
    mockedPatientAddressService.list.mockResolvedValue([buildAddress()]);

    renderList();

    expect(await screen.findByText("Jl. Gandaria I No. 10")).toBeInTheDocument();
    expect(screen.getByText(/Gandaria Utara, Kebayoran Baru, Jakarta Selatan, DKI Jakarta/)).toBeInTheDocument();
    expect(screen.getByText("Alamat Utama")).toBeInTheDocument();
  });

  it("adds a new address by filling the cascading region selects and address line", async () => {
    const user = userEvent.setup();
    mockedPatientAddressService.list.mockResolvedValue([]);
    mockedPatientAddressService.add.mockResolvedValue(buildAddress());

    renderList();
    await screen.findByText("No addresses yet");

    await user.click(screen.getByRole("button", { name: "Add Address" }));
    await user.selectOptions(await screen.findByLabelText("Provinsi"), "prov-1");
    await user.selectOptions(await screen.findByLabelText("Kabupaten/Kota"), "reg-1");
    await user.selectOptions(await screen.findByLabelText("Kecamatan"), "dist-1");
    await user.selectOptions(await screen.findByLabelText("Kelurahan/Desa"), "vil-1");
    await user.type(screen.getByLabelText("Address Line"), "Jl. Gandaria I No. 10");
    const dialog = screen.getByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Add Address" }));

    await waitFor(() =>
      expect(mockedPatientAddressService.add).toHaveBeenCalledWith("p1", {
        provinceId: "prov-1",
        regencyId: "reg-1",
        districtId: "dist-1",
        villageId: "vil-1",
        addressLine: "Jl. Gandaria I No. 10",
        postalCode: undefined,
      }),
    );
  });

  it("sets a non-primary address as primary", async () => {
    const user = userEvent.setup();
    const secondary = buildAddress({ id: "a2", isPrimary: false, addressLine: "Jl. Kedua" });
    mockedPatientAddressService.list.mockResolvedValue([buildAddress(), secondary]);
    mockedPatientAddressService.setPrimary.mockResolvedValue({ ...secondary, isPrimary: true });

    renderList();
    await screen.findByText("Jl. Kedua");

    await user.click(screen.getByRole("button", { name: "Set as Primary" }));

    await waitFor(() => expect(mockedPatientAddressService.setPrimary).toHaveBeenCalledWith("p1", "a2"));
  });
});
