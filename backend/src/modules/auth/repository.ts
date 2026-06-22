import type { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma.js";

const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

const authenticatedUserSelect = {
  ...publicUserSelect,
  passwordHash: true,
} satisfies Prisma.UserSelect;

export type PublicUserRecord = Prisma.UserGetPayload<{ select: typeof publicUserSelect }>;
export type AuthenticatedUserRecord = Prisma.UserGetPayload<{ select: typeof authenticatedUserSelect }>;

interface CreateUserInput {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
}

interface CreateRefreshTokenInput {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}

const validRefreshTokenSelect = {
  id: true,
  user: {
    select: publicUserSelect,
  },
} satisfies Prisma.RefreshTokenSelect;

export type ValidRefreshTokenRecord = Prisma.RefreshTokenGetPayload<{
  select: typeof validRefreshTokenSelect;
}>;

export class AuthRepository {
  public findUserByEmail(email: string): Promise<AuthenticatedUserRecord | null> {
    return prisma.user.findUnique({
      where: { email },
      select: authenticatedUserSelect,
    });
  }

  public findActiveUserById(id: string): Promise<PublicUserRecord | null> {
    return prisma.user.findFirst({
      where: { id, isActive: true },
      select: publicUserSelect,
    });
  }

  public createUserWithRefreshToken(
    user: CreateUserInput,
    refreshToken: CreateRefreshTokenInput,
  ): Promise<PublicUserRecord> {
    return prisma.$transaction(async (transaction): Promise<PublicUserRecord> => {
      const createdUser = await transaction.user.create({
        data: user,
        select: publicUserSelect,
      });
      await transaction.refreshToken.create({ data: refreshToken });
      return createdUser;
    });
  }

  public createRefreshToken(input: CreateRefreshTokenInput): Promise<void> {
    return prisma.refreshToken.create({ data: input }).then(() => undefined);
  }

  public findValidRefreshToken(id: string, tokenHash: string): Promise<ValidRefreshTokenRecord | null> {
    return prisma.refreshToken.findFirst({
      where: {
        id,
        tokenHash,
        revokedAt: null,
        expiresAt: { gt: new Date() },
        user: { isActive: true },
      },
      select: validRefreshTokenSelect,
    });
  }

  public rotateRefreshToken(
    currentTokenId: string,
    currentTokenHash: string,
    replacement: CreateRefreshTokenInput,
  ): Promise<boolean> {
    return prisma.$transaction(async (transaction): Promise<boolean> => {
      const revoked = await transaction.refreshToken.updateMany({
        where: {
          id: currentTokenId,
          tokenHash: currentTokenHash,
          revokedAt: null,
          expiresAt: { gt: new Date() },
        },
        data: { revokedAt: new Date() },
      });

      if (revoked.count !== 1) {
        return false;
      }

      await transaction.refreshToken.create({ data: replacement });
      return true;
    });
  }

  public revokeRefreshToken(tokenHash: string): Promise<void> {
    return prisma.refreshToken
      .updateMany({
        where: { tokenHash, revokedAt: null },
        data: { revokedAt: new Date() },
      })
      .then(() => undefined);
  }
}

export const authRepository = new AuthRepository();
