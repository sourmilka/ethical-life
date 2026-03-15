# Dashboard Features

> **Last updated:** 2026-03-15
> **Framework:** React 19 + Vite + TailwindCSS
> **State:** TanStack Query + React Hook Form

## 1. Dashboard Layout

```
┌──────────────────────────────────────────────────────────────────────┐
│  Logo    BarterPay Dashboard           [Notifications] [User Menu]  │
├──────────┬───────────────────────────────────────────────────────────┤
│          │                                                          │
│ Sidebar  │                    Main Content Area                     │
│          │                                                          │
│ Overview │    ┌─────────────────────────────────────────────┐       │
│ Website  │    │                                             │       │
│  ├ Pages │    │        Route-specific content renders here  │       │
│  ├ Nav   │    │                                             │       │
│  └ Brand │    │        (Tables, Forms, Editors, Previews)   │       │
│ Content  │    │                                             │       │
│  ├ Blog  │    │                                             │       │
│  ├ Prods │    └─────────────────────────────────────────────┘       │
│  ├ FAQs  │                                                          │
│  ├ Team  │                                                          │
│  ├ Jobs  │                                                          │
│  ├ Revws │                                                          │
│  └ Video │                                                          │
│ Forms    │                                                          │
│  ├ Build │                                                          │
│  └ Subs  │                                                          │
│ Media    │                                                          │
│ Settings │                                                          │
│  ├ Brand │                                                          │
│  ├ Users │                                                          │
│  ├ Pay   │                                                          │
│  └ Legal │                                                          │
│          │                                                          │
│ [Prevw]  │                                                          │
└──────────┴───────────────────────────────────────────────────────────┘
```

---

## 2. Dashboard Routes

```
/dashboard
├── /                           Overview / Home
├── /website
│   ├── /pages                  Page list + section editors
│   │   └── /pages/:slug        Edit sections for specific page
│   ├── /navigation             Navbar + sidebar + footer links
│   └── /branding               Logo, colors, favicon, promo banner
├── /content
│   ├── /products               Product catalog CRUD
│   │   └── /products/:id       Product editor
│   ├── /blog                   Blog post CRUD
│   │   └── /blog/:id           Blog post editor (rich text)
│   ├── /faq                    FAQ item CRUD
│   ├── /team                   Team member CRUD
│   ├── /careers                Job listing CRUD
│   │   └── /careers/:id        Job listing editor
│   ├── /testimonials           Customer review CRUD
│   └── /videos                 Video content CRUD
├── /forms
│   ├── /                       Form definitions list
│   ├── /builder/:id            Visual form editor
│   └── /submissions            Submission inbox
│       └── /submissions/:id    View single submission
├── /media                      Media library (images, files)
├── /settings
│   ├── /branding               Logo, colors, company info
│   ├── /contact                Contact details, business hours
│   ├── /seo                    Meta titles, descriptions, OG images
│   ├── /users                  Team management + invites
│   ├── /payment                BarterPay configuration
│   └── /legal                  Terms & Privacy editors
└── /preview                    Live site preview in iframe
```

---

## 3. Feature Specifications

### 3.1 Overview Page (`/dashboard`)

Provides at-a-glance metrics and quick actions.

**Cards:**
| Card | Data | Source |
|------|------|--------|
| Total Submissions | Count of all form submissions | `form_submissions` |
| New (Today) | Submissions with status "new" from today | `form_submissions` |
| Products | Count of active products | `products` |
| Blog Posts | Count of published posts | `blog_posts` |

**Recent Activity Feed:**
- Last 10 form submissions (name, form type, date, status badge)
- Click to view full submission

**Quick Actions:**
- "View Live Site" (opens tenant site in new tab)
- "Add Product"
- "Write Blog Post"
- "View Submissions"

---

### 3.2 Pages Editor (`/dashboard/website/pages`)

Edit all content on every page without touching code. Each page shows its editable sections.

**Page List View:**
| Column | Content |
|--------|---------|
| Page Name | Home, About, Contact, etc. |
| Sections | Number of editable sections |
| Status | Active / Inactive toggle |
| Last Updated | Timestamp |

**Section Editor View (per page):**
When you click a page, you see all its sections with inline editors.

#### Home Page Sections:
| Section | Editable Fields | Field Types |
|---------|----------------|-------------|
| **Hero** | Headline, Tagline, CTA text, CTA URL, Background image, Stats (label + value pairs) | Text inputs, Image picker, Repeater |
| **Intro** | Title, Description, CTA text, CTA URL | Text inputs, Textarea |
| **Carousel** | (Auto-populated from featured products) | Read-only link to Products |
| **Expert** | Heading, Quote text, Video URL, Author name, Author title | Text inputs, Video URL |
| **Video Grid** | (Auto-populated from Videos) | Read-only link to Videos |
| **Markers** | Section title, Section subtitle, 4 boxes (icon + title + description each) | Text inputs, Icon picker, Repeater |
| **What If Wheel** | 5 slides (title + subtitle each) | Repeater with text inputs |
| **FAQ** | (Auto-populated from FAQ items with page_location = "home") | Read-only link to FAQs |
| **Stories** | (Auto-populated from Testimonials) | Read-only link to Testimonials |
| **Guide** | Title, Description, CTA text, Email placeholder, 2 boxes (title + description each) | Text inputs, Repeater |

#### About Page Sections:
| Section | Editable Fields |
|---------|----------------|
| **Mission** | Title, Content (rich text) |
| **Values** | Repeater: icon + title + description per value card |
| **Team** | (Auto-populated from Team Members) |
| **Stats** | Repeater: value + label per stat box |

#### Contact Page Sections:
| Section | Editable Fields |
|---------|----------------|
| **Contact Info** | Repeater: icon + title + details per info card |
| **Contact Form** | (Uses form builder; linked form_definition) |
| **Social Links** | (Auto-populated from Social Links) |

**Section Editor UI Pattern:**
```
┌──────────────────────────────────────────────────┐
│ Hero Section                          [Visible ✓]│
├──────────────────────────────────────────────────┤
│                                                  │
│  Headline:  [Your Health, Reimagined          ]  │
│                                                  │
│  Tagline:   [Modern healthcare with            ] │
│             [convenience, powered by science   ] │
│                                                  │
│  CTA Text:  [Get Started                      ]  │
│  CTA URL:   [/pages/forms.html                ]  │
│                                                  │
│  Background Image:  [bg.png] [Change Image]      │
│                                                  │
│  Stats:                                          │
│  ┌────────────────────────────────────────────┐  │
│  │ [12,400+     ] [Patients Treated    ] [x]  │  │
│  │ [46          ] [Licensed Clinicians ] [x]  │  │
│  │ [22 lbs      ] [Avg. Weight Lost    ] [x]  │  │
│  │                              [+ Add Stat]  │  │
│  └────────────────────────────────────────────┘  │
│                                                  │
│               [Save Changes]  [Discard]          │
└──────────────────────────────────────────────────┘
```

---

### 3.3 Navigation Editor (`/dashboard/website/navigation`)

Manage all links in navbar, sidebar, and footer.

**UI:** Drag-and-drop list grouped by location tab:

```
[Navbar] [Sidebar] [Footer Col 1] [Footer Col 2]

┌──────────────────────────────────────────────────┐
│ ≡  Explore Weight Loss    /pages/shop.html   [✎] │
│ ≡  Redeem Code            /pages/forms.html  [✎] │
│                                    [+ Add Link]  │
└──────────────────────────────────────────────────┘
```

**Link Editor Fields:**
- Label (text)
- URL (text or page picker dropdown)
- Open in new tab (toggle)
- Visible (toggle)

---

### 3.4 Branding Editor (`/dashboard/website/branding`)

Real-time preview of brand changes.

```
┌─────────────────────┬────────────────────────────┐
│ Settings Panel      │       Live Preview          │
│                     │  ┌────────────────────────┐ │
│ Logo: [logo.svg]    │  │  Scaled-down preview   │ │
│       [Upload New]  │  │  of site header/hero   │ │
│                     │  │  with current colors   │ │
│ Favicon: [icon]     │  │  and logo applied      │ │
│          [Upload]   │  │                        │ │
│                     │  └────────────────────────┘ │
│ Colors:             │                             │
│ Primary:   [■ ####] │                             │
│ Accent:    [■ ####] │                             │
│ Secondary: [■ ####] │                             │
│ Background:[■ ####] │                             │
│ Border:    [■ ####] │                             │
│                     │                             │
│ Promo Banner:       │                             │
│ Text: [20% off...]  │                             │
│ Active: [✓]         │                             │
│                     │                             │
│ Company Name:       │                             │
│ [Ethical Life     ]  │                             │
│                     │                             │
│ Tagline:            │                             │
│ [Your Health... ]    │                             │
│                     │                             │
│    [Save Changes]   │                             │
└─────────────────────┴────────────────────────────┘
```

---

### 3.5 Product Manager (`/dashboard/content/products`)

**List View:**
| Column | Content |
|--------|---------|
| Image | Product thumbnail |
| Title | Product name |
| Category | Weight Loss / Wellness / etc. |
| Price | Display price text |
| Status | Active / Inactive badge |
| Featured | Star icon (show on homepage carousel) |
| Actions | Edit, Duplicate, Delete |

**Product Editor:**
| Field | Type | Maps To |
|-------|------|---------|
| Title | Text input | `products.title` |
| Slug | Auto-generated from title (editable) | `products.slug` |
| Category | Dropdown (from product_categories) | `products.category_id` |
| Tagline | Text input | `products.tagline` |
| Description | Rich text editor | `products.description` |
| Price Display | Text ("From £149/mo") | `products.price_text` |
| Price Amount | Number (for payment) | `products.price_amount` |
| Currency | Dropdown (GBP/USD/EUR) | `products.currency` |
| Image | Image upload/picker | `products.image_url` |
| Tag | Text ("Best Seller", "New") | `products.tag` |
| Features | Repeater (list of text items) | `products.features` JSONB |
| How It Works | Textarea | `products.how_it_works` |
| Active | Toggle | `products.is_active` |
| Featured | Toggle (show on homepage) | `products.is_featured` |

---

### 3.6 Blog Manager (`/dashboard/content/blog`)

**List View:**
| Column | Content |
|--------|---------|
| Image | Cover image thumbnail |
| Title | Post title |
| Category | Blog category badge |
| Author | Author name |
| Status | Draft / Published / Archived badge |
| Published | Date or "Not published" |
| Actions | Edit, Publish/Unpublish, Delete |

**Blog Editor:**
Full-page editor with:
- Title field (large text)
- Category dropdown
- Cover image upload
- Author name + avatar
- Read time (auto-calculated or manual)
- Rich text content editor (markdown or WYSIWYG like TipTap)
- Excerpt (auto-generated from first paragraph or manual)
- SEO fields: slug, meta description
- Status: Save as Draft / Publish
- Featured toggle

---

### 3.7 Testimonial Manager (`/dashboard/content/testimonials`)

**List View:** Sortable cards showing review preview, author, rating, date.

**Editor:**
| Field | Type |
|-------|------|
| Author Name | Text |
| Author Avatar | Image upload |
| Rating | 1-5 star selector |
| Review Text | Textarea |
| Review Date | Date picker |
| Source | Dropdown (Google, Trustpilot, Custom) |
| Visible | Toggle |

---

### 3.8 FAQ Manager (`/dashboard/content/faq`)

**List View:** Grouped by category, drag-to-reorder within category.

**Editor:**
| Field | Type |
|-------|------|
| Question | Text input |
| Answer | Rich text / Markdown editor |
| Category | Dropdown |
| Show On | Multi-select: Home page / FAQ page / Both |
| Visible | Toggle |

---

### 3.9 Team Member Manager (`/dashboard/content/team`)

**Grid View:** Cards with photo, name, title. Drag to reorder.

**Editor:**
| Field | Type |
|-------|------|
| Full Name | Text |
| Job Title | Text |
| Bio | Textarea |
| Photo | Image upload |
| Visible | Toggle |

---

### 3.10 Job Listing Manager (`/dashboard/content/careers`)

**List View:**
| Column | Content |
|--------|---------|
| Title | Job title |
| Department | Clinical / Engineering / etc. |
| Location | City/remote |
| Type | Full-Time / Part-Time |
| Status | Active / Closed / Draft badge |
| Posted | Date |

**Editor:**
| Field | Type |
|-------|------|
| Title | Text |
| Department | Text |
| Location | Text |
| Type | Dropdown (Full-Time, Part-Time, Contract) |
| Salary Range | Text |
| Description | Rich text editor |
| Responsibilities | Repeater (bullet list) |
| Requirements | Repeater (bullet list) |
| Apply URL | URL input |
| Status | Dropdown (Draft, Active, Closed) |

---

### 3.11 Video Manager (`/dashboard/content/videos`)

**Grid View:** Video thumbnails with speaker info.

**Editor:**
| Field | Type |
|-------|------|
| Speaker Name | Text |
| Speaker Role | Text |
| Speaker Avatar | Image upload |
| Video File | Video upload or URL |
| Thumbnail | Image upload (auto-generated option) |
| Visible | Toggle |

---

### 3.12 Social Link Manager (`/dashboard/settings`)

Part of the settings area. Simple reorderable list.

| Field | Type |
|-------|------|
| Platform | Dropdown (Instagram, WhatsApp, TikTok, Facebook, Messenger, Twitter, LinkedIn, YouTube) |
| URL | URL input |
| Custom Icon | Image upload (optional; defaults to platform icon) |
| Visible | Toggle |

---

### 3.13 Form Submissions Inbox (`/dashboard/forms/submissions`)

This is where tenants see all completed forms from their site visitors.

**Inbox View:**
```
┌────────────────────────────────────────────────────────────────────┐
│ Form Submissions                    [Export CSV] [Filter ▼]       │
├────────────────────────────────────────────────────────────────────┤
│ Filter: [All Forms ▼]  [All Status ▼]  [Date Range]  [Search]   │
├──────┬───────────────┬──────────────┬────────┬─────────┬─────────┤
│ #    │ Name          │ Form         │ Source │ Status  │ Date    │
├──────┼───────────────┼──────────────┼────────┼─────────┼─────────┤
│ 142  │ John Smith    │ Patient Int. │ Shop   │ ● New   │ 15 Mar │
│ 141  │ Maria Garcia  │ Patient Int. │ Home   │ ● New   │ 15 Mar │
│ 140  │ Alex Brown    │ Contact      │ Footer │ ● Done  │ 14 Mar │
│ 139  │ Priya Patel   │ Patient Int. │ Semagl │ ◉ Review│ 14 Mar │
│ ...  │               │              │        │         │         │
└──────┴───────────────┴──────────────┴────────┴─────────┴─────────┘
```

**Single Submission View:**
```
┌──────────────────────────────────────────────────────────────────┐
│ Submission #142                          Status: [New ▼]        │
│ Form: Patient Intake   |   Date: 15 Mar 2026   |   Source: Shop │
│ Product: Semaglutide   |   Payment: ● Completed                 │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│ Step 1: Patient Details                                         │
│ ─────────────────────────                                       │
│ Full Name:     John Smith                                        │
│ Date of Birth: 1988-05-12                                        │
│ Email:         john@example.com                                  │
│ Phone:         (555) 123-4567                                    │
│ State:         California                                        │
│ City:          Los Angeles                                       │
│                                                                  │
│ Step 2: Goals & Metrics                                         │
│ ─────────────────────────                                       │
│ Goal:          Weight Loss                                       │
│ Height:        5'10"                                             │
│ Weight:        210 lbs                                           │
│                                                                  │
│ ... (all steps displayed) ...                                   │
│                                                                  │
│ Internal Notes:                                                  │
│ ┌──────────────────────────────────────────────────────────────┐ │
│ │ Add notes about this submission...                           │ │
│ └──────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ [Approve] [Reject] [Print] [Delete]                             │
└──────────────────────────────────────────────────────────────────┘
```

**Submission Status Flow:**
```
New → In Review → Approved → Completed
                 └→ Rejected
```

---

### 3.14 Media Library (`/dashboard/media`)

Centralized asset manager.

```
┌─────────────────────────────────────────────────────────────────┐
│ Media Library          [Upload Files]  [Create Folder]         │
├───────────┬─────────────────────────────────────────────────────┤
│ Folders   │  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐        │
│ ─────     │  │     │ │     │ │     │ │     │ │     │        │
│ > All     │  │ img │ │ img │ │ img │ │ img │ │ img │        │
│   Logos   │  │     │ │     │ │     │ │     │ │     │        │
│   Products│  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘        │
│   Blog    │  logo.svg  hero.p  prod1  prod2  team1           │
│   Team    │                                                    │
│   General │  ┌─────┐ ┌─────┐ ┌─────┐                         │
│           │  │     │ │     │ │ ▶   │                         │
│           │  │ img │ │ img │ │ vid │                         │
│           │  │     │ │     │ │     │                         │
│           │  └─────┘ └─────┘ └─────┘                         │
│           │  team2   bg.png  intro.mp4                        │
└───────────┴─────────────────────────────────────────────────────┘
```

**Features:**
- Drag-and-drop upload
- Image preview + metadata (dimensions, size, upload date)
- Alt text editing
- Folder organization
- Search/filter by name, type
- Click to copy URL
- Inline image picker for all content editors (products, blog, team, etc.)

---

### 3.15 Settings (`/dashboard/settings`)

**Subsections:**

| Section | What It Controls |
|---------|-----------------|
| **Branding** | Company name, tagline, logo, favicon, brand colors (6 color pickers) |
| **Contact** | Email, phone, address, business hours |
| **SEO** | Meta title, meta description, OG image (per site, per page) |
| **Users** | Invite/remove dashboard users, change roles |
| **Payment** | BarterPay merchant ID, API key, default payment amount |
| **Legal** | Terms & Conditions editor (rich text), Privacy Policy editor (rich text) |
| **Domain** | Custom domain setup instructions + DNS verification |

---

### 3.16 Live Preview (`/dashboard/preview`)

Full iframe preview of the tenant's live site. Useful after making changes.

```
┌──────────────────────────────────────────────────────────────────┐
│ Preview                [Desktop] [Tablet] [Mobile]  [Open Live] │
├──────────────────────────────────────────────────────────────────┤
│ Page: [Home ▼]                                                   │
│                                                                  │
│ ┌──────────────────────────────────────────────────────────────┐ │
│ │                                                              │ │
│ │              Full rendered site in iframe                    │ │
│ │              at current tenant's subdomain                   │ │
│ │                                                              │ │
│ │              (width adjusts per device toggle)               │ │
│ │                                                              │ │
│ └──────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

---

## 4. Dashboard Tech Stack

| Library | Purpose |
|---------|---------|
| **React 19** | UI framework |
| **Vite** | Build tool |
| **React Router v7** | Client-side routing |
| **TailwindCSS** | Utility-first styling |
| **TanStack Query** | API data fetching, caching, mutations |
| **React Hook Form** | Form state management |
| **Zod** | Form validation (shared schemas with API) |
| **TipTap** | Rich text editor (blog posts, legal pages) |
| **dnd-kit** | Drag-and-drop for reordering |
| **Recharts** | Charts on overview page |
| **Sonner** | Toast notifications |
| **Lucide** | Icon library |
| **date-fns** | Date formatting |

---

## 5. Dashboard Component Library

Reusable components built once, used across all dashboard pages:

| Component | Usage |
|-----------|-------|
| `DataTable` | Products, blog, submissions, careers lists |
| `ContentCard` | Team, testimonials, FAQ grid items |
| `SectionEditor` | Page section editing forms |
| `ImagePicker` | Opens media library modal; returns selected URL |
| `RichTextEditor` | TipTap wrapper for blog/legal content |
| `Repeater` | Add/remove/reorder list items (stats, features, etc.) |
| `ColorPicker` | Hex color input with preview swatch |
| `StatusBadge` | Colored status indicators |
| `ConfirmDialog` | Delete/destructive action confirmation |
| `EmptyState` | "No products yet" placeholder with CTA |
| `FileUploader` | Drag-drop file upload zone |
| `PageHeader` | Consistent header with title + actions |
| `Sidebar` | Collapsible navigation sidebar |
| `Breadcrumb` | Route-based breadcrumb trail |
