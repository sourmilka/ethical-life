import { logger } from "../config/logger.js";

const BARTERPAY_API_BASE = "https://api.barterpay.com/v1";

interface CreateTransactionParams {
  merchantId: string;
  apiKey: string;
  amount: number;
  currency?: string;
  reference: string;
  description?: string;
}

interface TransactionResult {
  ok: boolean;
  transactionId?: string;
  redirectUrl?: string;
  error?: string;
}

interface StatusResult {
  ok: boolean;
  status?: string;
  error?: string;
}

export async function createBarterPayTransaction(
  params: CreateTransactionParams,
): Promise<TransactionResult> {
  try {
    const res = await fetch(`${BARTERPAY_API_BASE}/transactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Merchant-Id": params.merchantId,
        Authorization: `Bearer ${params.apiKey}`,
      },
      body: JSON.stringify({
        amount: params.amount,
        currency: params.currency ?? "GBP",
        reference: params.reference,
        description: params.description ?? "Payment",
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      logger.error({ status: res.status, body: text }, "BarterPay create-transaction failed");
      return { ok: false, error: `BarterPay returned ${res.status}` };
    }

    const data = (await res.json()) as { transactionId: string; redirectUrl: string };
    return { ok: true, transactionId: data.transactionId, redirectUrl: data.redirectUrl };
  } catch (err) {
    logger.error(err, "BarterPay API request failed");
    return { ok: false, error: "Unable to reach BarterPay" };
  }
}

export async function checkBarterPayStatus(
  merchantId: string,
  apiKey: string,
  transactionId: string,
): Promise<StatusResult> {
  try {
    const res = await fetch(`${BARTERPAY_API_BASE}/transactions/${encodeURIComponent(transactionId)}/status`, {
      headers: {
        "X-Merchant-Id": merchantId,
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!res.ok) {
      return { ok: false, error: `BarterPay returned ${res.status}` };
    }

    const data = (await res.json()) as { status: string };
    return { ok: true, status: data.status };
  } catch (err) {
    logger.error(err, "BarterPay status check failed");
    return { ok: false, error: "Unable to reach BarterPay" };
  }
}
