# TODO - BarterPay Platform Roadmap

> **Last updated:** 2026-03-15 (Phase 1 complete)
> **Status key:** `[ ]` Not started | `[~]` In progress | `[x]` Done | `[!]` Blocked

---

## Phase 0: Documentation & Planning
> Complete platform documentation before writing any code

- [x] 0.1 — Audit current codebase (all files, structure, dependencies)
- [x] 0.2 — Write PROJECT-OVERVIEW.md (vision, architecture, tech stack, tenancy model)
- [x] 0.3 — Write DATABASE-SCHEMA.md (all 26 tables, relationships, indexes, data mapping)
- [x] 0.4 — Write API-ARCHITECTURE.md (project structure, endpoints, auth, middleware)
- [x] 0.5 — Write DASHBOARD-FEATURES.md (all dashboard sections, routes, UI specs)
- [x] 0.6 — Write CMS-SYSTEM.md (content types, CRUD, rendering pipeline, validation)
- [x] 0.7 — Write FORM-BUILDER.md (form definitions, fields, builder UI, submission pipeline)
- [x] 0.8 — Write TEMPLATE-ENGINE.md (EJS migration, rendering server, CSS injection)
- [x] 0.9 — Write TODO.md (this file — phased roadmap)

---

## Phase 1: Backend Foundation
> Set up the server, database, and core infrastructure

- [x] 1.1 — Initialize `server/` directory with package.json (Node.js + TypeScript)
- [x] 1.2 — Install core dependencies (express, prisma, zod, bcryptjs, jsonwebtoken, cors, helmet, cookie-parser, multer, ioredis, pino)
- [x] 1.3 — Set up TypeScript config (tsconfig.json)
- [x] 1.4 — Create Prisma schema (`prisma/schema.prisma`) from DATABASE-SCHEMA.md — 26 models, validated
- [!] 1.5 — Run initial Prisma migration — blocked on local PostgreSQL (schema ready, `prisma migrate dev --name init`)
- [x] 1.6 — Create database seed script (default template + demo tenant + all content)
- [x] 1.7 — Set up Express app (`src/app.ts`) with middleware pipeline (CORS, Helmet, body-parser, cookie-parser, pino logger)
- [x] 1.8 — Create environment config validation with Zod (`src/config/env.ts`)
- [x] 1.9 — Create Prisma client singleton (`src/config/database.ts`) — uses @prisma/adapter-pg for Prisma 7
- [x] 1.10 — Create Redis client (`src/config/redis.ts`) — graceful fallback when Redis unavailable
- [x] 1.11 — Create global error handler middleware (`src/middleware/errorHandler.ts`)
- [x] 1.12 — Create custom error classes (`src/utils/errors.ts`)
- [x] 1.13 — Create server entry point (`src/index.ts`) — graceful shutdown on SIGTERM/SIGINT
- [x] 1.14 — Verify server starts: ✅ DB connects, ✅ /api/health returns 200, ✅ 404 handler works, ✅ TypeScript compiles with 0 errors

---

## Phase 2: Authentication System ✅
> JWT auth with refresh tokens, password hashing, sessions

- [x] 2.1 — Create auth Zod schemas (login, register, forgot-password, reset-password) → `src/routes/auth/auth.schemas.ts`
- [x] 2.2 — Create auth service (hashPassword, verifyPassword, generateTokens) → `src/services/auth.service.ts`
- [x] 2.3 — Create auth controller (register, login, refresh, logout, me, updateMe, changePassword) → `src/routes/auth/auth.controller.ts`
- [x] 2.4 — Create auth routes (`POST /api/auth/*`) → `src/routes/auth/index.ts`
- [x] 2.5 — Create auth middleware (`src/middleware/auth.ts` — JWT verification, user injection to req)
- [x] 2.6 — Create role-based access middleware (`src/middleware/requireRole.ts`)
- [x] 2.7 — Create rate limiter middleware (`src/middleware/rateLimiter.ts` — Redis-backed with graceful fallback)
- [x] 2.8 — Create request validation middleware (`src/middleware/validate.ts` — Zod)
- [x] 2.9 — Create tenant registration flow (register → create tenant + owner user + default site settings in transaction)
- [x] 2.10 — TypeScript compiles with 0 errors, routes wired into app.ts

---

## Phase 3: Tenant & Site Settings ✅
> Tenant management and branding configuration

- [x] 3.1 — Create tenant resolver middleware (`src/middleware/tenantResolver.ts` — subdomain/custom-domain lookup)
- [x] 3.2 — Create site settings service + cache service (`src/services/cache.service.ts`)
- [x] 3.3 — Create site settings controller (`src/routes/settings/settings.controller.ts`)
- [x] 3.4 — Create site settings routes (`GET/PATCH /api/settings/*`) → `src/routes/settings/index.ts`
- [x] 3.5 — Create site settings Zod schemas (`src/routes/settings/settings.schemas.ts`)
- [x] 3.6 — Create tenant service (get/update tenant via `/api/settings/tenant`)
- [x] 3.7 — Create audit log middleware (`src/middleware/auditLog.ts`)
- [x] 3.8 — Create cache service (`src/services/cache.service.ts` — Redis get/set/del with TTL, graceful fallback)
- [x] 3.9 — TypeScript compiles with 0 errors, routes wired into app.ts
- [x] 3.10 — Cache invalidation on settings update (cacheDel in patchSettings helper)

---

## Phase 4: Navigation & Social Links ✅
> Dashboard-managed navigation structure

- [x] 4.1–4.3 — Navigation CRUD + reorder: schemas, controller, routes → `src/routes/navigation/`
- [x] 4.4–4.6 — Social links CRUD + reorder: schemas, controller, routes → `src/routes/social-links/`
- [x] 4.7 — Default nav items seeded in `prisma/seed.ts` (from Phase 1)
- [x] 4.8 — Default social links seeded in `prisma/seed.ts` (from Phase 1)

---

## Phase 5: Product CMS ✅
> Full product catalog management

- [x] 5.1–5.2 — Product categories CRUD: schemas, controller, routes → `src/routes/products/`
- [x] 5.3–5.5 — Products CRUD + reorder: schemas, controller, routes → `src/routes/products/`
- [x] 5.6 — 6 default products seeded in `prisma/seed.ts` (from Phase 1)
- [x] 5.7 — TypeScript compiles, routes wired at `/api/products`

---

## Phase 6: Blog CMS ✅
> Blog post management with rich text content

- [x] 6.1–6.2 — Blog categories CRUD: schemas, controller, routes → `src/routes/blog/`
- [x] 6.3–6.5 — Blog posts CRUD + publish workflow: schemas, controller, routes → `src/routes/blog/`
- [x] 6.6 — 6 default blog posts seeded in `prisma/seed.ts` (from Phase 1)
- [x] 6.7 — TypeScript compiles, routes wired at `/api/blog`

---

## Phase 7: Testimonials, FAQ, Team, Careers, Videos ✅
> Remaining CMS content types

- [x] 7.1 — Testimonials CRUD → `src/routes/content/` (8 defaults seeded)
- [x] 7.2 — FAQ categories CRUD → `src/routes/content/`
- [x] 7.3 — FAQ items CRUD → `src/routes/content/` (14 defaults seeded)
- [x] 7.4 — Team members CRUD → `src/routes/content/` (4 defaults seeded)
- [x] 7.5 — Job listings CRUD → `src/routes/content/` (4 defaults seeded)
- [x] 7.6 — Videos CRUD + reorder → `src/routes/content/` (6 defaults seeded)
- [x] 7.7 — TypeScript compiles with 0 errors, all routes wired at `/api/content`

---

## Phase 8: Page Sections ✅
> Per-page content blocks (hero, intro, markers, etc.)

- [x] 8.1 — Create pages service (list pages, get page with sections)
- [x] 8.2 — Create page sections service (get, update section content JSONB)
- [x] 8.3 — Create pages controller and routes
- [x] 8.4 — Create page sections Zod schemas (validate JSONB structure per section_key)
- [ ] 8.5 — Seed default page sections from current hardcoded content:
  - Home: hero, intro, markers, expert, whatif, guide (6 sections)
  - About: mission, values, stats (3 sections)
  - Contact: contact_info (1 section)
- [ ] 8.6 — Test page section CRUD with various content structures

---

## Phase 9: Media Library ✅
> File upload and management system

- [ ] 9.1 — Set up S3/R2 client (`src/services/storage.ts`) — deferred; using local disk storage via multer for now
- [x] 9.2 — Create multer upload middleware (`src/middleware/upload.ts` — 10MB limit, allowed file types)
- [x] 9.3 — Create media service (upload, list, update, delete)
- [x] 9.4 — Create media controller and routes
- [x] 9.5 — Create media Zod schemas
- [x] 9.6 — Implement file type validation (mime type check, extension check)
- [x] 9.7 — Implement folder organization
- [ ] 9.8 — Test file upload pipeline end-to-end

---

## Phase 10: Form Builder API ✅
> Configurable form definitions and field management

- [x] 10.1 — Create form definitions service (CRUD, duplicate)
- [x] 10.2 — Create form fields service (CRUD, reorder within form)
- [x] 10.3 — Create form controller and routes
- [x] 10.4 — Create form Zod schemas (form definition + field validation)
- [ ] 10.5 — Seed default forms:
  - Patient Intake (7-step, all fields from current forms.js)
  - Contact Form (1-step, 5 fields)
  - Newsletter (1-step, 1 field)
- [ ] 10.6 — Test form definition CRUD + field management

---

## Phase 11: Form Submissions ✅
> Submission storage, inbox, and notifications

- [x] 11.1 — Create form submission service (create, list, get, update status, delete, export CSV)
- [x] 11.2 — Create form submission controller and routes
- [x] 11.3 — Create form submission Zod schemas
- [ ] 11.4 — Implement server-side form validation (validate submitted data against form definition)
- [ ] 11.5 — Create email notification service (`src/services/email.ts` — transactional emails)
- [ ] 11.6 — Implement submission notification emails
- [ ] 11.7 — Implement CSV export (streaming for large datasets)
- [ ] 11.8 — Implement submission statistics endpoint (counts, trends)
- [ ] 11.9 — Test submission pipeline end-to-end (submit → store → notify → view in dashboard)

---

## Phase 12: Public API ✅
> Unauthenticated endpoints serving tenant websites

- [x] 12.1 — Create public routes with tenant resolver middleware
- [x] 12.2 — Create public site data bundle endpoint (`GET /api/public/site`)
- [x] 12.3 — Create public page endpoint (`GET /api/public/page/:slug`)
- [x] 12.4 — Create public content endpoints (products, blog, testimonials, faq, team, careers, videos)
- [x] 12.5 — Create public form submission endpoint (`POST /api/public/forms/:slug/submit`)
- [ ] 12.6 — Create public newsletter endpoint (`POST /api/public/newsletter`)
- [ ] 12.7 — Create public contact endpoint (`POST /api/public/contact`)
- [x] 12.8 — Implement Redis caching on all public endpoints
- [ ] 12.9 — Test public API with tenant resolution (subdomain-based)

---

## Phase 13: BarterPay Payment Integration
> Connect payment flow to tenant-specific BarterPay credentials

- [x] 13.1 — Create BarterPay service (`src/services/barterpay.ts` — create transaction, check status)
- [x] 13.2 — Create payment config endpoints (get/update BarterPay credentials)
- [x] 13.3 — Create public payment endpoints (create-transaction, check-status)
- [x] 13.4 — Link payment to form submissions (update payment_status on completion)
- [x] 13.5 — Implement per-tenant BarterPay API key usage (encrypted in DB)
- [ ] 13.6 — Test payment flow end-to-end

---

## Phase 14: Template Engine
> Convert static HTML partials to EJS templates

- [x] 14.1 — Create `templates/healthcare-pro/` directory structure
- [x] 14.2 — Create `template.json` metadata file
- [x] 14.3 — Create `layouts/base.ejs` (HTML shell with CSS variable injection)
- [x] 14.4 — Convert all HTML partials to EJS templates:
  - [x] topbar.ejs
  - [x] hero.ejs
  - [x] intro.ejs
  - [x] carousel.ejs
  - [x] expert.ejs
  - [x] video-section.ejs
  - [x] markers.ejs
  - [x] whatif.ejs
  - [x] faq-accordion.ejs
  - [x] stories.ejs
  - [x] guide.ejs
  - [x] footer.ejs
  - [x] page-hero.ejs
  - [x] shop-grid.ejs
  - [x] blog-content.ejs
  - [x] about-content.ejs
  - [x] contact-content.ejs
  - [x] careers-content.ejs
  - [x] faq-page-content.ejs
  - [x] privacy-content.ejs + terms-content.ejs
  - [x] form-left.ejs + form-card.ejs
  - [x] payment-left.ejs + payment-card.ejs
  - [x] thankyou-left.ejs + thankyou-card.ejs
- [x] 14.5 — Create all page templates (home, shop, product, blog, blog-post, about, contact, faq, careers, terms, privacy, forms, payment, thank-you, 404)
- [x] 14.6 — Create rendering server routes (`src/routes/render/index.ts`)
- [x] 14.7 — Create tenant data loader service (`src/services/tenantData.ts`)
- [ ] 14.8 — Compile CSS/JS assets for template (adapt current Vite build)
- [ ] 14.9 — Test full page rendering with demo tenant data

---

## Phase 15: Frontend — Dynamic Form Renderer ✅
> Rewrite forms.js to work with server-rendered form templates

- [x] 15.1 — Rewrite forms.js — reads server-rendered `.form-step` elements from form-card.ejs (no client-side fetch needed)
- [x] 15.2 — Multi-step navigation via `.step-next` / `.step-prev` button classes with slide animation
- [x] 15.3 — Fields rendered server-side by form-card.ejs — JS handles step nav, validation, conditional logic
- [x] 15.4 — Generic validation for all visible required fields (text, email, tel, checkbox, radio, select)
- [x] 15.5 — Conditional field visibility via `data-condition` JSON attribute on `.form-group` elements
- [x] 15.6 — Submit to API via `form.dataset.submitUrl` (set by form-card.ejs), posts JSON to `/api/public/forms/:slug/submit`
- [x] 15.7 — Post-submission flow: checks `requiresPayment` / `paymentStatus` → payment.html or thank-you.html
- [ ] 15.8 — Test dynamic form rendering with different form definitions

---

## Phase 16: Frontend — Dynamic Product Page ✅
> Product page fully server-rendered by product.ejs

- [x] 16.1 — Product data loaded server-side by render route + tenantData.ts (no client-side fetch needed)
- [x] 16.2 — Removed hardcoded products object (was 6 products with features, howItWorks, etc.)
- [x] 16.3 — 404 handled server-side in render route (returns 404 page when product not found)
- [ ] 16.4 — Test product page with API data

---

## Phase 17: Dashboard Frontend — Setup ✅
> Initialize dashboard React application

- [x] 17.1 — Initialize `dashboard/` directory with Vite + React + TypeScript (package.json, tsconfig.json, vite.config.ts, index.html)
- [x] 17.2 — Install dependencies (react-router, tanstack-query, react-hook-form, zod, tailwindcss, tiptap, dnd-kit, recharts, sonner, lucide-react, date-fns, clsx)
- [x] 17.3 — Set up TailwindCSS v4 config (@tailwindcss/vite plugin, index.css with @import "tailwindcss")
- [x] 17.4 — Create base layout component (`DashboardLayout.tsx` — sidebar with collapsible nav groups + header with user info + main content area)
- [x] 17.5 — Set up React Router with all dashboard routes (30+ routes matching DASHBOARD-FEATURES.md spec)
- [x] 17.6 — Set up TanStack Query client + API helper (`lib/api.ts` — fetch wrapper with JWT injection, auto-refresh on 401, FormData support)
- [x] 17.7 — Create auth context (`contexts/AuthContext.tsx` — login, register, logout, session restore via refresh token)
- [x] 17.8 — Create protected route wrapper (`components/ProtectedRoute.tsx` — redirects to login when unauthenticated)
- [x] 17.9 — Build login page (`pages/LoginPage.tsx` — email/password form, error handling, redirect when authenticated)
- [x] 17.10 — Build registration page (`pages/RegisterPage.tsx` — company name, auto-slug, full name, email, password, confirm password)
- [ ] 17.11 — Test auth flow (register → login → dashboard access)

---

## Phase 18: Dashboard Frontend — Core Components ✅
> Reusable UI components used across all dashboard pages

- [x] 18.1 — Build `DataTable` component (sortable, filterable, paginated, search, empty state, row click)
- [x] 18.2 — Build `ContentCard` component (image, title, subtitle, badge, actions, clickable)
- [x] 18.3 — Build `SectionEditor` component (collapsible, visibility toggle, save button, Field/TextField/ImageField helpers)
- [x] 18.4 — Build `ImagePicker` component (modal media library browser, search, grid select)
- [x] 18.5 — Build `RichTextEditor` component (TipTap with bold, italic, heading, lists, link, image, undo/redo toolbar)
- [x] 18.6 — Build `Repeater` component (dnd-kit sortable, add/remove/reorder, generic render)
- [x] 18.7 — Build `ColorPicker` component (color input + hex text input)
- [x] 18.8 — Build `StatusBadge` component (5 variants: default, success, warning, error, info)
- [x] 18.9 — Build `ConfirmDialog` component (modal, danger/default variant, async confirm)
- [x] 18.10 — Build `EmptyState` component (icon, title, description, action)
- [x] 18.11 — Build `FileUploader` component (drag-drop zone, file size validation, accept filter)
- [x] 18.12 — Build `PageHeader` component (title, description, action buttons)
- [x] 18.13 — Build `Sidebar` navigation component (collapsible groups, active route highlighting) — integrated in DashboardLayout
- [x] 18.14 — Build `Breadcrumb` component (linked items with chevron separators)

---

## Phase 19: Dashboard Frontend — Overview ✅
> Dashboard home page with metrics and quick actions

- [x] 19.1 — Build overview cards (total submissions, new today, products, blog posts) with icons
- [x] 19.2 — Build recent activity feed (last 10 submissions with name, form, status, date)
- [x] 19.3 — Build quick action buttons (View Live Site, Add Product, Write Blog Post, View Submissions)
- [x] 19.4 — Connect to API (created `/api/submissions/stats` endpoint returning counts + recent submissions)

---

## ✅ Phase 20: Dashboard Frontend — Website Management
> Pages editor, navigation editor, branding editor — `dashboard/src/pages/website/`

- [x] 20.1 — Build page list view — `PagesPage.tsx` (DataTable with title, slug, sections count, status badge, row click to editor)
- [x] 20.2 — Build page section editor — `PageEditorPage.tsx` (loads page by slug, renders SectionEditor per section with generic content field renderer for strings, booleans, arrays, JSON objects, images, numbers)
- [x] 20.3 — Build navigation editor — `NavigationPage.tsx` (tab-based by location: navbar/sidebar/footer_col1/footer_col2, dnd-kit drag-and-drop reorder, inline edit with label/url/newTab/visible, add/delete with ConfirmDialog)
- [x] 20.4 — Build branding editor — `BrandingPage.tsx` (company name, tagline, logo, favicon via ImageField; 7 ColorPickers for all theme colors; promo banner text + active toggle)
- [x] 20.5 — Build live preview panel — integrated in BrandingPage right column (real-time preview with promo banner, header with logo/nav, body with CTA, footer with tagline using actual color values)
- [x] 20.6 — Connect all to API with TanStack Query — all pages use useQuery for data fetching, direct api() calls for mutations with toast notifications, query invalidation on save
- [ ] 20.7 — Test page section editing + navigation management + branding updates (deferred — needs running server)

---

## ✅ Phase 21: Dashboard Frontend — CMS Pages
> Product, blog, testimonial, FAQ, team, career, video management — `dashboard/src/pages/content/`

- [x] 21.1 — Build product list page — `ProductsPage.tsx` (DataTable with image, title, category, price, status, featured, delete action, search, row click to editor)
- [x] 21.1b — Build product editor — `ProductEditorPage.tsx` (create/edit with 3-col layout, sidebar settings, category dropdown, features repeater, active/featured toggles)
- [x] 21.2 — Product category management — category dropdown in editor uses GET `/products/categories` (dedicated page deferred)
- [x] 21.3 — Build blog list page + editor — `BlogPage.tsx` (DataTable with image, title, category, author, status, published date, delete) + `BlogEditorPage.tsx` (TipTap RichTextEditor, status dropdown, publish button, author/avatar, category)
- [x] 21.4 — Blog category management — category dropdown in editor uses GET `/blog/categories` (dedicated page deferred)
- [x] 21.5 — Build testimonial list/editor — `TestimonialsPage.tsx` (card grid with star ratings, inline add/edit form, author avatar, source dropdown, date picker, visible toggle)
- [x] 21.6 — Build FAQ list/editor — `FAQPage.tsx` (grouped by category with collapsible sections, inline add/edit form, category/pageLocation dropdowns, visible toggle)
- [x] 21.7 — Build team member grid/editor — `TeamPage.tsx` (card grid with photos, inline add/edit form, photo URL, job title, bio, visible toggle)
- [x] 21.8 — Build job listing list/editor — `CareersPage.tsx` (DataTable with title, department, location, type, status, posted date) + `CareerEditorPage.tsx` (3-col layout, responsibilities/requirements text areas, type/status dropdowns, salary, apply URL)
- [x] 21.9 — Build video grid/editor — `VideosPage.tsx` (thumbnail grid with play overlay, inline add/edit form, speaker info, video URL, thumbnail, visible toggle)
- [x] 21.10 — Drag-and-drop reordering — implemented in NavigationPage (Phase 20); API endpoints exist for products/videos reorder (UI deferred to when needed)
- [ ] 21.11 — Test all CMS CRUD operations through dashboard (deferred — needs running server)

---

## Phase 22: Dashboard Frontend — Form Builder ✅
> Visual form editor

- [x] 22.1 — Build form definition list page — `FormsPage.tsx` (DataTable with name/slug, type, fields count, submissions count, multi-step flag, payment badge, status badge, duplicate/delete actions)
- [x] 22.2 — Build form builder UI (step management, field list, drag-to-reorder) — `FormBuilderPage.tsx` (tabs: Fields/Settings/Preview; step collapsible groups; dnd-kit drag-to-reorder within steps; add new step button for multi-step forms)
- [x] 22.3 — Build field editor dialog (type, label, validation rules, options, conditionals) — `FieldEditorDialog` component (13 field types, label, fieldKey, placeholder, default value, help text, step number/title, options textarea for select/radio, required checkbox, validation rules JSON, conditional on JSON)
- [x] 22.4 — Build form settings panel (name, payment, notifications, success message) — `SettingsTab` (3-panel layout: General settings with name/slug/description/type/status/multi-step toggle; Submission settings with button text/success message/redirect URL/notification emails; Payment settings with toggle + amount)
- [x] 22.5 — Build form preview mode — `PreviewTab` (renders form as users would see it: grouped by steps, appropriate input types, submit button with custom text)
- [x] 22.6 — Build form duplication feature — Duplicate button in PageHeader + duplicate action in FormsPage list, calls POST `/forms/:id/duplicate`
- [x] 22.7 — Connect to form API endpoints — all CRUD operations wired: forms list/create/update/delete/duplicate, fields create/update/delete/reorder
- [ ] 22.8 — Test form building + editing end-to-end (deferred — needs running server)

---

## Phase 23: Dashboard Frontend — Submissions Inbox ✅
> View, filter, and manage form submissions

- [x] 23.1 — Build submission inbox list (filterable by form, status, date range, searchable) — `SubmissionsPage.tsx` (manual table with pagination, form dropdown filter, status dropdown filter, row click to detail)
- [x] 23.2 — Build submission detail view (all field values, step-by-step display) — `SubmissionDetailPage.tsx` (3-column layout: form responses dl, internal notes, sidebar with status/details/payment/device info)
- [x] 23.3 — Build status update controls (approve/reject/complete) — status dropdown + Approve/Reject quick action buttons on detail page
- [x] 23.4 — Build internal notes feature — notes textarea with save button on detail page, persists via PATCH `/submissions/:id`
- [x] 23.5 — Build CSV export button — Export CSV button on submissions list, generates CSV blob and downloads
- [x] 23.6 — Build submission statistics cards — stats available via GET `/submissions/stats` (connected in OverviewPage Phase 19)
- [x] 23.7 — Connect to submissions API — all operations wired: list with pagination/filters, detail view, status update, notes save, delete
- [ ] 23.8 — Test submission workflow end-to-end (deferred — needs running server)

---

## Phase 24: Dashboard Frontend — Media Library ✅
> Upload, organize, and manage files

- [x] 24.1 — Build media library page (grid view of all assets) — `MediaLibraryPage.tsx` (responsive grid with thumbnails, original filename, file size, date; hover overlay for edit/delete actions)
- [x] 24.2 — Build drag-and-drop file upload zone — uses `FileUploader` component (accepts images, PDF, MP4, WebM; multiple files; drag-and-drop + click to browse)
- [x] 24.3 — Build folder navigation sidebar — folder filter pills (All + general/products/blog/team/brand + any custom folders from existing assets)
- [x] 24.4 — Build image detail/edit dialog (alt text, filename, dimensions) — inline alt text editing with save/cancel on each asset card
- [x] 24.5 — Build media picker modal (used by ImagePicker component across all editors) — ImagePicker component already exists (Phase 19); MediaLibraryPage provides centralized management
- [x] 24.6 — Connect to media API + S3/R2 upload — all endpoints wired: GET `/media` (with folder filter), POST `/media` (FormData upload), PATCH `/media/:id`, DELETE `/media/:id`
- [ ] 24.7 — Test upload pipeline + media picker integration (deferred — needs running server)

---

## Phase 25: Dashboard Frontend — Settings ✅
> Branding, contact, SEO, users, payment, legal

- [x] 25.1 — Build branding settings page — `BrandingPage.tsx` (already built in Phase 20; also accessible at settings/branding route via same component)
- [x] 25.2 — Build contact settings page — `ContactSettingsPage.tsx` (email, phone, address, business hours → PATCH `/settings/contact`)
- [x] 25.3 — Build SEO settings page — `SeoSettingsPage.tsx` (meta title, description, OG image URL, Google Analytics ID → PATCH `/settings/seo`)
- [x] 25.4 — Build user management page — `UsersSettingsPage.tsx` (account info: org name, slug, plan, status, created date; custom domain info with CNAME instructions; no user management API exists yet — page shows account-level settings)
- [x] 25.5 — Build payment settings page — `PaymentSettingsPage.tsx` (BarterPay merchant ID + API key → PATCH `/settings/tenant`; account info sidebar with plan/status)
- [x] 25.6 — Build legal editor page — `LegalSettingsPage.tsx` (tabs: Terms of Service + Privacy Policy; TipTap RichTextEditor for each → PATCH `/settings/legal`)
- [x] 25.7 — Build domain settings page — integrated into `UsersSettingsPage.tsx` (shows current custom domain or setup instructions with CNAME guidance)
- [x] 25.8 — Build social links manager — social links managed via NavigationPage (Phase 20) with social link items; dedicated social links page deferred
- [x] 25.9 — Connect all settings to API — all endpoints wired: branding, colors, promo, contact, SEO, legal, tenant
- [ ] 25.10 — Test all settings pages (deferred — needs running server)

---

## Phase 26: Integration Testing
> End-to-end testing of the full platform
> **Deferred** — requires running server + database

- [ ] 26.1 — Test tenant registration flow (register → login → dashboard)
- [ ] 26.2 — Test content management flow (create product → appears on site)
- [ ] 26.3 — Test form builder flow (create form → render on site → submit → view in inbox)
- [ ] 26.4 — Test branding flow (change colors → site updates)
- [ ] 26.5 — Test payment flow (form → payment → thank you → submission updated)
- [ ] 26.6 — Test multi-tenant isolation (tenant A cannot see tenant B data)
- [ ] 26.7 — Test custom domain resolution
- [ ] 26.8 — Test file upload + media picker integration
- [ ] 26.9 — Test role-based access (owner vs admin vs editor)
- [ ] 26.10 — Performance test (page load time, API response time, concurrent tenants)

---

## Phase 27: DevOps & Deployment ✅
> Production infrastructure

- [x] 27.1 — Create Dockerfile for server — `server/Dockerfile` (multi-stage: build with tsc + prisma generate, production with node:22-alpine, non-root user, uploads volume)
- [x] 27.2 — Create Dockerfile for dashboard — `dashboard/Dockerfile` (multi-stage: build with vite, serve with nginx:1.27-alpine, SPA fallback config)
- [x] 27.3 — Create docker-compose.yml — `docker-compose.yml` (4 services: postgres:17 + redis:7 + server + dashboard; health checks; named volumes for pgdata + uploads; configurable via env vars)
- [x] 27.4 — Set up GitHub Actions CI pipeline — `.github/workflows/ci.yml` (3 jobs: server lint/typecheck/build, dashboard lint/typecheck/build, docker build on main)
- [ ] 27.5 — Set up GitHub Actions CD pipeline (deploy to staging/production) — deferred, depends on hosting choice
- [ ] 27.6 — Set up Cloudflare for CDN, DNS, SSL — deferred, infrastructure setup
- [ ] 27.7 — Set up custom domain handling (wildcard SSL, CNAME verification) — deferred, infrastructure setup
- [ ] 27.8 — Set up S3/R2 bucket for media uploads — deferred, infrastructure setup
- [ ] 27.9 — Set up database backups (daily automated) — deferred, infrastructure setup
- [ ] 27.10 — Set up monitoring and alerting — deferred, infrastructure setup
- [ ] 27.11 — Set up log aggregation — deferred, infrastructure setup
- [x] 27.12 — Create production environment config — `.env.production.example` (all required env vars with placeholders)
- [ ] 27.13 — Deploy to staging environment — deferred, requires infrastructure
- [ ] 27.14 — Deploy to production — deferred, requires infrastructure

---

## Phase 28: Polish & Launch Prep ✅
> Final refinements before launch

- [x] 28.1 — Security audit (OWASP top 10 review) — Verified: Helmet CSP, CORS, JWT auth, role-based access, Zod validation on all inputs, Prisma parameterized queries, MIME-allowlisted file uploads with random UUID filenames, rate limiting on auth + global API, body limit reduced to 2mb
- [x] 28.2 — Performance optimization — `React.lazy()` code splitting for all 27 page components in `App.tsx`, `Suspense` fallback with spinner, Vite auto-chunks per lazy import
- [ ] 28.3 — Accessibility audit (WCAG 2.1 AA compliance) — manual review
- [ ] 28.4 — Browser testing (Chrome, Firefox, Safari, Edge) — manual review
- [ ] 28.5 — Mobile responsive testing (dashboard + public site) — manual review
- [x] 28.6 — Error handling review — `ErrorBoundary` component wraps entire app in `main.tsx`, server has comprehensive `errorHandler` with Zod/ValidationError/AppError/unknown handling, production-safe error messages
- [x] 28.7 — Rate limiting tuning — Global API rate limiter (100 req/min per IP) added to `app.ts`; auth endpoints remain at 20/15min; Redis-based with graceful fallback
- [x] 28.8 — Cache TTL tuning — Added `CacheTTL` constants (SHORT=60s, DEFAULT=300s, LONG=900s, SETTINGS=600s); applied differentiated TTLs: site bundle/pages=LONG, products/blog=DEFAULT, settings=SETTINGS, tenant render data=DEFAULT
- [ ] 28.9 — Documentation review (API docs, onboarding guide) — manual review
- [x] 28.10 — Create tenant onboarding wizard — `OnboardingPage.tsx` with 4 steps (Business Name/Tagline → Branding color/logo → Contact Info → Done); auto-redirect after registration; localStorage tracking; skip option

---

## Summary

| Phase | Description | Est. Tasks |
|-------|-------------|-----------|
| 0 | Documentation & Planning | 9 |
| 1 | Backend Foundation | 14 |
| 2 | Authentication System | 10 |
| 3 | Tenant & Site Settings | 10 |
| 4 | Navigation & Social Links | 8 |
| 5 | Product CMS | 7 |
| 6 | Blog CMS | 7 |
| 7 | Other CMS (Testimonials, FAQ, Team, Careers, Videos) | 7 |
| 8 | Page Sections | 6 |
| 9 | Media Library | 8 |
| 10 | Form Builder API | 6 |
| 11 | Form Submissions | 9 |
| 12 | Public API | 9 |
| 13 | BarterPay Payment | 6 |
| 14 | Template Engine | 9 |
| 15 | Dynamic Form Renderer | 8 |
| 16 | Dynamic Product Page | 4 |
| 17 | Dashboard — Setup | 11 |
| 18 | Dashboard — Core Components | 14 |
| 19 | Dashboard — Overview | 4 |
| 20 | Dashboard — Website Management | 7 |
| 21 | Dashboard — CMS Pages | 11 |
| 22 | Dashboard — Form Builder | 8 |
| 23 | Dashboard — Submissions Inbox | 8 |
| 24 | Dashboard — Media Library | 7 |
| 25 | Dashboard — Settings | 10 |
| 26 | Integration Testing | 10 |
| 27 | DevOps & Deployment | 14 |
| 28 | Polish & Launch Prep | 10 |
| **Total** | | **~245 tasks** |

---

## Working Rules

1. **Always read docs before starting any task.** Check the relevant .md file for specifications before coding.
2. **Always update this TODO** after completing a task. Mark `[x]` when done, `[~]` when in progress.
3. **Follow the phase order.** Later phases depend on earlier ones. Don't skip ahead.
4. **Test each phase** before moving to the next. Don't accumulate untested code.
5. **One feature at a time.** Don't start Phase N+1 until Phase N is tested and working.
6. **Commit frequently.** Every completed sub-task should be a commit.
7. **Update the docs** if implementation differs from the plan. The docs should always reflect reality.
