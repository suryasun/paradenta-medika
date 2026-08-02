import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AttachmentSection } from "./AttachmentSection";
import { emrService } from "../services/emr.service";
import { useAuthStore } from "@/stores/auth.store";

jest.mock("../services/emr.service");
const mockedEmrService = jest.mocked(emrService);

function renderSection(readOnly = false) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <AttachmentSection visitId="v1" patientId="p1" readOnly={readOnly} />
    </QueryClientProvider>,
  );
}

describe("AttachmentSection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedEmrService.listVisitAttachments.mockResolvedValue([]);
    useAuthStore.getState().setSession({
      accessToken: "t",
      refreshToken: "r",
      user: { id: "u1", username: "doc", email: "doc@example.com" },
      role: "DOCTOR",
      roles: ["DOCTOR"],
      permissions: ["emr.attachment.upload", "emr.attachment.archive", "emr.attachment.annotate", "emr.attachment.restore"],
    });
  });

  afterEach(() => useAuthStore.getState().clearSession());

  it("shows an empty state when no attachments are recorded", async () => {
    renderSection();
    expect(await screen.findByText("No attachments uploaded yet")).toBeInTheDocument();
  });

  it("uploads a new attachment", async () => {
    const user = userEvent.setup();
    mockedEmrService.uploadAttachment.mockResolvedValue({
      id: "a1",
      visitId: "v1",
      patientId: "p1",
      category: "X_RAY",
      attachmentType: null,
      currentVersion: {
        id: "v1",
        versionNumber: 1,
        fileName: "xray.jpg",
        extension: "jpg",
        mimeType: "image/jpeg",
        fileSize: 1024,
        checksum: "abc",
        createdAt: "2026-08-02T00:00:00.000Z",
        createdBy: "u1",
      },
      archivedAt: null,
      createdAt: "2026-08-02T00:00:00.000Z",
      createdBy: "u1",
    });
    renderSection();
    await screen.findByText("No attachments uploaded yet");

    const file = new File(["fake-bytes"], "xray.jpg", { type: "image/jpeg" });
    await user.upload(screen.getByLabelText("File"), file);
    await user.selectOptions(screen.getByLabelText("Category"), "X_RAY");
    await user.click(screen.getByRole("button", { name: "Upload" }));

    await waitFor(() =>
      expect(mockedEmrService.uploadAttachment).toHaveBeenCalledWith({
        visitId: "v1",
        patientId: "p1",
        category: "X_RAY",
        attachmentType: undefined,
        file,
      }),
    );
  });

  it("lists an uploaded attachment and opens its detail modal", async () => {
    const user = userEvent.setup();
    mockedEmrService.listVisitAttachments.mockResolvedValue([
      {
        id: "a1",
        visitId: "v1",
        patientId: "p1",
        category: "X_RAY",
        attachmentType: "Periapical",
        currentVersion: {
          id: "v1",
          versionNumber: 1,
          fileName: "xray.jpg",
          extension: "jpg",
          mimeType: "image/jpeg",
          fileSize: 1024,
          checksum: "abc",
          createdAt: "2026-08-02T00:00:00.000Z",
          createdBy: "u1",
        },
        archivedAt: null,
        createdAt: "2026-08-02T00:00:00.000Z",
        createdBy: "u1",
      },
    ]);
    mockedEmrService.getAttachmentDetail.mockResolvedValue({
      id: "a1",
      visitId: "v1",
      patientId: "p1",
      category: "X_RAY",
      attachmentType: "Periapical",
      currentVersion: {
        id: "v1",
        versionNumber: 1,
        fileName: "xray.jpg",
        extension: "jpg",
        mimeType: "image/jpeg",
        fileSize: 1024,
        checksum: "abc",
        createdAt: "2026-08-02T00:00:00.000Z",
        createdBy: "u1",
      },
      archivedAt: null,
      createdAt: "2026-08-02T00:00:00.000Z",
      createdBy: "u1",
      annotations: [],
    });
    mockedEmrService.getAttachmentVersions.mockResolvedValue([]);
    renderSection();

    expect(await screen.findByText("xray.jpg")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "View" }));

    expect(await screen.findByRole("dialog", { name: "Attachment Detail" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Download" })).toBeInTheDocument();
  });

  it("hides the upload form when read-only", async () => {
    renderSection(true);
    await screen.findByText("No attachments uploaded yet");
    expect(screen.queryByLabelText("File")).not.toBeInTheDocument();
  });
});
