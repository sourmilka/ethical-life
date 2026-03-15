# Project Overview

> **Last updated:** 2026-03-15

## 1. Platform Vision

BarterPay is a **multi-tenant white-label website platform** for pharmaceutical and healthcare companies. Companies sign up, get a fully functional website based on a professional template, and control every piece of content through a dashboard — without writing any code.

### What Tenants Get
- A branded website with their own domain/subdomain
- Full CMS for products, blog posts, testimonials, FAQs
- Customizable intake forms with submission tracking
- BarterPay payment integration
- Analytics on form submissions and site activity

### What Tenants Control (Content, Not Design)
| Can Change | Cannot Change |
|-----------|--------------|
| Company logo & favicon | Page layout structure |
| All text on every page | HTML template structure |
| All images on every page | Component positioning |
| Brand colors (primary, accent, background) | CSS grid/flex architecture |
| Social media links | Navigation flow (pages exist) |
| Form fields and structure | Core form validation logic |
| Blog posts (CRUD) | Base typography system |
| Products (CRUD) | Responsive breakpoint behavior |
| Team members (CRUD) | |
| Testimonials (CRUD) | |
| FAQ items (CRUD) | |
| Job listings (CRUD) | |
| Contact information | |
| Legal pages content | |
| Navigation link labels | |
| App store URLs | |

### Future: Template Marketplace
Currently one template. Future phases will let tenants choose from a library of templates while keeping the same data model and dashboard.

---

## 2. Architecture Overview

```
                    ┌─────────────────────────────────────┐
                    │          BarterPay Cloud             │
                    │                                     │
  ┌──────────┐      │  ┌───────────┐    ┌──────────────┐  │
  │  Tenant  │──────┼─>│ Dashboard │───>│   REST API   │  │
  │  Admin   │      │  │ (React)   │    │  (Node.js)   │  │
  └──────────┘      │  └───────────┘    └──────┬───────┘  │
                    │                          │          │
  ┌──────────┐      │  ┌───────────┐    ┌──────┴───────┐  │
  │   Site   │──────┼─>│  Public   │───>│  PostgreSQL  │  │
  │ Visitor  │      │  │  Renderer │    │  + Redis     │  │
  └──────────┘      │  └───────────┘    └──────┬───────┘  │
                    │                          │          │
                    │                   ┌──────┴───────┐  │
                    │                   │  File Store  │  │
                    │                   │  (S3 / R2)   │  │
                    │                   └──────────────┘  │
                    └─────────────────────────────────────┘
```

### Components

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Dashboard** | React + Vite | Admin panel for tenants to manage content |
| **REST API** | Node.js + Express | Backend serving data, auth, file uploads |
| **Public Renderer** | Node.js + EJS (or edge SSR) | Renders tenant websites from templates + data |
| **Database** | PostgreSQL | Stores all tenant data, content, submissions |
| **Cache** | Redis | Session store, template cache, rate limiting |
| **File Storage** | AWS S3 / Cloudflare R2 | Tenant images, logos, uploaded assets |
| **CDN** | Cloudflare | Static assets, caching, custom domains |

---

## 3. Tech Stack Decision

### Backend
| Choice | Rationale |
|--------|-----------|
| **Node.js + Express** | Same language as frontend; team familiarity; massive ecosystem |
| **PostgreSQL** | Relational data fits tenant/content model; JSONB for flexible fields; proven at scale |
| **Redis** | Fast session lookups; template caching; rate limiting |
| **Prisma ORM** | Type-safe queries; auto-migrations; excellent DX |

### Dashboard Frontend
| Choice | Rationale |
|--------|-----------|
| **React 19** | Component model fits dashboard widgets; huge ecosystem |
| **Vite** | Already using Vite; fast builds; HMR |
| **TailwindCSS** | Rapid dashboard UI development; utility-first |
| **React Router** | SPA navigation for dashboard |
| **TanStack Query** | Server state management; caching; optimistic updates |
| **React Hook Form** | Form management for content editing |

### Public Site Rendering
| Choice | Rationale |
|--------|-----------|
| **EJS templates** | Current HTML partials map 1:1 to EJS; minimal rewrite |
| **Express static serving** | Serves CSS/JS/images; handles routing |
| **Per-tenant middleware** | Resolves tenant from subdomain/domain; injects data |

### Infrastructure
| Choice | Rationale |
|--------|-----------|
| **Docker** | Consistent environments; easy deployment |
| **Cloudflare** | CDN, DNS, custom domains, SSL, DDoS protection |
| **S3/R2** | Scalable file storage for tenant uploads |
| **GitHub Actions** | CI/CD pipeline |

---

## 4. Multi-Tenancy Model

### Tenant Isolation Strategy: **Shared Database, Schema Isolation via tenant_id**

Every table includes a `tenant_id` foreign key. All queries are scoped by tenant. This is the most common and cost-effective approach for SaaS.

```
tenant_id is on EVERY content table:
- pages, products, blog_posts, testimonials, faq_items,
  team_members, job_listings, form_definitions, form_submissions,
  site_settings, media_assets, etc.
```

### Domain Resolution Flow

```
Request: https://ethicallife.barterpay.com/shop
                   │
                   ▼
         ┌─────────────────┐
         │ Read subdomain   │
         │ "ethicallife"    │
         └────────┬────────┘
                  │
                  ▼
         ┌─────────────────┐
         │ Lookup tenant    │
         │ by slug/domain   │
         └────────┬────────┘
                  │
                  ▼
         ┌─────────────────┐
         │ Load tenant data │
         │ from PostgreSQL  │
         └────────┬────────┘
                  │
                  ▼
         ┌─────────────────┐
         │ Render template  │
         │ with tenant data │
         └─────────────────┘
```

### Supported Domain Types
1. **Subdomain**: `{slug}.barterpay.com` (default, automatic)
2. **Custom domain**: `www.ethicallife.co.uk` (tenant configures DNS CNAME)

---

## 5. User Roles & Access

| Role | Scope | Permissions |
|------|-------|-------------|
| **Super Admin** | Platform-wide | Manage all tenants, templates, platform settings |
| **Tenant Owner** | Single tenant | Full access to dashboard, billing, team management |
| **Tenant Admin** | Single tenant | Edit content, manage forms, view submissions |
| **Tenant Editor** | Single tenant | Edit content only (no billing, no team management) |
| **Site Visitor** | Public site | Fill forms, browse products, read blog |

---

## 6. Current Codebase Inventory

### What Exists Today (Static Site)
```
14 HTML pages       → Will become EJS templates
24 HTML partials    → Will become EJS partials
7 JS components     → Will be served as static assets (unchanged)
14 JS page entries  → Some will need API calls injected
26 CSS components   → Served as static assets (colors become CSS vars from DB)
6 product data      → Will move to database
8 testimonials      → Will move to database
5 FAQ items         → Will move to database
7-step intake form  → Will become configurable form definition
1 payment flow      → Will connect to real BarterPay API per tenant
```

### Files That Need Migration
| Current File | Migration |
|-------------|-----------|
| `partials/hero.html` | EJS template with `<%= tenant.hero.headline %>` |
| `partials/carousel.html` | Loop over `tenant.products` from DB |
| `partials/stories.html` | Loop over `tenant.testimonials` from DB |
| `partials/video-section.html` | Loop over `tenant.videos` from DB |
| `partials/blog-content.html` | Loop over `tenant.blogPosts` from DB |
| `partials/shop-grid.html` | Loop over `tenant.products` from DB |
| `partials/about-content.html` | Render `tenant.about` data from DB |
| `partials/contact-content.html` | Render `tenant.contact` data from DB |
| `partials/faq.html` | Loop over `tenant.faqItems` from DB |
| `partials/faq-page-content.html` | Loop over `tenant.faqCategories` from DB |
| `partials/careers-content.html` | Loop over `tenant.jobListings` from DB |
| `partials/footer.html` | Render `tenant.footer` + `tenant.socialLinks` from DB |
| `partials/topbar.html` | Render `tenant.navbar` + `tenant.promoBanner` from DB |
| `partials/guide.html` | Render `tenant.guideCta` from DB |
| `partials/markers.html` | Render `tenant.valueProps` from DB |
| `partials/expert.html` | Render `tenant.expertSection` from DB |
| `partials/intro.html` | Render `tenant.introSection` from DB |
| `partials/whatif.html` | Render `tenant.wheelSlides` from DB |
| `src/js/pages/product.js` | Remove hardcoded products; fetch from API |
| `src/js/pages/forms.js` | Load form definition from API |
| `payment.js` | Use tenant-specific BarterPay credentials |

---

## 7. Security Requirements

| Area | Requirement |
|------|-------------|
| **Authentication** | JWT + refresh tokens; bcrypt password hashing |
| **Authorization** | Role-based access control (RBAC) per tenant |
| **Tenant isolation** | All queries scoped by `tenant_id`; no cross-tenant data leaks |
| **Input validation** | Server-side validation on all API endpoints (Zod schemas) |
| **File uploads** | Type checking, size limits, virus scanning, no executable uploads |
| **SQL injection** | Prisma ORM parameterized queries |
| **XSS** | EJS auto-escaping; CSP headers; sanitize user HTML (DOMPurify) |
| **CSRF** | SameSite cookies; CSRF tokens on mutation endpoints |
| **Rate limiting** | Redis-backed rate limiting per IP and per tenant |
| **HTTPS** | Enforced everywhere; HSTS headers |
| **Data encryption** | Sensitive fields encrypted at rest; TLS in transit |
| **Audit logging** | Log all admin actions with timestamp, user, and change diff |
