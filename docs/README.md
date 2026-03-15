# BarterPay Platform Documentation

> **Last updated:** 2026-03-15
> **Status:** Planning & Architecture Phase

## What Is This?

BarterPay is a **white-label SaaS platform** for pharmaceutical / healthcare companies. Each company ("tenant") registers on BarterPay, gets their own branded website built from a shared template, and manages everything through a dashboard — content, products, forms, blog posts, images, branding, and form submissions.

Think of it like Shopify or Framer, but purpose-built for drug companies and telehealth providers.

## Documentation Index

| # | Document | Description |
|---|----------|-------------|
| 1 | [PROJECT-OVERVIEW.md](./PROJECT-OVERVIEW.md) | Platform vision, architecture, tenant model, tech stack |
| 2 | [DATABASE-SCHEMA.md](./DATABASE-SCHEMA.md) | Complete database design with all tables and relationships |
| 3 | [API-ARCHITECTURE.md](./API-ARCHITECTURE.md) | REST API structure, endpoints, auth, middleware |
| 4 | [DASHBOARD-FEATURES.md](./DASHBOARD-FEATURES.md) | Dashboard UI sections, what tenants can edit |
| 5 | [CMS-SYSTEM.md](./CMS-SYSTEM.md) | Blog, product, testimonial, FAQ content management |
| 6 | [FORM-BUILDER.md](./FORM-BUILDER.md) | Form creation, customization, submission tracking |
| 7 | [TEMPLATE-ENGINE.md](./TEMPLATE-ENGINE.md) | How static HTML becomes dynamic, rendering pipeline |
| 8 | [TODO.md](./TODO.md) | Master roadmap with phases, tasks, and status tracking |

## Key Concepts

- **Tenant** = A company using BarterPay (e.g., "Ethical Life", "MedFast Clinic")
- **Template** = The website design/layout (currently one template; more planned)
- **Dashboard** = The admin panel where tenants manage their site
- **Public Site** = The customer-facing website visitors see
- **Form Submission** = Data collected from site visitors via intake forms

## Current State

The codebase is a **static Vite site** with:
- 14 HTML pages (home, shop, product, forms, payment, thank-you, about, blog, contact, faq, terms, privacy, careers, 404)
- 24 HTML partials (reusable components)
- 7 JS components + 14 page entry points
- 26 CSS component files + 14 page aggregators
- All content hardcoded in HTML partials

## Target State

Transform this into a **multi-tenant SaaS platform** where:
1. Backend API serves tenant-specific content from a database
2. Frontend template renders dynamically based on tenant data
3. Dashboard lets tenants manage everything without touching code
4. Form submissions are stored, tracked, and viewable per tenant
5. Each tenant gets a custom subdomain or custom domain
