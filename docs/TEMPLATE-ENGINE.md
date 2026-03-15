# Template Engine

> **Last updated:** 2026-03-15
> **Renderer:** EJS (Embedded JavaScript Templates)
> **Server:** Express.js with per-tenant middleware

## 1. Overview

The Template Engine transforms the current static HTML/CSS/JS site into a dynamic, data-driven rendering system. Every tenant uses the same template files, but the content is injected from their database at render time.

**Key principle:** The template (HTML structure, CSS design, JS behavior) stays identical for all tenants. Only the DATA inside changes — text, images, colors, links, products, etc.

---

## 2. From Static to Dynamic: The Migration

### Current Flow (Static)
```
Visitor → Vite dev server → static HTML with hardcoded content
```

### Target Flow (Dynamic)
```
Visitor → Express server → tenant resolver → data fetch → EJS render → HTML response
```

### File Mapping

Every current HTML partial becomes an EJS template:

| Current File | EJS Template | Data Injected |
|-------------|-------------|---------------|
| `partials/topbar.html` | `partials/topbar.ejs` | `settings.logo_url`, `settings.promo_banner_text`, `navigation.navbar`, `navigation.sidebar` |
| `partials/hero.html` | `partials/hero.ejs` | `sections.hero.content` |
| `partials/intro.html` | `partials/intro.ejs` | `sections.intro.content` |
| `partials/carousel.html` | `partials/carousel.ejs` | `products` (featured) |
| `partials/expert.html` | `partials/expert.ejs` | `sections.expert.content` |
| `partials/video-section.html` | `partials/video-section.ejs` | `videos` |
| `partials/markers.html` | `partials/markers.ejs` | `sections.markers.content` |
| `partials/whatif.html` | `partials/whatif.ejs` | `sections.whatif.content` |
| `partials/faq.html` | `partials/faq.ejs` | `homeFaqs` |
| `partials/stories.html` | `partials/stories.ejs` | `testimonials` |
| `partials/guide.html` | `partials/guide.ejs` | `sections.guide.content` |
| `partials/footer.html` | `partials/footer.ejs` | `settings`, `navigation.footer_*`, `socialLinks` |
| `partials/shop-grid.html` | `partials/shop-grid.ejs` | `products`, `productCategories` |
| `partials/blog-content.html` | `partials/blog-content.ejs` | `blogPosts` |
| `partials/about-content.html` | `partials/about-content.ejs` | `sections.about_*`, `teamMembers` |
| `partials/contact-content.html` | `partials/contact-content.ejs` | `sections.contact_info`, `socialLinks` |
| `partials/careers-content.html` | `partials/careers-content.ejs` | `jobListings` |
| `partials/faq-page-content.html` | `partials/faq-page-content.ejs` | `faqCategories` with `faqItems` |
| `partials/privacy-content.html` | `partials/privacy-content.ejs` | `settings.privacy_content` |
| `partials/terms-content.html` | `partials/terms-content.ejs` | `settings.terms_content` |

---

## 3. Template Structure

```
templates/
└── healthcare-pro/                    # Template slug (v1 — the current design)
    ├── template.json                  # Template metadata
    ├── layouts/
    │   └── base.ejs                   # HTML shell: <head>, CSS links, <body> wrapper
    ├── pages/
    │   ├── home.ejs                   # Includes: hero, intro, carousel, expert, etc.
    │   ├── shop.ejs                   # Includes: page-hero, shop-grid
    │   ├── product.ejs                # Product detail page
    │   ├── blog.ejs                   # Blog listing
    │   ├── blog-post.ejs             # Single blog post (new!)
    │   ├── about.ejs                  # About page
    │   ├── contact.ejs                # Contact page
    │   ├── faq.ejs                    # FAQ page
    │   ├── careers.ejs                # Careers page
    │   ├── terms.ejs                  # Terms page
    │   ├── privacy.ejs                # Privacy page
    │   ├── forms.ejs                  # Intake form page
    │   ├── payment.ejs                # Payment page
    │   ├── thank-you.ejs              # Thank you page
    │   └── 404.ejs                    # 404 page
    ├── partials/
    │   ├── topbar.ejs
    │   ├── hero.ejs
    │   ├── intro.ejs
    │   ├── carousel.ejs
    │   ├── expert.ejs
    │   ├── video-section.ejs
    │   ├── markers.ejs
    │   ├── whatif.ejs
    │   ├── faq-accordion.ejs
    │   ├── stories.ejs
    │   ├── guide.ejs
    │   ├── footer.ejs
    │   ├── page-hero.ejs
    │   ├── shop-grid.ejs
    │   ├── blog-content.ejs
    │   ├── about-content.ejs
    │   ├── contact-content.ejs
    │   ├── careers-content.ejs
    │   ├── faq-page-content.ejs
    │   ├── form-left.ejs
    │   ├── form-card.ejs
    │   ├── payment-left.ejs
    │   ├── payment-card.ejs
    │   ├── thankyou-left.ejs
    │   └── thankyou-card.ejs
    └── assets/                        # Template-specific static files
        ├── css/                       # Compiled CSS (from current src/styles/)
        ├── js/                        # Compiled JS (from current src/js/)
        └── images/                    # Template default images (fallbacks)
```

---

## 4. EJS Template Examples

### 4.1 Base Layout (`layouts/base.ejs`)

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><%= pageTitle || settings.meta_title || settings.company_name %></title>
    <meta name="description" content="<%= pageDescription || settings.meta_description || '' %>">
    <% if (settings.og_image_url) { %>
    <meta property="og:image" content="<%= settings.og_image_url %>">
    <% } %>
    <% if (settings.favicon_url) { %>
    <link rel="icon" href="<%= settings.favicon_url %>">
    <% } %>

    <!-- Dynamic CSS variables from tenant branding -->
    <style>
        :root {
            --color-black: <%= settings.color_primary %>;
            --color-accent: <%= settings.color_accent %>;
            --color-secondary: <%= settings.color_secondary %>;
            --color-bg: <%= settings.color_background %>;
            --color-border: <%= settings.color_border %>;
            --color-border-light: <%= settings.color_border_light %>;
            --color-white: <%= settings.color_white %>;
        }
    </style>

    <!-- Template CSS (compiled, same for all tenants) -->
    <link rel="stylesheet" href="/assets/css/<%= template.slug %>.css">

    <% if (settings.google_analytics_id) { %>
    <script async src="https://www.googletagmanager.com/gtag/js?id=<%= settings.google_analytics_id %>"></script>
    <script>
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '<%= settings.google_analytics_id %>');
    </script>
    <% } %>
</head>
<body>
    <%- body %>

    <!-- Template JS (compiled, same for all tenants) -->
    <script type="module" src="/assets/js/<%= pageScript %>.js"></script>
</body>
</html>
```

### 4.2 Home Page (`pages/home.ejs`)

```html
<%- include('../partials/topbar', { settings, navigation }) %>

<% if (sections.hero) { %>
<%- include('../partials/hero', { hero: sections.hero.content, settings }) %>
<% } %>

<% if (sections.intro && sections.intro.is_visible) { %>
<%- include('../partials/intro', { intro: sections.intro.content }) %>
<% } %>

<% if (featuredProducts.length > 0) { %>
<%- include('../partials/carousel', { products: featuredProducts }) %>
<% } %>

<% if (sections.expert && sections.expert.is_visible) { %>
<%- include('../partials/expert', { expert: sections.expert.content }) %>
<% } %>

<% if (videos.length > 0) { %>
<%- include('../partials/video-section', { videos }) %>
<% } %>

<% if (sections.markers && sections.markers.is_visible) { %>
<%- include('../partials/markers', { markers: sections.markers.content }) %>
<% } %>

<% if (sections.whatif && sections.whatif.is_visible) { %>
<%- include('../partials/whatif', { whatif: sections.whatif.content }) %>
<% } %>

<% if (homeFaqs.length > 0) { %>
<%- include('../partials/faq-accordion', { faqs: homeFaqs }) %>
<% } %>

<% if (testimonials.length > 0) { %>
<%- include('../partials/stories', { testimonials }) %>
<% } %>

<% if (sections.guide && sections.guide.is_visible) { %>
<%- include('../partials/guide', { guide: sections.guide.content }) %>
<% } %>

<%- include('../partials/footer', { settings, navigation, socialLinks }) %>
```

### 4.3 Hero Partial (`partials/hero.ejs`)

```html
<!-- Hero Section -->
<section class="hero">
    <div class="hero-content">
        <h1 class="hero-headline"><%= hero.headline %></h1>
        <p class="hero-tagline"><%= hero.tagline %></p>
        <a href="<%= hero.cta_url || '/pages/forms.html' %>" class="hero-btn">
            <%= hero.cta_text || 'Get Started' %>
        </a>
    </div>
    <div class="hero-stats">
        <% hero.stats.forEach(function(stat) { %>
        <div class="hero-stat-box">
            <span class="hero-stat-value"><%= stat.value %></span>
            <span class="hero-stat-label"><%= stat.label %></span>
        </div>
        <% }); %>
    </div>
    <% if (hero.bg_image) { %>
    <img src="<%= hero.bg_image %>" alt="" class="hero-bg">
    <% } %>
</section>
```

### 4.4 Shop Grid Partial (`partials/shop-grid.ejs`)

```html
<!-- Product Grid Section -->
<section class="shop-section">
    <div class="shop-intro">
        <h2>Our Products</h2>
        <p><%= settings.tagline || 'Browse our product catalog.' %></p>
        <div class="shop-filters">
            <button class="shop-filter-btn active" data-filter="all">All</button>
            <% categories.forEach(function(cat) { %>
            <button class="shop-filter-btn" data-filter="<%= cat.slug %>"><%= cat.name %></button>
            <% }); %>
        </div>
    </div>

    <div class="product-grid">
        <% products.forEach(function(product) { %>
        <div class="product-card" data-category="<%= product.category ? product.category.slug : '' %>">
            <div class="product-img">
                <% if (product.image_url) { %>
                <img src="<%= product.image_url %>" alt="<%= product.title %>">
                <% } %>
                <% if (product.tag) { %>
                <span class="product-tag"><%= product.tag %></span>
                <% } %>
            </div>
            <div class="product-body">
                <h3 class="product-title"><%= product.title %></h3>
                <p class="product-desc"><%= product.description %></p>
                <div class="product-footer">
                    <span class="product-price"><%= product.price_text %></span>
                    <a href="/pages/product.html?product=<%= product.slug %>" class="product-btn">View Details</a>
                </div>
            </div>
        </div>
        <% }); %>
    </div>
</section>
```

### 4.5 Footer Partial (`partials/footer.ejs`)

```html
<!-- Footer -->
<footer class="footer">
    <div class="footer-content">
        <div class="footer-left">
            <img src="<%= settings.logo_url %>" alt="<%= settings.company_name %>" class="footer-logo">
            <div class="footer-columns">
                <div class="footer-col footer-col-social">
                    <div class="footer-socials">
                        <% socialLinks.forEach(function(link) { %>
                        <a href="<%= link.url %>" target="_blank" rel="noopener noreferrer">
                            <% if (link.icon_url) { %>
                            <img src="<%= link.icon_url %>" alt="<%= link.platform %>" class="footer-social-icon">
                            <% } else { %>
                            <img src="/assets/images/social/<%= link.platform %>.svg" alt="<%= link.platform %>" class="footer-social-icon">
                            <% } %>
                        </a>
                        <% }); %>
                    </div>
                    <p class="footer-social-text"><%= settings.footer_tagline %></p>
                </div>

                <% ['footer_col1', 'footer_col2'].forEach(function(col) { %>
                <% var colLinks = navigation[col] || []; %>
                <% if (colLinks.length > 0) { %>
                <div class="footer-col">
                    <h4 class="footer-col-title"><%= colLinks[0].group_title || '' %></h4>
                    <% colLinks.forEach(function(link) { %>
                    <a href="<%= link.url %>" class="footer-link"
                       <% if (link.open_in_new_tab) { %>target="_blank" rel="noopener noreferrer"<% } %>>
                        <%= link.label %>
                    </a>
                    <% }); %>
                </div>
                <% } %>
                <% }); %>
            </div>
        </div>
        <div class="footer-right">
            <img src="/assets/images/phone.png" alt="Mobile App" class="footer-phone">
            <p class="footer-app-text">Find us on the App Store and Google Play Store</p>
            <div class="footer-store-btns">
                <% if (settings.app_store_url) { %>
                <a href="<%= settings.app_store_url %>" class="footer-store-link">
                    <img src="/assets/images/apple.png" alt="App Store" class="footer-store-img">
                </a>
                <% } %>
                <% if (settings.play_store_url) { %>
                <a href="<%= settings.play_store_url %>" class="footer-store-link">
                    <img src="/assets/images/gplay.png" alt="Google Play" class="footer-store-img">
                </a>
                <% } %>
            </div>
        </div>
    </div>
</footer>
```

---

## 5. Rendering Server

### Express Route Handler

```typescript
// server/src/routes/public/renderer.ts

import express from 'express';
import { tenantResolver } from '../../middleware/tenantResolver';
import { loadTenantData } from '../../services/tenantData';

const router = express.Router();

// All public routes go through tenant resolution
router.use(tenantResolver);

// Home page
router.get('/', async (req, res) => {
    const data = await loadTenantData(req.tenant.id, 'home');
    res.render(`${req.tenant.templateSlug}/pages/home`, {
        ...data,
        pageTitle: data.settings.meta_title,
        pageDescription: data.settings.meta_description,
        pageScript: 'home',
    });
});

// Generic page handler for content pages
const contentPages = ['shop', 'about', 'blog', 'contact', 'faq', 'careers', 'terms', 'privacy'];
contentPages.forEach(slug => {
    router.get(`/pages/${slug}.html`, async (req, res) => {
        const data = await loadTenantData(req.tenant.id, slug);
        if (!data.page?.is_active) return res.status(404).render(`${req.tenant.templateSlug}/pages/404`, data);
        res.render(`${req.tenant.templateSlug}/pages/${slug}`, {
            ...data,
            pageTitle: data.page.title || data.settings.company_name,
            pageDescription: data.page.meta_description,
            pageScript: slug,
        });
    });
});

// Product detail page
router.get('/pages/product.html', async (req, res) => {
    const productSlug = req.query.product;
    const data = await loadTenantData(req.tenant.id, 'product', { productSlug });
    if (!data.product) return res.status(404).render(`${req.tenant.templateSlug}/pages/404`, data);
    res.render(`${req.tenant.templateSlug}/pages/product`, {
        ...data,
        pageTitle: `${data.product.title} | ${data.settings.company_name}`,
        pageScript: 'product',
    });
});

// Blog post detail page (new)
router.get('/pages/blog/:slug', async (req, res) => {
    const data = await loadTenantData(req.tenant.id, 'blog-post', { postSlug: req.params.slug });
    if (!data.blogPost) return res.status(404).render(`${req.tenant.templateSlug}/pages/404`, data);
    res.render(`${req.tenant.templateSlug}/pages/blog-post`, {
        ...data,
        pageTitle: `${data.blogPost.title} | ${data.settings.company_name}`,
        pageScript: 'blog-post',
    });
});

// Forms, payment, thank-you
router.get('/pages/forms.html', async (req, res) => {
    const data = await loadTenantData(req.tenant.id, 'forms');
    res.render(`${req.tenant.templateSlug}/pages/forms`, {
        ...data,
        formSlug: req.query.form || 'patient-intake',
        productSlug: req.query.product,
        source: req.query.source,
        pageScript: 'forms',
    });
});

// 404 handler
router.use(async (req, res) => {
    const data = await loadTenantData(req.tenant.id, '404');
    res.status(404).render(`${req.tenant.templateSlug}/pages/404`, {
        ...data,
        pageTitle: 'Page Not Found',
        pageScript: '404',
    });
});

export default router;
```

### Tenant Data Loader

```typescript
// server/src/services/tenantData.ts

export async function loadTenantData(tenantId: string, pageSlug: string, opts: any = {}) {
    // Check Redis cache first
    const cacheKey = `site:${tenantId}:${pageSlug}:${JSON.stringify(opts)}`;
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    // Load common data (every page needs this)
    const [settings, tenant, navItems, socialLinks] = await Promise.all([
        db.siteSettings.findFirst({ where: { tenantId } }),
        db.tenant.findFirst({ where: { id: tenantId }, include: { template: true } }),
        db.navigationItem.findMany({ where: { tenantId, isVisible: true }, orderBy: { sortOrder: 'asc' } }),
        db.socialLink.findMany({ where: { tenantId, isVisible: true }, orderBy: { sortOrder: 'asc' } }),
    ]);

    // Group navigation by location
    const navigation = {
        navbar: navItems.filter(n => n.location === 'navbar'),
        sidebar: navItems.filter(n => n.location === 'sidebar'),
        footer_col1: navItems.filter(n => n.location === 'footer_col1'),
        footer_col2: navItems.filter(n => n.location === 'footer_col2'),
    };

    const base = { settings, tenant, template: tenant.template, navigation, socialLinks };

    // Load page-specific data
    let pageData = {};
    switch (pageSlug) {
        case 'home':
            const [sections, featuredProducts, videos, homeFaqs, testimonials] = await Promise.all([
                db.pageSection.findMany({ where: { tenantId, page: { slug: 'home' } } }),
                db.product.findMany({ where: { tenantId, isActive: true, isFeatured: true }, orderBy: { sortOrder: 'asc' } }),
                db.video.findMany({ where: { tenantId, isVisible: true }, orderBy: { sortOrder: 'asc' } }),
                db.faqItem.findMany({ where: { tenantId, isVisible: true, pageLocation: { in: ['home', 'both'] } }, orderBy: { sortOrder: 'asc' }, take: 5 }),
                db.testimonial.findMany({ where: { tenantId, isVisible: true }, orderBy: { sortOrder: 'asc' } }),
            ]);
            pageData = {
                sections: indexByKey(sections, 'sectionKey'),
                featuredProducts, videos, homeFaqs, testimonials,
            };
            break;

        case 'shop':
            const [products, categories] = await Promise.all([
                db.product.findMany({ where: { tenantId, isActive: true }, include: { category: true }, orderBy: { sortOrder: 'asc' } }),
                db.productCategory.findMany({ where: { tenantId }, orderBy: { sortOrder: 'asc' } }),
            ]);
            pageData = { products, categories };
            break;

        case 'product':
            const product = await db.product.findFirst({
                where: { tenantId, slug: opts.productSlug, isActive: true },
                include: { category: true },
            });
            pageData = { product };
            break;

        case 'blog':
            const blogPosts = await db.blogPost.findMany({
                where: { tenantId, status: 'published' },
                orderBy: { publishedAt: 'desc' },
                include: { category: true },
            });
            pageData = { blogPosts, featuredPost: blogPosts.find(p => p.isFeatured) || blogPosts[0] };
            break;

        case 'blog-post':
            const blogPost = await db.blogPost.findFirst({
                where: { tenantId, slug: opts.postSlug, status: 'published' },
                include: { category: true },
            });
            pageData = { blogPost };
            break;

        case 'about':
            const [aboutSections, teamMembers] = await Promise.all([
                db.pageSection.findMany({ where: { tenantId, page: { slug: 'about' } } }),
                db.teamMember.findMany({ where: { tenantId, isVisible: true }, orderBy: { sortOrder: 'asc' } }),
            ]);
            pageData = { sections: indexByKey(aboutSections, 'sectionKey'), teamMembers };
            break;

        case 'contact':
            const contactSections = await db.pageSection.findMany({ where: { tenantId, page: { slug: 'contact' } } });
            pageData = { sections: indexByKey(contactSections, 'sectionKey') };
            break;

        case 'faq':
            const faqCategories = await db.faqCategory.findMany({
                where: { tenantId },
                include: { items: { where: { isVisible: true, pageLocation: { in: ['faq_page', 'both'] } }, orderBy: { sortOrder: 'asc' } } },
                orderBy: { sortOrder: 'asc' },
            });
            pageData = { faqCategories };
            break;

        case 'careers':
            const jobListings = await db.jobListing.findMany({
                where: { tenantId, status: 'active' },
                orderBy: { postedAt: 'desc' },
            });
            pageData = { jobListings };
            break;

        case 'terms':
            pageData = {};  // settings.terms_content already in base
            break;

        case 'privacy':
            pageData = {};  // settings.privacy_content already in base
            break;
    }

    // Get page record
    const page = await db.page.findFirst({ where: { tenantId, slug: pageSlug } });

    const result = { ...base, ...pageData, page };

    // Cache for 2 minutes
    await cache.set(cacheKey, result, 120);

    return result;
}
```

---

## 6. CSS Variable Injection

Tenant brand colors are injected as CSS custom properties in the `<head>`. This means the entire template's color scheme changes based on tenant settings — without regenerating CSS files.

### Current Variables (from `variables.css`)
```css
:root {
    --color-black: #0D0D0D;
    --color-accent: #FFCD93;
    --color-secondary: #FF967A;
    --color-bg: #E6E6E6;
    --color-border: #D9D9D9;
    --color-border-light: #EBEBEB;
    --color-white: #fff;
}
```

### After Migration
The `variables.css` file keeps these as defaults. The inline `<style>` in `base.ejs` overrides them with tenant-specific values from the database. This means:

- Template CSS files are compiled once, cached on CDN, shared across tenants
- Color customization is zero-cost (inline CSS override only)
- If a tenant doesn't set custom colors, the template defaults apply

---

## 7. Static Assets Strategy

### Template Assets (shared)
CSS and JS compiled from the current source code. Served from CDN. Same files for all tenants.

```
/assets/css/healthcare-pro.css     → Compiled from all src/styles/
/assets/js/home.js                  → Compiled from src/js/pages/home.js
/assets/js/shop.js                  → Compiled from src/js/pages/shop.js
/assets/images/social/instagram.svg → Default social icons
/assets/images/phone.png            → Template default images
```

### Tenant Assets (per-tenant)
Uploaded images, logos, videos. Stored in S3/R2. Served from CDN.

```
https://cdn.barterpay.com/{tenantId}/logos/logo.svg
https://cdn.barterpay.com/{tenantId}/products/semaglutide.png
https://cdn.barterpay.com/{tenantId}/blog/cover-1.jpg
https://cdn.barterpay.com/{tenantId}/team/sarah.jpg
```

---

## 8. Template Metadata (`template.json`)

```json
{
    "name": "Healthcare Pro",
    "slug": "healthcare-pro",
    "version": "1.0.0",
    "description": "Professional healthcare and telemedicine template",
    "author": "BarterPay",
    "pages": [
        "home", "shop", "product", "blog", "blog-post",
        "about", "contact", "faq", "careers",
        "terms", "privacy", "forms", "payment", "thank-you", "404"
    ],
    "sections": {
        "home": ["hero", "intro", "carousel", "expert", "video-grid", "markers", "whatif", "faq", "stories", "guide"],
        "about": ["about_mission", "about_values", "about_team", "about_stats"],
        "contact": ["contact_info"]
    },
    "colors": {
        "color_primary": { "label": "Primary / Text", "default": "#0D0D0D" },
        "color_accent": { "label": "Accent", "default": "#FFCD93" },
        "color_secondary": { "label": "Secondary", "default": "#FF967A" },
        "color_background": { "label": "Background", "default": "#E6E6E6" },
        "color_border": { "label": "Border", "default": "#D9D9D9" },
        "color_border_light": { "label": "Border Light", "default": "#EBEBEB" },
        "color_white": { "label": "White", "default": "#FFFFFF" }
    },
    "defaults": {
        "promo_banner_text": "20% off — Claim now",
        "footer_tagline": "Written by board-certified doctors to support your journey."
    }
}
```

---

## 9. Future: Multi-Template Support

When additional templates are added:

1. Each template is a separate folder in `templates/`
2. Template metadata describes its pages, sections, colors
3. Tenants choose a template during registration (or change later)
4. The renderer reads `tenant.template_id` to choose the template folder
5. **Data model stays the same** — only the visual rendering changes
6. Templates must implement the same section keys to be compatible

```
templates/
├── healthcare-pro/        ← current template
├── wellness-minimal/      ← future template
├── clinic-corporate/      ← future template
└── pharmacy-modern/       ← future template
```
