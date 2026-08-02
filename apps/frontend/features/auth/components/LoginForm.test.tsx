import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LoginForm } from "./LoginForm";
import { authService } from "../services/auth.service";
import { useAuthStore } from "@/stores/auth.store";

jest.mock("../services/auth.service");
const mockedAuthService = jest.mocked(authService);

const push = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

function renderLoginForm() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <LoginForm />
    </QueryClientProvider>,
  );
}

describe("LoginForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.getState().clearSession();
  });

  it("submits identifier + password and, on success, stores the session and navigates to /dashboard", async () => {
    const user = userEvent.setup();
    mockedAuthService.login.mockResolvedValue({
      accessToken: "access-1",
      refreshToken: "refresh-1",
      expiresIn: 900,
      user: { id: "u1", username: "jdoe", email: "jdoe@example.com" },
      role: "DOCTOR",
      roles: ["DOCTOR"],
      permissions: ["emr.visit.read"],
    });

    renderLoginForm();
    await user.type(screen.getByLabelText("Username or Email"), "jdoe");
    await user.type(screen.getByLabelText("Password"), "S3cret!23");
    await user.click(screen.getByRole("button", { name: "Sign In" }));

    await waitFor(() => expect(mockedAuthService.login).toHaveBeenCalledWith({ identifier: "jdoe", password: "S3cret!23" }));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/dashboard"));
    expect(useAuthStore.getState().accessToken).toBe("access-1");
  });

  it("shows the backend's error message on failed login without storing a session", async () => {
    const user = userEvent.setup();
    mockedAuthService.login.mockRejectedValue({
      isAxiosError: true,
      response: { data: { success: false, code: "UNAUTHORIZED", message: "Invalid username/email or password.", errors: [] } },
    });

    renderLoginForm();
    await user.type(screen.getByLabelText("Username or Email"), "jdoe");
    await user.type(screen.getByLabelText("Password"), "wrong-password");
    await user.click(screen.getByRole("button", { name: "Sign In" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid username/email or password.");
    expect(useAuthStore.getState().accessToken).toBeNull();
    expect(push).not.toHaveBeenCalled();
  });
});
