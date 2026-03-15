import type { Request, Response, NextFunction } from "express";
import { prisma } from "../../config/database.js";
import type { AuthenticatedRequest } from "../../middleware/auth.js";
import { NotFoundError } from "../../utils/errors.js";
import { cacheGet, cacheSet, cacheDel, settingsKey, CacheTTL } from "../../services/cache.service.js";

// ── GET /api/settings ─────────────────────────────────────
export async function getSettings(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { tenantId } = (req as AuthenticatedRequest).user;
    const cacheK = settingsKey(tenantId);

    const cached = await cacheGet(cacheK);
    if (cached) {
      res.json({ success: true, data: cached });
      return;
    }

    const settings = await prisma.siteSettings.findUnique({
      where: { tenantId },
    });
    if (!settings) {
      throw new NotFoundError("Site settings not found");
    }

    await cacheSet(cacheK, settings, CacheTTL.SETTINGS);
    res.json({ success: true, data: settings });
  } catch (err) {
    next(err);
  }
}

// ── Shared partial update helper ──────────────────────────
async function patchSettings(
  tenantId: string,
  data: Record<string, unknown>,
) {
  const settings = await prisma.siteSettings.update({
    where: { tenantId },
    data,
  });
  await cacheDel(settingsKey(tenantId));
  return settings;
}

// ── PATCH /api/settings/branding ──────────────────────────
export async function updateBranding(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { tenantId } = (req as AuthenticatedRequest).user;
    const settings = await patchSettings(tenantId, req.body);
    res.json({ success: true, data: settings });
  } catch (err) {
    next(err);
  }
}

// ── PATCH /api/settings/colors ────────────────────────────
export async function updateColors(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { tenantId } = (req as AuthenticatedRequest).user;
    const settings = await patchSettings(tenantId, req.body);
    res.json({ success: true, data: settings });
  } catch (err) {
    next(err);
  }
}

// ── PATCH /api/settings/contact ───────────────────────────
export async function updateContact(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { tenantId } = (req as AuthenticatedRequest).user;
    const settings = await patchSettings(tenantId, req.body);
    res.json({ success: true, data: settings });
  } catch (err) {
    next(err);
  }
}

// ── PATCH /api/settings/seo ──────────────────────────────
export async function updateSeo(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { tenantId } = (req as AuthenticatedRequest).user;
    const settings = await patchSettings(tenantId, req.body);
    res.json({ success: true, data: settings });
  } catch (err) {
    next(err);
  }
}

// ── PATCH /api/settings/promo ─────────────────────────────
export async function updatePromo(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { tenantId } = (req as AuthenticatedRequest).user;
    const settings = await patchSettings(tenantId, req.body);
    res.json({ success: true, data: settings });
  } catch (err) {
    next(err);
  }
}

// ── PATCH /api/settings/app-links ─────────────────────────
export async function updateAppLinks(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { tenantId } = (req as AuthenticatedRequest).user;
    const settings = await patchSettings(tenantId, req.body);
    res.json({ success: true, data: settings });
  } catch (err) {
    next(err);
  }
}

// ── PATCH /api/settings/footer ────────────────────────────
export async function updateFooter(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { tenantId } = (req as AuthenticatedRequest).user;
    const settings = await patchSettings(tenantId, req.body);
    res.json({ success: true, data: settings });
  } catch (err) {
    next(err);
  }
}

// ── PATCH /api/settings/legal ─────────────────────────────
export async function updateLegal(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { tenantId } = (req as AuthenticatedRequest).user;
    const settings = await patchSettings(tenantId, req.body);
    res.json({ success: true, data: settings });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/settings/tenant ──────────────────────────────
export async function getTenant(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { tenantId } = (req as AuthenticatedRequest).user;
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
        slug: true,
        customDomain: true,
        plan: true,
        status: true,
        barterpayMerchantId: true,
        createdAt: true,
      },
    });
    if (!tenant) {
      throw new NotFoundError("Tenant not found");
    }
    res.json({ success: true, data: tenant });
  } catch (err) {
    next(err);
  }
}

// ── PATCH /api/settings/tenant ────────────────────────────
export async function updateTenant(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { tenantId } = (req as AuthenticatedRequest).user;
    const tenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: req.body,
      select: {
        id: true,
        name: true,
        slug: true,
        customDomain: true,
        plan: true,
        status: true,
        barterpayMerchantId: true,
        createdAt: true,
      },
    });
    res.json({ success: true, data: tenant });
  } catch (err) {
    next(err);
  }
}
