import type { Request, Response, NextFunction } from "express";
import { prisma } from "../../config/database.js";
import type { AuthenticatedRequest } from "../../middleware/auth.js";
import { NotFoundError, BadRequestError } from "../../utils/errors.js";
import { createBarterPayTransaction, checkBarterPayStatus } from "../../services/barterpay.service.js";

function tid(req: Request): string {
  return (req as AuthenticatedRequest).user.tenantId;
}

// ═══════════════════════════════════════════════════════════
// PUBLIC — create transaction (tenant resolved, no auth)
// ═══════════════════════════════════════════════════════════

export async function createTransaction(req: Request, res: Response, next: NextFunction) {
  try {
    const tenantId = (req as any).tenantId as string | undefined;
    if (!tenantId) throw new BadRequestError("Tenant could not be resolved");

    const { submissionId, amount } = req.body as { submissionId: string; amount: number };

    // Verify submission exists and belongs to tenant
    const submission = await prisma.formSubmission.findFirst({
      where: { id: submissionId, tenantId },
      include: { formDefinition: { select: { requiresPayment: true, paymentAmount: true } } },
    });
    if (!submission) throw new NotFoundError("Submission not found");
    if (!submission.formDefinition.requiresPayment) throw new BadRequestError("This form does not require payment");

    // Get tenant BarterPay credentials
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant?.barterpayMerchantId || !tenant?.barterpayApiKey) {
      throw new BadRequestError("Payment is not configured for this site");
    }

    const result = await createBarterPayTransaction({
      merchantId: tenant.barterpayMerchantId,
      apiKey: tenant.barterpayApiKey,
      amount,
      reference: submissionId,
      description: `Submission ${submissionId}`,
    });

    if (!result.ok) {
      return res.status(502).json({ success: false, error: result.error });
    }

    // Update submission payment status
    await prisma.formSubmission.update({
      where: { id: submissionId },
      data: { paymentStatus: "pending", paymentAmount: amount },
    });

    res.json({
      success: true,
      data: {
        transactionId: result.transactionId,
        redirectUrl: result.redirectUrl,
      },
    });
  } catch (err) { next(err); }
}

// ═══════════════════════════════════════════════════════════
// PUBLIC — check status (tenant resolved, no auth)
// ═══════════════════════════════════════════════════════════

export async function checkStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const tenantId = (req as any).tenantId as string | undefined;
    if (!tenantId) throw new BadRequestError("Tenant could not be resolved");

    const { transactionId, submissionId } = req.body as { transactionId: string; submissionId: string };

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant?.barterpayMerchantId || !tenant?.barterpayApiKey) {
      throw new BadRequestError("Payment is not configured");
    }

    const result = await checkBarterPayStatus(
      tenant.barterpayMerchantId,
      tenant.barterpayApiKey,
      transactionId,
    );

    if (!result.ok) {
      return res.status(502).json({ success: false, error: result.error });
    }

    const status = (result.status ?? "").toLowerCase();

    // Update submission if payment completed
    if (status === "completed" || status === "success" || status === "paid") {
      await prisma.formSubmission.update({
        where: { id: submissionId },
        data: { paymentStatus: "completed", paidAt: new Date() },
      });
    }

    res.json({ success: true, data: { status: result.status } });
  } catch (err) { next(err); }
}

// ═══════════════════════════════════════════════════════════
// DASHBOARD — get/update BarterPay config (owner only)
// ═══════════════════════════════════════════════════════════

export async function getConfig(req: Request, res: Response, next: NextFunction) {
  try {
    const tenantId = tid(req);
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { barterpayMerchantId: true, barterpayApiKey: true },
    });
    if (!tenant) throw new NotFoundError("Tenant not found");

    res.json({
      success: true,
      data: {
        barterpayMerchantId: tenant.barterpayMerchantId,
        // Mask the API key — only show last 4 chars
        barterpayApiKey: tenant.barterpayApiKey
          ? `${"*".repeat(Math.max(0, tenant.barterpayApiKey.length - 4))}${tenant.barterpayApiKey.slice(-4)}`
          : null,
      },
    });
  } catch (err) { next(err); }
}

export async function updateConfig(req: Request, res: Response, next: NextFunction) {
  try {
    const tenantId = tid(req);
    const { barterpayMerchantId, barterpayApiKey } = req.body as {
      barterpayMerchantId?: string | null;
      barterpayApiKey?: string | null;
    };

    const data: Record<string, unknown> = {};
    if (barterpayMerchantId !== undefined) data.barterpayMerchantId = barterpayMerchantId;
    if (barterpayApiKey !== undefined) data.barterpayApiKey = barterpayApiKey;

    await prisma.tenant.update({ where: { id: tenantId }, data });

    res.json({ success: true, message: "BarterPay configuration updated" });
  } catch (err) { next(err); }
}
