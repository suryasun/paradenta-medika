export interface LoginRequest {
  identifier: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: { id: string; username: string; email: string };
  role: string;
  roles: string[];
  permissions: string[];
}
