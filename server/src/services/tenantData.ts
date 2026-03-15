import { prisma } from "../config/database.js";
import { cacheGet, cacheSet, CacheTTL } from "./cache.service.js";

interface LoadOpts {
  productSlug?: string;
  postSlug?: string;
  formSlug?: string;
}

function indexByKey<T extends { sectionKey: string }>(
  sections: T[],
  key: keyof T & string,
): Record<string, T> {
  const map: Record<string, T> = {};
  for (const s of sections) {
    map[s[key] as string] = s;
  }
  return map;
}

export async function loadTenantData(tenantId: string, pageSlug: string, opts: LoadOpts = {}) {
  const cacheKey = `render:${tenantId}:${pageSlug}:${JSON.stringify(opts)}`;
  const cached = await cacheGet<Record<string, unknown>>(cacheKey);
  if (cached) return cached;

  // Common data every page needs
  const [settings, tenant, navItems, socialLinks] = await Promise.all([
    prisma.siteSettings.findFirst({ where: { tenantId } }),
    prisma.tenant.findFirst({ where: { id: tenantId }, include: { template: true } }),
    prisma.navigationItem.findMany({
      where: { tenantId, isVisible: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.socialLink.findMany({
      where: { tenantId, isVisible: true },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  const navigation = {
    navbar: navItems.filter((n) => n.location === "navbar"),
    sidebar: navItems.filter((n) => n.location === "sidebar"),
    footer_col1: navItems.filter((n) => n.location === "footer_col1"),
    footer_col2: navItems.filter((n) => n.location === "footer_col2"),
  };

  const base = {
    settings: settings || {},
    tenant,
    template: tenant?.template,
    navigation,
    socialLinks,
  };

  let pageData: Record<string, unknown> = {};

  switch (pageSlug) {
    case "home": {
      const [sections, featuredProducts, videos, homeFaqs, testimonials] = await Promise.all([
        prisma.pageSection.findMany({
          where: { tenantId, page: { slug: "home" } },
        }),
        prisma.product.findMany({
          where: { tenantId, isActive: true, isFeatured: true },
          include: { category: true },
          orderBy: { sortOrder: "asc" },
        }),
        prisma.video.findMany({
          where: { tenantId, isVisible: true },
          orderBy: { sortOrder: "asc" },
        }),
        prisma.faqItem.findMany({
          where: { tenantId, isVisible: true, pageLocation: { in: ["home", "both"] } },
          orderBy: { sortOrder: "asc" },
          take: 5,
        }),
        prisma.testimonial.findMany({
          where: { tenantId, isVisible: true },
          orderBy: { sortOrder: "asc" },
        }),
      ]);
      pageData = {
        sections: indexByKey(sections, "sectionKey"),
        featuredProducts,
        videos,
        homeFaqs,
        testimonials: testimonials.map((t) => ({
          ...t,
          content: t.reviewText,
          avatarUrl: t.authorAvatar,
        })),
      };
      break;
    }

    case "shop": {
      const [products, categories] = await Promise.all([
        prisma.product.findMany({
          where: { tenantId, isActive: true },
          include: { category: true },
          orderBy: { sortOrder: "asc" },
        }),
        prisma.productCategory.findMany({
          where: { tenantId },
          orderBy: { sortOrder: "asc" },
        }),
      ]);
      pageData = { products, categories };
      break;
    }

    case "product": {
      const product = await prisma.product.findFirst({
        where: { tenantId, slug: opts.productSlug, isActive: true },
        include: { category: true },
      });
      pageData = { product };
      break;
    }

    case "blog": {
      const blogPosts = await prisma.blogPost.findMany({
        where: { tenantId, status: "published" },
        orderBy: { publishedAt: "desc" },
        include: { category: true },
      });
      pageData = {
        blogPosts,
        featuredPost: blogPosts.find((p) => p.isFeatured) || blogPosts[0] || null,
      };
      break;
    }

    case "blog-post": {
      const blogPost = await prisma.blogPost.findFirst({
        where: { tenantId, slug: opts.postSlug, status: "published" },
        include: { category: true },
      });
      pageData = { blogPost };
      break;
    }

    case "about": {
      const [aboutSections, teamMembers] = await Promise.all([
        prisma.pageSection.findMany({
          where: { tenantId, page: { slug: "about" } },
        }),
        prisma.teamMember.findMany({
          where: { tenantId, isVisible: true },
          orderBy: { sortOrder: "asc" },
        }),
      ]);
      pageData = { sections: indexByKey(aboutSections, "sectionKey"), teamMembers };
      break;
    }

    case "contact": {
      const contactSections = await prisma.pageSection.findMany({
        where: { tenantId, page: { slug: "contact" } },
      });
      pageData = { sections: indexByKey(contactSections, "sectionKey") };
      break;
    }

    case "faq": {
      const faqCategories = await prisma.faqCategory.findMany({
        where: { tenantId },
        include: {
          items: {
            where: { isVisible: true, pageLocation: { in: ["faq_page", "both"] } },
            orderBy: { sortOrder: "asc" },
          },
        },
        orderBy: { sortOrder: "asc" },
      });
      // Group faqs by category name for the template
      const faqGroups: Record<string, typeof faqCategories[0]["items"]> = {};
      for (const cat of faqCategories) {
        if (cat.items.length > 0) {
          faqGroups[cat.name] = cat.items;
        }
      }
      pageData = { faqCategories, faqGroups };
      break;
    }

    case "careers": {
      const [jobListings, careerSections] = await Promise.all([
        prisma.jobListing.findMany({
          where: { tenantId, status: "active" },
          orderBy: { postedAt: "desc" },
        }),
        prisma.pageSection.findMany({
          where: { tenantId, page: { slug: "careers" } },
        }),
      ]);
      pageData = { jobListings, sections: indexByKey(careerSections, "sectionKey") };
      break;
    }

    case "forms": {
      const formDef = await prisma.formDefinition.findFirst({
        where: { tenantId, slug: opts.formSlug || "patient-intake", status: "active" },
        include: {
          fields: { orderBy: [{ stepNumber: "asc" }, { sortOrder: "asc" }] },
        },
      });
      pageData = { formDef };
      break;
    }

    case "terms":
    case "privacy":
    case "payment":
    case "thank-you":
    case "404":
      // These use base data (settings) only
      break;
  }

  // Get page record for meta info
  const page = await prisma.page.findFirst({ where: { tenantId, slug: pageSlug } });

  const result = { ...base, ...pageData, page };

  // Cache rendered page data
  await cacheSet(cacheKey, result, CacheTTL.DEFAULT);

  return result;
}
