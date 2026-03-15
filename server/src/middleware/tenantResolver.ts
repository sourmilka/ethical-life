import type { Request, Response, NextFunction } from "express";
import { prisma } from "../config/database.js";
import { NotFoundError } from "../utils/errors.js";

export interface TenantRequest extends Request {
  tenantId: string;
}

/**
 * Resolves tenant from subdomain or custom domain.
 * For dashboard API calls, the tenantId comes from the authenticated user's token.
 * For public site rendering, this middleware resolves by host header.
 */
export function tenantResolver(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  // If authenticated, tenantId already set from JWT
  if ((req as any).user?.tenantId) {
    (req as TenantRequest).tenantId = (req as any).user.tenantId;
    next();
    return;
  }

  // Otherwise resolve from hostname
  resolveTenantFromHost(req)
    .then((tenantId) => {
      (req as TenantRequest).tenantId = tenantId;
      next();
    })
    .catch(next);
}

async function resolveTenantFromHost(req: Request): Promise<string> {
  const host = req.hostname;

  // Try custom domain first
  const byDomain = await prisma.tenant.findUnique({
    where: { customDomain: host },
    select: { id: true, status: true },
  });
  if (byDomain) {
    if (byDomain.status !== "active") {
      throw new NotFoundError("Tenant is not active");
    }
    return byDomain.id;
  }

  // Try slug from subdomain (e.g. my-biz.platform.com)
  const parts = host.split(".");
  if (parts.length >= 2) {
    const slug = parts[0];
    const bySlug = await prisma.tenant.findUnique({
      where: { slug },
      select: { id: true, status: true },
    });
    if (bySlug) {
      if (bySlug.status !== "active") {
        throw new NotFoundError("Tenant is not active");
      }
      return bySlug.id;
    }
  }

  throw new NotFoundError("Tenant not found");
}
