import type { Request, Response, NextFunction } from "express";
import { prisma } from "../config/database.js";
import type { AuthenticatedRequest } from "./auth.js";

type AuditAction =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "LOGIN"
  | "LOGOUT"
  | "REGISTER"
  | "PASSWORD_CHANGE";

export function auditLog(action: AuditAction, entityType: string) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    const user = (req as AuthenticatedRequest).user;
    if (!user) {
      next();
      return;
    }

    try {
      await prisma.auditLog.create({
        data: {
          tenantId: user.tenantId,
          userId: user.userId,
          action,
          entityType,
          entityId: (typeof req.params.id === "string" ? req.params.id : null),
          ipAddress: req.ip ?? null,
          userAgent: req.headers["user-agent"] ?? null,
        },
      });
    } catch {
      // Non-blocking — don't fail the request if audit logging fails
    }

    next();
  };
}
