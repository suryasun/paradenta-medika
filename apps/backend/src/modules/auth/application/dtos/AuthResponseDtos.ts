export interface UserProfileDto {
  id: string;
  username: string;
  email: string;
}

export interface LoginResponseDto {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: UserProfileDto;
  role: string;
  roles: string[];
  permissions: string[];
}

export interface RefreshTokenResponseDto {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
