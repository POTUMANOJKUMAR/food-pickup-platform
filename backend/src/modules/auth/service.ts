import { createHash, randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { env } from "../../config/env.js";
import { isRole } from "../../constants/roles.js";
import { AppError } from "../../utils/app-error.js";
import {
  authRepository,
  type AuthRepository,
  type PublicUserRecord,
} from "./repository.js";
import type {
  AuthResponseDTO,
  LoginRequestDTO,
  LogoutRequestDTO,
  LogoutResponseDTO,
  RefreshResponseDTO,
  RefreshTokenRequestDTO,
  RegisterRequestDTO,
  TokenPairResponseDTO,
  UserResponseDTO,
} from "./types.js";

const PASSWORD_HASH_ROUNDS = 12;
const durationMultipliers = {
  s: 1,
  m: 60,
  h: 60 * 60,
  d: 24 * 60 * 60,
} as const;

type DurationUnit = keyof typeof durationMultipliers;

interface RefreshJwtPayload extends JwtPayload {
  sub: string;
  tokenId: string;
  type: "refresh";
}

interface RefreshTokenData {
  id: string;
  rawToken: string;
  tokenHash: string;
  expiresAt: Date;
}

const parseDurationSeconds = (duration: string): number => {
  const match = /^(\d+)([smhd])$/.exec(duration);

  if (match === null) {
    throw new Error(`Invalid token duration: ${duration}`);
  }

  const amount = Number(match[1]);
  const unit = match[2] as DurationUnit;
  return amount * durationMultipliers[unit];
};

const accessTokenExpiresIn = parseDurationSeconds(env.JWT_ACCESS_EXPIRES_IN);
const refreshTokenExpiresIn = parseDurationSeconds(env.JWT_REFRESH_EXPIRES_IN);

const hashToken = (token: string): string => createHash("sha256").update(token).digest("hex");

const isRefreshJwtPayload = (payload: string | JwtPayload): payload is RefreshJwtPayload =>
  typeof payload !== "string" &&
  typeof payload.sub === "string" &&
  typeof payload.tokenId === "string" &&
  payload.type === "refresh";

const toUserResponse = (user: PublicUserRecord): UserResponseDTO => {
  if (!isRole(user.role)) {
    throw new AppError("User has an invalid role", 500, false);
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
};

export class AuthService {
  public constructor(private readonly repository: AuthRepository) {}

  public async register(input: RegisterRequestDTO): Promise<AuthResponseDTO> {
    const email = input.email.trim().toLowerCase();
    const existingUser = await this.repository.findUserByEmail(email);

    if (existingUser !== null) {
      throw new AppError("An account with this email already exists", 409);
    }

    const passwordHash = await bcrypt.hash(input.password, PASSWORD_HASH_ROUNDS);
    const userId = randomUUID();
    const refreshToken = this.createRefreshToken(userId);

    try {
      const user = await this.repository.createUserWithRefreshToken(
        {
          id: userId,
          name: input.name.trim(),
          email,
          passwordHash,
        },
        {
          id: refreshToken.id,
          userId,
          tokenHash: refreshToken.tokenHash,
          expiresAt: refreshToken.expiresAt,
        },
      );
      const tokens = this.buildTokenPair(user, refreshToken.rawToken);
      return { user: toUserResponse(user), tokens };
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new AppError("An account with this email already exists", 409);
      }
      throw error;
    }
  }

  public async login(input: LoginRequestDTO): Promise<AuthResponseDTO> {
    const user = await this.repository.findUserByEmail(input.email.trim().toLowerCase());

    if (user === null || !(await bcrypt.compare(input.password, user.passwordHash))) {
      throw new AppError("Invalid email or password", 401);
    }

    if (!user.isActive) {
      throw new AppError("This account is disabled", 403);
    }

    const tokens = await this.issueTokenPair(user);
    return { user: toUserResponse(user), tokens };
  }

  public async refresh(input: RefreshTokenRequestDTO): Promise<RefreshResponseDTO> {
    const payload = this.verifyRefreshToken(input.refreshToken);
    const currentTokenHash = hashToken(input.refreshToken);
    const storedToken = await this.repository.findValidRefreshToken(payload.tokenId, currentTokenHash);

    if (storedToken === null || storedToken.user.id !== payload.sub) {
      throw new AppError("Invalid or expired refresh token", 401);
    }

    const replacement = this.createRefreshToken(storedToken.user.id);
    const rotated = await this.repository.rotateRefreshToken(payload.tokenId, currentTokenHash, {
      id: replacement.id,
      userId: storedToken.user.id,
      tokenHash: replacement.tokenHash,
      expiresAt: replacement.expiresAt,
    });

    if (!rotated) {
      throw new AppError("Refresh token has already been used", 401);
    }

    return {
      tokens: this.buildTokenPair(storedToken.user, replacement.rawToken),
    };
  }

  public async logout(input: LogoutRequestDTO): Promise<LogoutResponseDTO> {
    await this.repository.revokeRefreshToken(hashToken(input.refreshToken));
    return { loggedOut: true };
  }

  public async getCurrentUser(userId: string): Promise<UserResponseDTO> {
    const user = await this.repository.findActiveUserById(userId);

    if (user === null) {
      throw new AppError("User not found", 404);
    }

    return toUserResponse(user);
  }

  private async issueTokenPair(user: PublicUserRecord): Promise<TokenPairResponseDTO> {
    const refreshToken = this.createRefreshToken(user.id);
    await this.repository.createRefreshToken({
      id: refreshToken.id,
      userId: user.id,
      tokenHash: refreshToken.tokenHash,
      expiresAt: refreshToken.expiresAt,
    });
    return this.buildTokenPair(user, refreshToken.rawToken);
  }

  private buildTokenPair(user: PublicUserRecord, refreshToken: string): TokenPairResponseDTO {
    return {
      accessToken: jwt.sign({ role: user.role }, env.JWT_ACCESS_SECRET, {
        subject: user.id,
        expiresIn: accessTokenExpiresIn,
      }),
      refreshToken,
      tokenType: "Bearer",
      accessTokenExpiresIn,
      refreshTokenExpiresIn,
    };
  }

  private createRefreshToken(userId: string): RefreshTokenData {
    const id = randomUUID();
    const rawToken = jwt.sign({ tokenId: id, type: "refresh" }, env.JWT_REFRESH_SECRET, {
      subject: userId,
      expiresIn: refreshTokenExpiresIn,
    });

    return {
      id,
      rawToken,
      tokenHash: hashToken(rawToken),
      expiresAt: new Date(Date.now() + refreshTokenExpiresIn * 1_000),
    };
  }

  private verifyRefreshToken(token: string): RefreshJwtPayload {
    try {
      const payload = jwt.verify(token, env.JWT_REFRESH_SECRET);

      if (!isRefreshJwtPayload(payload)) {
        throw new AppError("Invalid refresh token", 401);
      }

      return payload;
    } catch (error: unknown) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Invalid or expired refresh token", 401);
    }
  }
}

export const authService = new AuthService(authRepository);
