# Database Schema

> **Last updated:** 2026-03-15
> **Database:** PostgreSQL 16+
> **ORM:** Prisma

## Overview

The database powers a multi-tenant SaaS platform. Every content table is scoped by `tenant_id`. The schema is designed so tenants can manage all visible content on their website through the dashboard without any code changes.

---

## Entity Relationship Diagram

```
tenants ─────────────────────────────────────────────────────────────┐
  │                                                                  │
  ├── users (tenant admins/editors)                                  │
  │     └── sessions                                                 │
  │     └── audit_logs                                               │
  │                                                                  │
  ├── site_settings (branding, colors, meta)                         │
  │                                                                  │
  ├── pages (per-page content blocks)                                │
  │     └── page_sections (ordered content within pages)             │
  │                                                                  │
  ├── navigation_items (navbar + footer links)                       │
  │                                                                  │
  ├── products ──────────────────────────────────────┐               │
  │     └── product_categories                       │               │
  │                                                  │               │
  ├── blog_posts ────────────────────────────────────│               │
  │     └── blog_categories                          │               │
  │                                                  │               │
  ├── testimonials                                   │               │
  │                                                  │               │
  ├── faq_items                                      │               │
  │     └── faq_categories                           │               │
  │                                                  │               │
  ├── team_members                                   │               │
  │                                                  │               │
  ├── job_listings                                   │               │
  │                                                  │               │
  ├── form_definitions ──────────────────────────────│               │
  │     └── form_fields                              │               │
  │     └── form_submissions ────────────────────────┘               │
  │           └── form_submission_data                               │
  │                                                                  │
  ├── media_assets (uploaded images/files)                           │
  │                                                                  │
  └── social_links                                                   │
                                                                     │
super_admins (platform-level, not tenant-scoped) ────────────────────┘
templates (shared across all tenants)
```

---

## Table Definitions

### 1. `tenants`
The core table. Every company on the platform is a tenant.

```sql
CREATE TABLE tenants (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(255) NOT NULL,                     -- "Ethical Life"
    slug            VARCHAR(100) NOT NULL UNIQUE,              -- "ethicallife" (used in subdomain)
    custom_domain   VARCHAR(255) UNIQUE,                       -- "www.ethicallife.co.uk" (optional)
    template_id     UUID REFERENCES templates(id),             -- which template they use
    status          VARCHAR(20) DEFAULT 'active',              -- active | suspended | trial | cancelled
    plan            VARCHAR(50) DEFAULT 'starter',             -- starter | professional | enterprise
    barterpay_merchant_id  VARCHAR(255),                       -- their BarterPay merchant credentials
    barterpay_api_key      TEXT,                               -- encrypted BarterPay API key
    trial_ends_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tenants_slug ON tenants(slug);
CREATE INDEX idx_tenants_custom_domain ON tenants(custom_domain);
CREATE INDEX idx_tenants_status ON tenants(status);
```

---

### 2. `users`
Tenant team members who log into the dashboard.

```sql
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email           VARCHAR(255) NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,                     -- bcrypt
    full_name       VARCHAR(255) NOT NULL,
    role            VARCHAR(20) NOT NULL DEFAULT 'admin',      -- owner | admin | editor
    avatar_url      TEXT,
    is_active       BOOLEAN DEFAULT TRUE,
    last_login_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(tenant_id, email)
);

CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_users_email ON users(email);
```

---

### 3. `sessions`
JWT refresh token storage for secure auth.

```sql
CREATE TABLE sessions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token   VARCHAR(512) NOT NULL UNIQUE,
    user_agent      TEXT,
    ip_address      INET,
    expires_at      TIMESTAMPTZ NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(refresh_token);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);
```

---

### 4. `site_settings`
Global branding and configuration for each tenant's website.

```sql
CREATE TABLE site_settings (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,

    -- Branding
    company_name    VARCHAR(255) NOT NULL,                     -- displayed on site
    logo_url        TEXT,                                       -- main logo
    favicon_url     TEXT,                                       -- browser tab icon
    tagline         VARCHAR(500),                               -- "Your Health, Reimagined"

    -- Colors (CSS custom properties)
    color_primary       VARCHAR(7) DEFAULT '#0D0D0D',          -- --color-black
    color_accent        VARCHAR(7) DEFAULT '#FFCD93',          -- --color-accent
    color_secondary     VARCHAR(7) DEFAULT '#FF967A',          -- --color-secondary
    color_background    VARCHAR(7) DEFAULT '#E6E6E6',          -- --color-bg
    color_border        VARCHAR(7) DEFAULT '#D9D9D9',          -- --color-border
    color_border_light  VARCHAR(7) DEFAULT '#EBEBEB',          -- --color-border-light
    color_white         VARCHAR(7) DEFAULT '#FFFFFF',          -- --color-white

    -- Contact info
    contact_email       VARCHAR(255),
    contact_phone       VARCHAR(50),
    contact_address     TEXT,
    business_hours      VARCHAR(255),                          -- "Mon-Fri 9am - 6pm"

    -- SEO / Meta
    meta_title          VARCHAR(255),
    meta_description    TEXT,
    og_image_url        TEXT,
    google_analytics_id VARCHAR(50),

    -- App store links
    app_store_url       TEXT,
    play_store_url      TEXT,

    -- Promo banner
    promo_banner_text   VARCHAR(500),                          -- "20% off now claimed"
    promo_banner_active BOOLEAN DEFAULT FALSE,

    -- Footer text
    footer_tagline      TEXT,                                  -- "Written by board-certified doctors..."

    -- Legal
    terms_content       TEXT,                                  -- full terms & conditions (markdown)
    privacy_content     TEXT,                                  -- full privacy policy (markdown)

    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

---

### 5. `pages`
Per-page editable content. Each page has sections with configurable text, images, etc.

```sql
CREATE TABLE pages (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    slug            VARCHAR(100) NOT NULL,                     -- "home", "about", "contact", etc.
    title           VARCHAR(255),                              -- page title for SEO
    meta_description TEXT,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(tenant_id, slug)
);

CREATE INDEX idx_pages_tenant_slug ON pages(tenant_id, slug);
```

---

### 6. `page_sections`
Individual content blocks within a page. Maps to the HTML partials.

```sql
CREATE TABLE page_sections (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    page_id         UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
    section_key     VARCHAR(100) NOT NULL,                     -- "hero", "intro", "markers", "expert", "guide", "whatif"
    sort_order      INTEGER DEFAULT 0,
    is_visible      BOOLEAN DEFAULT TRUE,

    -- Flexible content stored as JSONB
    -- Structure depends on section_key:
    --
    -- hero:    { headline, tagline, cta_text, cta_url, stats: [{label, value}], bg_image }
    -- intro:   { title, description, cta_text, cta_url }
    -- markers: { title, subtitle, boxes: [{icon, title, description}] }
    -- expert:  { heading, quote, video_url, author_name, author_title }
    -- guide:   { title, description, cta_text, email_placeholder, boxes: [{title, description, icon}] }
    -- whatif:   { slides: [{title, subtitle}] }
    -- about_mission: { title, content }
    -- about_values:  { values: [{icon, title, description}] }
    -- about_stats:   { stats: [{value, label}] }
    -- contact_info:  { cards: [{icon, title, details}] }
    --
    content         JSONB NOT NULL DEFAULT '{}',

    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(tenant_id, page_id, section_key)
);

CREATE INDEX idx_page_sections_page ON page_sections(page_id);
CREATE INDEX idx_page_sections_tenant ON page_sections(tenant_id);
```

---

### 7. `navigation_items`
Configurable navbar, sidebar, and footer links.

```sql
CREATE TABLE navigation_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    location        VARCHAR(20) NOT NULL,                      -- "navbar" | "sidebar" | "footer_col1" | "footer_col2"
    label           VARCHAR(100) NOT NULL,                     -- "Shop", "Contact Us", "FAQs"
    url             VARCHAR(500) NOT NULL,                     -- "/pages/shop.html" or external URL
    sort_order      INTEGER DEFAULT 0,
    is_visible      BOOLEAN DEFAULT TRUE,
    open_in_new_tab BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_nav_items_tenant_location ON navigation_items(tenant_id, location);
```

---

### 8. `social_links`
Tenant social media profiles.

```sql
CREATE TABLE social_links (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    platform        VARCHAR(50) NOT NULL,                      -- "instagram" | "whatsapp" | "tiktok" | "facebook" | "messenger" | "twitter" | "linkedin" | "youtube"
    url             TEXT NOT NULL,
    icon_url        TEXT,                                       -- custom icon override (optional)
    sort_order      INTEGER DEFAULT 0,
    is_visible      BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(tenant_id, platform)
);

CREATE INDEX idx_social_links_tenant ON social_links(tenant_id);
```

---

### 9. `product_categories`

```sql
CREATE TABLE product_categories (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name            VARCHAR(100) NOT NULL,                     -- "Weight Loss", "Wellness", "Supplements"
    slug            VARCHAR(100) NOT NULL,
    sort_order      INTEGER DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(tenant_id, slug)
);
```

---

### 10. `products`
Full product catalog managed through the dashboard.

```sql
CREATE TABLE products (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    category_id     UUID REFERENCES product_categories(id) ON DELETE SET NULL,
    slug            VARCHAR(200) NOT NULL,                     -- "semaglutide"
    title           VARCHAR(255) NOT NULL,                     -- "Semaglutide Injection"
    tagline         VARCHAR(500),                              -- short marketing line
    description     TEXT,                                       -- full product description
    price_text      VARCHAR(100),                              -- "From £149/mo" (display text, not amount)
    price_amount    DECIMAL(10,2),                             -- 149.00 (for payment processing)
    currency        VARCHAR(3) DEFAULT 'GBP',
    image_url       TEXT,                                       -- main product image
    tag             VARCHAR(50),                               -- "Best Seller", "New", etc.
    features        JSONB DEFAULT '[]',                        -- ["FDA-approved", "Weekly injection", ...]
    how_it_works    TEXT,                                       -- detailed description
    is_active       BOOLEAN DEFAULT TRUE,
    is_featured     BOOLEAN DEFAULT FALSE,                     -- show in homepage carousel
    sort_order      INTEGER DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(tenant_id, slug)
);

CREATE INDEX idx_products_tenant ON products(tenant_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_tenant_active ON products(tenant_id, is_active);
```

---

### 11. `blog_categories`

```sql
CREATE TABLE blog_categories (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name            VARCHAR(100) NOT NULL,                     -- "Weight Loss", "Wellness", "Telehealth"
    slug            VARCHAR(100) NOT NULL,
    sort_order      INTEGER DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(tenant_id, slug)
);
```

---

### 12. `blog_posts`
Full blog CMS.

```sql
CREATE TABLE blog_posts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    category_id     UUID REFERENCES blog_categories(id) ON DELETE SET NULL,
    slug            VARCHAR(300) NOT NULL,
    title           VARCHAR(500) NOT NULL,
    excerpt         TEXT,                                       -- short preview text
    content         TEXT,                                       -- full article (markdown or HTML)
    cover_image_url TEXT,
    author_name     VARCHAR(255),
    author_avatar   TEXT,
    read_time       VARCHAR(20),                               -- "8 min read"
    status          VARCHAR(20) DEFAULT 'draft',               -- draft | published | archived
    is_featured     BOOLEAN DEFAULT FALSE,                     -- show as featured post
    published_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(tenant_id, slug)
);

CREATE INDEX idx_blog_posts_tenant ON blog_posts(tenant_id);
CREATE INDEX idx_blog_posts_status ON blog_posts(tenant_id, status);
CREATE INDEX idx_blog_posts_published ON blog_posts(tenant_id, published_at);
```

---

### 13. `testimonials`
Customer reviews/stories.

```sql
CREATE TABLE testimonials (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    author_name     VARCHAR(255) NOT NULL,                     -- "Sarah Thompson"
    author_avatar   TEXT,                                       -- avatar image URL
    rating          SMALLINT DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
    review_text     TEXT NOT NULL,
    review_date     DATE,
    source          VARCHAR(50),                               -- "Google", "Trustpilot", etc.
    is_visible      BOOLEAN DEFAULT TRUE,
    sort_order      INTEGER DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_testimonials_tenant ON testimonials(tenant_id);
```

---

### 14. `faq_categories`

```sql
CREATE TABLE faq_categories (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name            VARCHAR(100) NOT NULL,                     -- "General", "Treatment", "Orders & Shipping"
    slug            VARCHAR(100) NOT NULL,
    sort_order      INTEGER DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(tenant_id, slug)
);
```

---

### 15. `faq_items`

```sql
CREATE TABLE faq_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    category_id     UUID REFERENCES faq_categories(id) ON DELETE SET NULL,
    question        TEXT NOT NULL,
    answer          TEXT NOT NULL,                              -- supports markdown
    page_location   VARCHAR(50) DEFAULT 'faq_page',           -- "home" (shows on homepage) | "faq_page" | "both"
    sort_order      INTEGER DEFAULT 0,
    is_visible      BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_faq_items_tenant ON faq_items(tenant_id);
CREATE INDEX idx_faq_items_page ON faq_items(tenant_id, page_location);
```

---

### 16. `team_members`

```sql
CREATE TABLE team_members (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    full_name       VARCHAR(255) NOT NULL,
    job_title       VARCHAR(255),                              -- "Chief Medical Officer"
    bio             TEXT,
    photo_url       TEXT,
    sort_order      INTEGER DEFAULT 0,
    is_visible      BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_team_members_tenant ON team_members(tenant_id);
```

---

### 17. `job_listings`

```sql
CREATE TABLE job_listings (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    title           VARCHAR(255) NOT NULL,                     -- "Senior Pharmacist"
    department      VARCHAR(100),                              -- "Clinical"
    location        VARCHAR(255),                              -- "London, UK"
    type            VARCHAR(50),                               -- "Full-Time" | "Part-Time" | "Contract"
    description     TEXT,                                       -- full job description (markdown)
    responsibilities JSONB DEFAULT '[]',                       -- bullet points
    requirements    JSONB DEFAULT '[]',                        -- bullet points
    salary_range    VARCHAR(100),                              -- "£55,000 - £70,000"
    apply_url       TEXT,                                       -- external application link
    status          VARCHAR(20) DEFAULT 'active',              -- active | closed | draft
    posted_at       TIMESTAMPTZ DEFAULT NOW(),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_job_listings_tenant ON job_listings(tenant_id);
CREATE INDEX idx_job_listings_status ON job_listings(tenant_id, status);
```

---

### 18. `videos`
Video testimonials / content shown on the homepage.

```sql
CREATE TABLE videos (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    title           VARCHAR(255),
    speaker_name    VARCHAR(255),                              -- "Dr Sarah Mitchell"
    speaker_role    VARCHAR(255),                              -- "Medical Director"
    speaker_avatar  TEXT,                                       -- avatar image URL
    video_url       TEXT NOT NULL,                              -- video file URL
    thumbnail_url   TEXT,
    sort_order      INTEGER DEFAULT 0,
    is_visible      BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_videos_tenant ON videos(tenant_id);
```

---

### 19. `form_definitions`
Configurable forms. Each tenant can create multiple forms and attach them to different pages/products.

```sql
CREATE TABLE form_definitions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name            VARCHAR(255) NOT NULL,                     -- "Patient Intake Form", "Contact Form"
    slug            VARCHAR(200) NOT NULL,
    description     TEXT,
    type            VARCHAR(50) DEFAULT 'intake',              -- "intake" | "contact" | "newsletter" | "custom"
    is_multi_step   BOOLEAN DEFAULT TRUE,
    submit_button_text VARCHAR(100) DEFAULT 'Submit',
    success_message TEXT DEFAULT 'Thank you for your submission.',
    redirect_url    TEXT,                                       -- where to go after submission
    requires_payment BOOLEAN DEFAULT FALSE,                    -- send to payment after form?
    payment_amount  DECIMAL(10,2),
    notification_emails TEXT[],                                -- emails to notify on submission
    status          VARCHAR(20) DEFAULT 'active',              -- active | inactive | archived
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(tenant_id, slug)
);

CREATE INDEX idx_form_defs_tenant ON form_definitions(tenant_id);
```

---

### 20. `form_fields`
Individual fields within a form definition.

```sql
CREATE TABLE form_fields (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_definition_id  UUID NOT NULL REFERENCES form_definitions(id) ON DELETE CASCADE,
    tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    field_key           VARCHAR(100) NOT NULL,                  -- "fullName", "email", "conditions"
    field_type          VARCHAR(50) NOT NULL,                   -- "text" | "email" | "tel" | "number" | "date" | "select" | "textarea" | "checkbox" | "checkbox_group" | "radio"
    label               VARCHAR(255) NOT NULL,                  -- "Full Name"
    placeholder         VARCHAR(255),                           -- "Enter your full name"
    help_text           TEXT,                                    -- hint below the field
    step_number         INTEGER DEFAULT 0,                      -- which step this field appears on (for multi-step forms)
    step_title          VARCHAR(255),                           -- "Patient Details"
    sort_order          INTEGER DEFAULT 0,
    is_required         BOOLEAN DEFAULT FALSE,
    validation_rules    JSONB DEFAULT '{}',                     -- { minLength: 2, maxLength: 100, pattern: "^[a-zA-Z ]+" }
    options             JSONB DEFAULT '[]',                     -- for select/radio/checkbox_group: [{value, label}]
    conditional_on      JSONB,                                  -- { field_key: "goal", value: "other" } — show only when condition met
    default_value       TEXT,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_form_fields_def ON form_fields(form_definition_id);
CREATE INDEX idx_form_fields_step ON form_fields(form_definition_id, step_number);
```

---

### 21. `form_submissions`
Completed form entries from site visitors.

```sql
CREATE TABLE form_submissions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    form_definition_id  UUID NOT NULL REFERENCES form_definitions(id) ON DELETE CASCADE,
    product_id          UUID REFERENCES products(id) ON DELETE SET NULL,   -- which product referred them (if any)
    source              VARCHAR(255),                           -- "homepage", "shop", "product_page", etc.
    status              VARCHAR(30) DEFAULT 'new',              -- new | in_review | approved | rejected | completed
    payment_status      VARCHAR(30),                            -- pending | completed | failed | refunded
    payment_amount      DECIMAL(10,2),
    paid_at             TIMESTAMPTZ,
    notes               TEXT,                                    -- internal notes from tenant team
    ip_address          INET,
    user_agent          TEXT,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_submissions_tenant ON form_submissions(tenant_id);
CREATE INDEX idx_submissions_form ON form_submissions(form_definition_id);
CREATE INDEX idx_submissions_status ON form_submissions(tenant_id, status);
CREATE INDEX idx_submissions_created ON form_submissions(tenant_id, created_at);
```

---

### 22. `form_submission_data`
Individual field values within a submission.

```sql
CREATE TABLE form_submission_data (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id       UUID NOT NULL REFERENCES form_submissions(id) ON DELETE CASCADE,
    field_key           VARCHAR(100) NOT NULL,                  -- "fullName"
    field_label         VARCHAR(255),                           -- "Full Name" (snapshot at submission time)
    value               TEXT,                                    -- the submitted value
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_submission_data_sub ON form_submission_data(submission_id);
```

---

### 23. `media_assets`
Centralized media library for all tenant uploads.

```sql
CREATE TABLE media_assets (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    filename        VARCHAR(500) NOT NULL,
    original_name   VARCHAR(500) NOT NULL,                     -- original upload filename
    mime_type       VARCHAR(100) NOT NULL,                     -- "image/png", "image/svg+xml", "video/mp4"
    file_size       BIGINT NOT NULL,                           -- bytes
    url             TEXT NOT NULL,                              -- full URL to file in S3/R2
    alt_text        VARCHAR(500),
    width           INTEGER,                                    -- image dimensions (optional)
    height          INTEGER,
    folder          VARCHAR(255) DEFAULT 'general',            -- organizational folder: "logos", "products", "blog", "team"
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_media_tenant ON media_assets(tenant_id);
CREATE INDEX idx_media_folder ON media_assets(tenant_id, folder);
```

---

### 24. `audit_logs`
Track every admin action for security and accountability.

```sql
CREATE TABLE audit_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
    action          VARCHAR(100) NOT NULL,                     -- "product.create", "blog_post.update", "form.delete"
    entity_type     VARCHAR(100),                              -- "product", "blog_post", "form_definition"
    entity_id       UUID,                                      -- ID of the affected record
    changes         JSONB,                                     -- { before: {...}, after: {...} }
    ip_address      INET,
    user_agent      TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_tenant ON audit_logs(tenant_id);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_created ON audit_logs(tenant_id, created_at);
```

---

### 25. `templates`
Website templates (currently one; future expansion).

```sql
CREATE TABLE templates (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(255) NOT NULL,                     -- "Healthcare Pro"
    slug            VARCHAR(100) NOT NULL UNIQUE,              -- "healthcare-pro"
    description     TEXT,
    thumbnail_url   TEXT,                                       -- preview image
    version         VARCHAR(20) DEFAULT '1.0.0',
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

---

### 26. `super_admins`
Platform-level administrators (BarterPay team). Not tenant-scoped.

```sql
CREATE TABLE super_admins (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    full_name       VARCHAR(255) NOT NULL,
    role            VARCHAR(20) DEFAULT 'admin',               -- admin | super
    is_active       BOOLEAN DEFAULT TRUE,
    last_login_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Data Mapping: Current Hardcoded Content -> Database

This table shows exactly where each piece of currently hardcoded content will live in the database.

| Current Location | Current Content | Database Table | Database Field |
|-----------------|----------------|----------------|----------------|
| `topbar.html` promo text | "20% off now claimed" | `site_settings` | `promo_banner_text` |
| `topbar.html` logo | logo.svg | `site_settings` | `logo_url` |
| `topbar.html` nav links | Explore, Redeem | `navigation_items` | `label`, `url` |
| `topbar.html` sidebar links | Careers, Terms, Privacy | `navigation_items` | `label`, `url` |
| `hero.html` headline | "Your Health, Reimagined" | `page_sections` | `content.headline` |
| `hero.html` tagline | "Modern healthcare..." | `page_sections` | `content.tagline` |
| `hero.html` stats | 12,400+, 46, 22 lbs | `page_sections` | `content.stats[]` |
| `hero.html` bg image | bg.png | `page_sections` | `content.bg_image` |
| `intro.html` title | "Healthcare That Fits..." | `page_sections` | `content.title` |
| `intro.html` description | body text | `page_sections` | `content.description` |
| `carousel.html` products | 6 product cards | `products` | `is_featured = true` |
| `expert.html` heading | "toward a healthier..." | `page_sections` | `content.heading` |
| `video-section.html` videos | 8 video entries | `videos` | all fields |
| `markers.html` boxes | 4 value prop boxes | `page_sections` | `content.boxes[]` |
| `whatif.html` slides | 5 rotating slides | `page_sections` | `content.slides[]` |
| `stories.html` reviews | 8 reviews | `testimonials` | all fields |
| `faq.html` items | 5 homepage FAQs | `faq_items` | `page_location = "home"` |
| `guide.html` content | CTA text, boxes | `page_sections` | `content.*` |
| `footer.html` links | 11 links in 2 columns | `navigation_items` | `location = "footer_*"` |
| `footer.html` socials | 5 social icons | `social_links` | all fields |
| `footer.html` tagline | "Written by board-certified..." | `site_settings` | `footer_tagline` |
| `shop-grid.html` products | 6 product cards | `products` | `is_active = true` |
| `shop-grid.html` filters | All, Weight Loss, etc. | `product_categories` | `name` |
| `product.js` product data | 6 hardcoded products | `products` | all fields |
| `blog-content.html` posts | 6 blog cards + featured | `blog_posts` | all fields |
| `about-content.html` values | 6 value cards | `page_sections` | section_key = "about_values" |
| `about-content.html` team | 4 team profiles | `team_members` | all fields |
| `about-content.html` stats | 15K+, 50+, 98%, 24/7 | `page_sections` | section_key = "about_stats" |
| `contact-content.html` info | email, phone, hours | `site_settings` | `contact_*` |
| `careers-content.html` jobs | 4 job listings | `job_listings` | all fields |
| `faq-page-content.html` FAQ | 9 items in 3 categories | `faq_items` + `faq_categories` | all fields |
| `privacy-content.html` | full policy text | `site_settings` | `privacy_content` |
| `terms-content.html` | full terms text | `site_settings` | `terms_content` |
| `forms.js` form fields | 7-step intake form | `form_definitions` + `form_fields` | all fields |

---

## Prisma Schema Reference

The SQL above translates to a Prisma schema. The full `schema.prisma` file will be created during implementation. Key decisions:

- All UUID primary keys via `@default(uuid())`
- `tenant_id` on every content model with `@relation` and `onDelete: Cascade`
- JSONB fields use Prisma's `Json` type
- Timestamps via `@default(now())` and `@updatedAt`
- Unique constraints via `@@unique([tenant_id, slug])` compound indexes
