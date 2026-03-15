import type { Request, Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "./auth.js";
import { ForbiddenError } from "../utils/errors.js";

export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const user = (req as AuthenticatedRequest).user;
    if (!user) {
      next(new ForbiddenError("Authentication required"));
      return;
    }
    if (!roles.includes(user.role)) {
      next(new ForbiddenError(`Insufficient permissions. Required: ${roles.join(", ")}`));
      return;
    }
    next();
  };
}
