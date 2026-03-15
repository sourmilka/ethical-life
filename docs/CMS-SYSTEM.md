# CMS System

> **Last updated:** 2026-03-15

## 1. Overview

The CMS (Content Management System) is the core of the dashboard. It lets tenants create, edit, and organize all dynamic content on their website — products, blog posts, testimonials, FAQs, team members, job listings, and videos — without touching any code.

Every CMS entity follows the same pattern:

```
Dashboard Editor → API Endpoint → Database Table → Template Rendering
```

---

## 2. Content Types

### 2.1 Products

**Purpose:** Product catalog displayed on the Shop page, Product detail pages, and Homepage carousel.

**Where It Appears on the Site:**
| Page | Component | Display Logic |
|------|-----------|---------------|
| Home | `carousel.html` | Products where `is_featured = true`, ordered by `sort_order` |
| Shop | `shop-grid.html` | All products where `is_active = true`, filterable by category |
| Product Detail | `product.html` | Single product loaded by `slug` URL param |
| Forms | `forms.html` | Product name shown if `?product=` URL param present |

**CRUD Operations:**

| Action | Dashboard UI | API Call | Database |
|--------|-------------|----------|----------|
| **Create** | "Add Product" button on product list → editor form | `POST /api/products` | Insert into `products` |
| **Read** | Product list (table view) + individual editor | `GET /api/products` / `GET /api/products/:id` | Select from `products` |
| **Update** | Edit any field in editor form → Save | `PATCH /api/products/:id` | Update `products` row |
| **Delete** | Delete button with confirmation dialog | `DELETE /api/products/:id` | Delete from `products` |
| **Reorder** | Drag-and-drop in list view | `PATCH /api/products/reorder` | Update `sort_order` |
| **Toggle** | Active/Featured switches in list view | `PATCH /api/products/:id` | Update `is_active` / `is_featured` |

**Product Categories:**
- Managed separately: "Weight Loss", "Wellness", "Supplements", custom categories
- Used as filter buttons on the shop page
- Each product belongs to one category (optional)

**Image Handling:**
- Main product image uploaded via Media Library
- Stored in `media_assets` with `folder = 'products'`
- URL stored in `products.image_url`
- Displayed on shop cards, product detail page, carousel cards

---

### 2.2 Blog Posts

**Purpose:** Content marketing blog displayed on the Blog page. Supports featured posts, categories, and full article reading.

**Where It Appears on the Site:**
| Page | Component | Display Logic |
|------|-----------|---------------|
| Blog | `blog-content.html` | Published posts, newest first. Top post = `is_featured = true` |
| Blog Detail | (future) `blog-post.html` | Single post by slug |

**Content Editor:**
Blog posts use a **rich text editor** (TipTap) that supports:
- Headings (H2, H3, H4)
- Bold, Italic, Underline, Strikethrough
- Ordered and unordered lists
- Links
- Images (inserted from Media Library)
- Block quotes
- Code blocks
- Horizontal rules

**Post Statuses:**
```
          ┌──────────┐
          │  Draft    │ ← Created but not published
          └────┬─────┘
               │ Publish
               ▼
          ┌──────────┐
          │ Published │ ← Visible on site
          └────┬─────┘
               │ Archive
               ▼
          ┌──────────┐
          │ Archived  │ ← Hidden from site, preserved in DB
          └──────────┘
```

**Auto-Generated Fields:**
- `slug`: Generated from title (e.g., "5 Myths About Weight Loss" -> "5-myths-about-weight-loss")
- `read_time`: Calculated from content word count (~200 words/min)
- `excerpt`: First 160 characters of content (unless manually set)

**Blog Categories:**
- Managed per tenant: "Weight Loss", "Wellness", "Telehealth", "Nutrition", etc.
- Category badge shown on blog cards
- Future: filter by category on blog page

---

### 2.3 Testimonials

**Purpose:** Customer reviews displayed on the Homepage (stories section) and potentially on product pages.

**Where It Appears on the Site:**
| Page | Component | Display Logic |
|------|-----------|---------------|
| Home | `stories.html` | Testimonials where `is_visible = true`, ordered by `sort_order` |

**Fields:**
- Author name, avatar, rating (1-5 stars), review text, date, source (Google/Trustpilot/etc.)
- All managed through a simple card editor
- Drag-to-reorder sets display order

**Source Badge:**
When source is "Google", shows Google badge. When "Trustpilot", shows Trustpilot badge. Otherwise plain text.

---

### 2.4 FAQs

**Purpose:** FAQ items shown on the Homepage (collapsed accordion on homepage) and the dedicated FAQ page (grouped by category).

**Where It Appears on the Site:**
| Page | Component | Display Logic |
|------|-----------|---------------|
| Home | `faq.html` partial | FAQ items where `page_location IN ('home', 'both')`, limit 5 |
| FAQ Page | `faq-page-content.html` | All visible FAQ items, grouped by category |

**Special Feature: Dual Location**
Each FAQ item can appear on:
- Homepage only
- FAQ page only
- Both

This is controlled by the `page_location` field.

**FAQ Categories:**
- Group FAQs into sections: "General", "Treatment", "Orders & Shipping", custom
- Displayed as separate accordion groups on the FAQ page
- Each FAQ belongs to one category

---

### 2.5 Team Members

**Purpose:** Team profiles displayed on the About page.

**Where It Appears on the Site:**
| Page | Component | Display Logic |
|------|-----------|---------------|
| About | `about-content.html` | Visible team members, ordered by `sort_order` |

**Fields:**
- Full name, job title, bio, photo
- Drag-to-reorder sets display order
- Toggle visibility per member

---

### 2.6 Job Listings

**Purpose:** Career opportunities displayed on the Careers page.

**Where It Appears on the Site:**
| Page | Component | Display Logic |
|------|-----------|---------------|
| Careers | `careers-content.html` | Active jobs, ordered by `posted_at` desc |

**Job Statuses:**
- **Draft**: Not visible on site
- **Active**: Visible and accepting applications
- **Closed**: Hidden from site, preserved in DB

**Apply Flow:**
Each job can have an `apply_url` (external link) or link to a form created in the Form Builder.

---

### 2.7 Videos

**Purpose:** Video testimonials and content displayed on the Homepage video grid.

**Where It Appears on the Site:**
| Page | Component | Display Logic |
|------|-----------|---------------|
| Home | `video-section.html` | Visible videos, ordered by `sort_order` |

**Fields:**
- Speaker name, role, avatar image
- Video file (uploaded to S3/R2) or external URL
- Auto-generated thumbnail (or manual upload)
- Drag-to-reorder

---

## 3. Content Rendering Pipeline

When a visitor loads a page, this is how CMS content becomes HTML:

```
1. Request hits Express:  GET ethicallife.barterpay.com/pages/shop.html

2. Tenant Resolution:
   - Extract "ethicallife" from subdomain
   - Lookup tenant in DB (cached in Redis)

3. Page Data Fetch:
   - Get page record for slug "shop"
   - Get all page_sections for this page
   - Get active products with categories
   - All queries scoped by tenant_id

4. Template Rendering:
   - Load EJS template: templates/healthcare-pro/pages/shop.ejs
   - Pass data: { tenant, settings, products, categories, navigation }
   - EJS renders HTML with real data

5. Response:
   - Send rendered HTML
   - Cache rendered page in Redis (2 min TTL)
   - Invalidate cache on any relevant content update
```

---

## 4. Content Validation Rules

| Content Type | Field | Validation |
|-------------|-------|------------|
| Product | title | Required, 1-255 chars |
| Product | slug | Required, lowercase alphanumeric + hyphens, unique per tenant |
| Product | price_amount | Positive number |
| Product | features | Array of strings, max 20 items |
| Blog Post | title | Required, 1-500 chars |
| Blog Post | content | Required for publishing (drafts can be empty) |
| Blog Post | cover_image_url | Valid URL |
| Testimonial | author_name | Required, 1-255 chars |
| Testimonial | rating | Integer 1-5 |
| Testimonial | review_text | Required, 1-2000 chars |
| FAQ | question | Required, 1-500 chars |
| FAQ | answer | Required |
| Team Member | full_name | Required, 1-255 chars |
| Team Member | photo_url | Valid URL |
| Job Listing | title | Required, 1-255 chars |
| Job Listing | responsibilities | Array of strings |
| Job Listing | requirements | Array of strings |
| Video | video_url | Required, valid URL |
| Video | speaker_name | Required, 1-255 chars |

---

## 5. Content Limits (by plan)

| Feature | Starter | Professional | Enterprise |
|---------|---------|-------------|------------|
| Products | 10 | 50 | Unlimited |
| Blog Posts | 20 | 100 | Unlimited |
| Testimonials | 10 | 50 | Unlimited |
| FAQ Items | 20 | 100 | Unlimited |
| Team Members | 5 | 20 | Unlimited |
| Job Listings | 5 | 20 | Unlimited |
| Videos | 5 | 20 | Unlimited |
| Media Storage | 500 MB | 5 GB | 50 GB |
| Forms | 3 | 10 | Unlimited |
| Submissions/mo | 100 | 1,000 | Unlimited |
| Custom Domain | No | Yes | Yes |
| Dashboard Users | 2 | 5 | Unlimited |

---

## 6. Optimistic Updates

All CMS operations use optimistic updates in the dashboard for instant feedback:

```
1. User clicks "Save" on product editor
2. TanStack Query immediately updates local cache with new data
3. UI reflects change instantly (product title updates in list)
4. API call fires in background: PATCH /api/products/:id
5a. On success: cache is confirmed, toast "Product updated"
5b. On error: cache rolls back to previous state, toast "Failed to update"
```

This pattern applies to all CRUD operations, reordering, and status toggles.

---

## 7. Search and Filtering

Each content list supports:

| Feature | Implementation |
|---------|---------------|
| **Text Search** | Server-side `WHERE title ILIKE '%query%'` |
| **Category Filter** | Dropdown → `WHERE category_id = ?` |
| **Status Filter** | Dropdown → `WHERE status = ?` |
| **Date Range** | Date pickers → `WHERE created_at BETWEEN ? AND ?` |
| **Sorting** | Column header click → `ORDER BY column ASC/DESC` |
| **Pagination** | 20 items per page, cursor-based pagination |
