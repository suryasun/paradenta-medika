import { useAuthStore } from "./auth.store";

const SESSION = {
  accessToken: "access-1",
  refreshToken: "refresh-1",
  user: { id: "u1", username: "jdoe", email: "jdoe@example.com" },
  role: "DOCTOR",
  roles: ["DOCTOR"],
  permissions: ["emr.visit.read", "emr.visit.create"],
};

describe("useAuthStore", () => {
  beforeEach(() => {
    useAuthStore.getState().clearSession();
  });

  it("starts with no active session", () => {
    const state = useAuthStore.getState();
    expect(state.accessToken).toBeNull();
    expect(state.user).toBeNull();
    expect(state.permissions).toEqual([]);
  });

  it("setSession stores the full session and hasPermission reflects it", () => {
    useAuthStore.getState().setSession(SESSION);

    const state = useAuthStore.getState();
    expect(state.accessToken).toBe("access-1");
    expect(state.user).toEqual(SESSION.user);
    expect(state.hasPermission("emr.visit.read")).toBe(true);
    expect(state.hasPermission("billing.invoice.close")).toBe(false);
  });

  it("setTokens updates only the token pair, leaving user/permissions intact", () => {
    useAuthStore.getState().setSession(SESSION);

    useAuthStore.getState().setTokens({ accessToken: "access-2", refreshToken: "refresh-2" });

    const state = useAuthStore.getState();
    expect(state.accessToken).toBe("access-2");
    expect(state.refreshToken).toBe("refresh-2");
    expect(state.user).toEqual(SESSION.user);
    expect(state.permissions).toEqual(SESSION.permissions);
  });

  it("clearSession resets everything, including permissions", () => {
    useAuthStore.getState().setSession(SESSION);

    useAuthStore.getState().clearSession();

    const state = useAuthStore.getState();
    expect(state.accessToken).toBeNull();
    expect(state.refreshToken).toBeNull();
    expect(state.user).toBeNull();
    expect(state.role).toBeNull();
    expect(state.roles).toEqual([]);
    expect(state.permissions).toEqual([]);
  });
});
