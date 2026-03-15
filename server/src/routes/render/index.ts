import { Router } from "express";
import { tenantResolver, type TenantRequest } from "../../middleware/tenantResolver.js";
import { loadTenantData } from "../../services/tenantData.js";
import { param } from "../../utils/params.js";

const router = Router();

// All rendered pages go through tenant resolution
router.use(tenantResolver);

// Helper to get template slug (fallback to default)
function templateSlug(data: Record<string, unknown>): string {
  const t = data.template as { slug?: string } | undefined;
  return t?.slug || "healthcare-pro";
}

// ── Home page ──────────────────────────────────────────────
router.get("/", async (req, res, next) => {
  try {
    const data = await loadTenantData((req as TenantRequest).tenantId, "home");
    const slug = templateSlug(data);
    res.render(`${slug}/pages/home`, {
      ...data,
      pageTitle: (data.settings as any)?.metaTitle || (data.settings as any)?.companyName || "",
      pageDescription: (data.settings as any)?.metaDescription || "",
      pageScript: "home",
    });
  } catch (err) {
    next(err);
  }
});

// ── Content pages ──────────────────────────────────────────
const contentPages = ["shop", "about", "blog", "contact", "faq", "careers", "terms", "privacy"];
for (const slug of contentPages) {
  router.get(`/pages/${slug}.html`, async (req, res, next) => {
    try {
      const data = await loadTenantData((req as TenantRequest).tenantId, slug);
      const tpl = templateSlug(data);
      const page = data.page as { isActive?: boolean; title?: string; metaDescription?: string } | null;
      if (page && !page.isActive) {
        return res.status(404).render(`${tpl}/pages/404`, { ...data, pageTitle: "Page Not Found", pageScript: "404" });
      }
      res.render(`${tpl}/pages/${slug}`, {
        ...data,
        pageTitle: page?.title || (data.settings as any)?.companyName || "",
        pageDescription: page?.metaDescription || "",
        pageScript: slug,
      });
    } catch (err) {
      next(err);
    }
  });
}

// ── Product detail ─────────────────────────────────────────
router.get("/pages/product.html", async (req, res, next) => {
  try {
    const productSlug = typeof req.query.product === "string" ? req.query.product : undefined;
    const data = await loadTenantData((req as TenantRequest).tenantId, "product", { productSlug });
    const tpl = templateSlug(data);
    const product = (data as Record<string, unknown>).product as { title?: string } | null;
    if (!product) {
      return res.status(404).render(`${tpl}/pages/404`, { ...data, pageTitle: "Product Not Found", pageScript: "404" });
    }
    res.render(`${tpl}/pages/product`, {
      ...data,
      pageTitle: `${product.title} | ${(data.settings as any)?.companyName || ""}`,
      pageDescription: "",
      pageScript: "product",
    });
  } catch (err) {
    next(err);
  }
});

// ── Blog post detail ───────────────────────────────────────
router.get("/pages/blog/:slug", async (req, res, next) => {
  try {
    const postSlug = param(req, "slug");
    const data = await loadTenantData((req as unknown as TenantRequest).tenantId, "blog-post", { postSlug });
    const tpl = templateSlug(data);
    const blogPost = (data as Record<string, unknown>).blogPost as { title?: string } | null;
    if (!blogPost) {
      return res.status(404).render(`${tpl}/pages/404`, { ...data, pageTitle: "Post Not Found", pageScript: "404" });
    }
    res.render(`${tpl}/pages/blog-post`, {
      ...data,
      pageTitle: `${blogPost.title} | ${(data.settings as any)?.companyName || ""}`,
      pageDescription: "",
      pageScript: "blog",
    });
  } catch (err) {
    next(err);
  }
});

// ── Forms page ─────────────────────────────────────────────
router.get("/pages/forms.html", async (req, res, next) => {
  try {
    const formSlug = typeof req.query.form === "string" ? req.query.form : "patient-intake";
    const data = await loadTenantData((req as TenantRequest).tenantId, "forms", { formSlug });
    const tpl = templateSlug(data);
    res.render(`${tpl}/pages/forms`, {
      ...data,
      pageTitle: "Intake Form",
      pageDescription: "",
      pageScript: "forms",
    });
  } catch (err) {
    next(err);
  }
});

// ── Payment page ───────────────────────────────────────────
router.get("/pages/payment.html", async (req, res, next) => {
  try {
    const data = await loadTenantData((req as TenantRequest).tenantId, "payment");
    const tpl = templateSlug(data);
    const submissionId = typeof req.query.submission === "string" ? req.query.submission : "";
    res.render(`${tpl}/pages/payment`, {
      ...data,
      submissionId,
      pageTitle: "Payment",
      pageDescription: "",
      pageScript: "payment",
    });
  } catch (err) {
    next(err);
  }
});

// ── Thank you page ─────────────────────────────────────────
router.get("/pages/thank-you.html", async (req, res, next) => {
  try {
    const data = await loadTenantData((req as TenantRequest).tenantId, "thank-you");
    const tpl = templateSlug(data);
    res.render(`${tpl}/pages/thank-you`, {
      ...data,
      pageTitle: "Thank You",
      pageDescription: "",
      pageScript: "thankyou",
    });
  } catch (err) {
    next(err);
  }
});

// ── 404 catch-all ──────────────────────────────────────────
router.use(async (req, res, next) => {
  try {
    const data = await loadTenantData((req as TenantRequest).tenantId, "404");
    const tpl = templateSlug(data);
    res.status(404).render(`${tpl}/pages/404`, {
      ...data,
      pageTitle: "Page Not Found",
      pageDescription: "",
      pageScript: "404",
    });
  } catch (err) {
    next(err);
  }
});

export default router;
