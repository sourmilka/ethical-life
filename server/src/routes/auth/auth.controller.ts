import type { Request, Response, NextFunction } from "express";
import { prisma } from "../../config/database.js";
import { logger } from "../../config/logger.js";
import {
  hashPassword,
  verifyPassword,
  generateAccessToken,
  generateRefreshToken,
  getRefreshTokenExpiry,
} from "../../services/auth.service.js";
import type { AuthenticatedRequest } from "../../middleware/auth.js";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from "../../utils/errors.js";
import type {
  RegisterInput,
  LoginInput,
  RefreshInput,
  ChangePasswordInput,
  UpdateProfileInput,
} from "./auth.schemas.js";

// ── POST /api/auth/register ───────────────────────────────
export async function register(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { companyName, slug, email, password, fullName } =
      req.body as RegisterInput;

    // Check slug uniqueness
    const existingTenant = await prisma.tenant.findUnique({
      where: { slug },
    });
    if (existingTenant) {
      throw new ConflictError("A tenant with this slug already exists");
    }

    // Check email uniqueness across all tenants (for owner registration)
    const existingUser = await prisma.user.findFirst({
      where: { email, role: "owner" },
    });
    if (existingUser) {
      throw new ConflictError("An account with this email already exists");
    }

    const passwordHash = await hashPassword(password);

    // Create tenant + owner user in a transaction
    const { tenant, user } = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: companyName,
          slug,
          status: "active",
          plan: "starter",
        },
      });

      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email,
          passwordHash,
          fullName,
          role: "owner",
        },
      });

      // Default site settings
      await tx.siteSettings.create({
        data: {
          tenantId: tenant.id,
          companyName,
          colorPrimary: "#2e7d32",
          colorSecondary: "#00695c",
          colorAccent: "#ff8f00",
        },
      });

      return { tenant, user };
    });

    const accessToken = generateAccessToken({
      userId: user.id,
      tenantId: tenant.id,
      role: user.role,
    });
    const refreshToken = generateRefreshToken();

    await prisma.session.create({
      data: {
        userId: user.id,
        refreshToken,
        userAgent: req.headers["user-agent"] ?? null,
        ipAddress: req.ip ?? null,
        expiresAt: getRefreshTokenExpiry(),
      },
    });

    logger.info(
      { tenantId: tenant.id, userId: user.id },
      "New tenant registered",
    );

    res.status(201).json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
        },
        tenant: {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/auth/login ──────────────────────────────────
export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body as LoginInput;

    const user = await prisma.user.findFirst({
      where: { email, isActive: true },
      include: { tenant: { select: { id: true, name: true, slug: true, status: true } } },
    });
    if (!user) {
      throw new UnauthorizedError("Invalid email or password");
    }

    if (user.tenant.status !== "active") {
      throw new UnauthorizedError("Tenant account is not active");
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const accessToken = generateAccessToken({
      userId: user.id,
      tenantId: user.tenantId,
      role: user.role,
    });
    const refreshToken = generateRefreshToken();

    await prisma.session.create({
      data: {
        userId: user.id,
        refreshToken,
        userAgent: req.headers["user-agent"] ?? null,
        ipAddress: req.ip ?? null,
        expiresAt: getRefreshTokenExpiry(),
      },
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    res.json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
        },
        tenant: user.tenant,
      },
    });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/auth/refresh ────────────────────────────────
export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken: oldToken } = req.body as RefreshInput;

    const session = await prisma.session.findUnique({
      where: { refreshToken: oldToken },
      include: {
        user: {
          select: { id: true, tenantId: true, role: true, isActive: true },
        },
      },
    });

    if (!session || session.expiresAt < new Date() || !session.user.isActive) {
      if (session) {
        await prisma.session.delete({ where: { id: session.id } });
      }
      throw new UnauthorizedError("Invalid or expired refresh token");
    }

    // Rotate refresh token
    const newRefreshToken = generateRefreshToken();
    await prisma.session.update({
      where: { id: session.id },
      data: {
        refreshToken: newRefreshToken,
        expiresAt: getRefreshTokenExpiry(),
      },
    });

    const accessToken = generateAccessToken({
      userId: session.user.id,
      tenantId: session.user.tenantId,
      role: session.user.role,
    });

    res.json({
      success: true,
      data: { accessToken, refreshToken: newRefreshToken },
    });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/auth/logout ─────────────────────────────────
export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = req.body as { refreshToken?: string };

    if (refreshToken) {
      await prisma.session.deleteMany({
        where: { refreshToken },
      });
    }

    res.json({ success: true, message: "Logged out" });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/auth/me ──────────────────────────────────────
export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId } = (req as AuthenticatedRequest).user;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        avatarUrl: true,
        createdAt: true,
        tenant: {
          select: { id: true, name: true, slug: true, plan: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
}

// ── PATCH /api/auth/me ────────────────────────────────────
export async function updateMe(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { userId } = (req as AuthenticatedRequest).user;
    const data = req.body as UpdateProfileInput;

    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        avatarUrl: true,
      },
    });

    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/auth/change-password ────────────────────────
export async function changePassword(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { userId } = (req as AuthenticatedRequest).user;
    const { currentPassword, newPassword } = req.body as ChangePasswordInput;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });
    if (!user) {
      throw new NotFoundError("User not found");
    }

    const valid = await verifyPassword(currentPassword, user.passwordHash);
    if (!valid) {
      throw new BadRequestError("Current password is incorrect");
    }

    const passwordHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    // Invalidate all sessions (force re-login)
    await prisma.session.deleteMany({ where: { userId } });

    res.json({ success: true, message: "Password changed. Please log in again." });
  } catch (err) {
    next(err);
  }
}
