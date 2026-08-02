import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AuthUser {
  id: string;
  username: string;
  email: string;
}

export interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  role: string | null;
  roles: string[];
  permissions: string[];
  setSession: (session: {
    accessToken: string;
    refreshToken: string;
    user: AuthUser;
    role: string;
    roles: string[];
    permissions: string[];
  }) => void;
  setTokens: (tokens: { accessToken: string; refreshToken: string }) => void;
  clearSession: () => void;
  hasPermission: (permissionCode: string) => boolean;
}

// AUTH-027 (docs/04-ai-contract/05-auth-contract.md): client-side
// access-token storage is explicitly NOT DEFINED IN SAD. Persisting to
// localStorage via zustand/persist is a pragmatic implementer choice (no
// httpOnly-cookie infrastructure exists on the backend -- LoginUseCase
// returns both tokens in the JSON body, not a Set-Cookie header), not a
// documented requirement. Revisit if a stricter storage policy is decided.
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      role: null,
      roles: [],
      permissions: [],
      setSession: (session) =>
        set({
          accessToken: session.accessToken,
          refreshToken: session.refreshToken,
          user: session.user,
          role: session.role,
          roles: session.roles,
          permissions: session.permissions,
        }),
      setTokens: (tokens) => set({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken }),
      clearSession: () =>
        set({ accessToken: null, refreshToken: null, user: null, role: null, roles: [], permissions: [] }),
      hasPermission: (permissionCode) => get().permissions.includes(permissionCode),
    }),
    { name: "parakita-auth" },
  ),
);
