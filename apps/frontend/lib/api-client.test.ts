import MockAdapter from "axios-mock-adapter";
import axios from "axios";
import { apiClient } from "./api-client";
import { useAuthStore } from "@/stores/auth.store";
import { API_BASE_URL } from "@/config/env";

describe("apiClient", () => {
  let mock: MockAdapter;
  let rootMock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(apiClient);
    // refreshAccessToken() calls the bare `axios` instance, not apiClient, to
    // avoid recursing through apiClient's own interceptors.
    rootMock = new MockAdapter(axios);
    useAuthStore.getState().clearSession();
  });

  afterEach(() => {
    mock.restore();
    rootMock.restore();
  });

  it("attaches the Bearer token from the auth store to outgoing requests", async () => {
    useAuthStore.getState().setSession({
      accessToken: "token-abc",
      refreshToken: "refresh-abc",
      user: { id: "u1", username: "jdoe", email: "jdoe@example.com" },
      role: "DOCTOR",
      roles: ["DOCTOR"],
      permissions: [],
    });
    mock.onGet("/patients").reply((config) => {
      expect(config.headers?.Authorization).toBe("Bearer token-abc");
      return [200, { success: true, message: "OK", data: [] }];
    });

    await apiClient.get("/patients");
  });

  it("does not attach an Authorization header when there is no session", async () => {
    mock.onGet("/patients").reply((config) => {
      expect(config.headers?.Authorization).toBeUndefined();
      return [200, { success: true, message: "OK", data: [] }];
    });

    await apiClient.get("/patients");
  });

  it("on a 401, silently refreshes the token and retries the original request exactly once", async () => {
    useAuthStore.getState().setSession({
      accessToken: "expired-token",
      refreshToken: "valid-refresh",
      user: { id: "u1", username: "jdoe", email: "jdoe@example.com" },
      role: "DOCTOR",
      roles: ["DOCTOR"],
      permissions: [],
    });

    let attempt = 0;
    mock.onGet("/patients").reply((config) => {
      attempt += 1;
      if (config.headers?.Authorization === "Bearer expired-token") {
        return [401, { success: false, code: "UNAUTHORIZED", message: "Token expired", errors: [] }];
      }
      expect(config.headers?.Authorization).toBe("Bearer new-access-token");
      return [200, { success: true, message: "OK", data: [] }];
    });
    rootMock.onPost(`${API_BASE_URL}/auth/refresh`).reply(200, {
      success: true,
      message: "OK",
      data: { accessToken: "new-access-token", refreshToken: "new-refresh-token" },
    });

    const response = await apiClient.get("/patients");

    expect(response.status).toBe(200);
    expect(attempt).toBe(2);
    expect(useAuthStore.getState().accessToken).toBe("new-access-token");
    expect(useAuthStore.getState().refreshToken).toBe("new-refresh-token");
  });

  it("clears the session and lets the 401 propagate when the refresh itself fails", async () => {
    // The subsequent window.location.href = "/login" redirect is not
    // asserted here: jsdom's Location object hard-locks its `href`
    // accessor (non-configurable, "Not implemented: navigation" on set),
    // so it cannot be observed or stubbed in this test environment. The
    // behavior that IS verifiable and matters most -- session cleared,
    // original request ultimately rejected rather than silently retried
    // forever -- is what's asserted below.
    useAuthStore.getState().setSession({
      accessToken: "expired-token",
      refreshToken: "revoked-refresh",
      user: { id: "u1", username: "jdoe", email: "jdoe@example.com" },
      role: "DOCTOR",
      roles: ["DOCTOR"],
      permissions: ["patient.read"],
    });
    mock.onGet("/patients").reply(401, { success: false, code: "UNAUTHORIZED", message: "Token expired", errors: [] });
    rootMock.onPost(`${API_BASE_URL}/auth/refresh`).reply(401, {
      success: false,
      code: "UNAUTHORIZED",
      message: "Refresh token revoked",
      errors: [],
    });

    await expect(apiClient.get("/patients")).rejects.toBeTruthy();

    expect(useAuthStore.getState().accessToken).toBeNull();
    expect(useAuthStore.getState().permissions).toEqual([]);
  });
});
