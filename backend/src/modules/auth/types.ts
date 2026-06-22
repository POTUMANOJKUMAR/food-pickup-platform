import type { Role } from "../../constants/roles.js";

export interface RegisterRequestDTO {
  name: string;
  email: string;
  password: string;
}

export interface LoginRequestDTO {
  email: string;
  password: string;
}

export interface RefreshTokenRequestDTO {
  refreshToken: string;
}

export type LogoutRequestDTO = RefreshTokenRequestDTO;

export interface UserResponseDTO {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

export interface TokenPairResponseDTO {
  accessToken: string;
  refreshToken: string;
  tokenType: "Bearer";
  accessTokenExpiresIn: number;
  refreshTokenExpiresIn: number;
}

export interface AuthResponseDTO {
  user: UserResponseDTO;
  tokens: TokenPairResponseDTO;
}

export interface RefreshResponseDTO {
  tokens: TokenPairResponseDTO;
}

export interface LogoutResponseDTO {
  loggedOut: true;
}
