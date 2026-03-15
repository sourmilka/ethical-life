# API Architecture

> **Last updated:** 2026-03-15
> **Runtime:** Node.js 20+ LTS
> **Framework:** Express.js
> **ORM:** Prisma
> **Auth:** JWT (access + refresh tokens)

## 1. Project Structure

```
server/
├── package.json
├── tsconfig.json
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts                       # seed default template + demo tenant
│   └── migrations/
├── src/
│   ├── index.ts                      # entry point: server bootstrap
│   ├── app.ts                        # express app setup, middleware
│   ├── config/
│   │   ├── env.ts                    # environment variable validation (Zod)
│   │   ├── database.ts               # Prisma client singleton
│   │   └── redis.ts                  # Redis client
│   ├── middleware/
│   │   ├── auth.ts                   # JWT verification + user injection
│   │   ├── tenantResolver.ts         # resolve tenant from subdomain/domain
│   │   ├── requireRole.ts            # role-based access control
│   │   ├── rateLimiter.ts            # Redis-backed rate limiting
│   │   ├── validate.ts               # Zod request validation
│   │   ├── upload.ts                 # multer config for file uploads
│   │   ├── errorHandler.ts           # global error handler
│   │   └── auditLog.ts              # automatic audit logging
│   ├── routes/
│   │   ├── index.ts                  # route aggregator
│   │   │
│   │   ├── auth/                     # Authentication
│   │   │   ├── auth.routes.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   └── auth.schema.ts        # Zod validation schemas
│   │   │
│   │   ├── tenants/                  # Tenant management
│   │   │   ├── tenants.routes.ts
│   │   │   ├── tenants.controller.ts
│   │   │   ├── tenants.service.ts
│   │   │   └── tenants.schema.ts
│   │   │
│   │   ├── site-settings/            # Branding, colors, contact info
│   │   │   ├── settings.routes.ts
│   │   │   ├── settings.controller.ts
│   │   │   ├── settings.service.ts
│   │   │   └── settings.schema.ts
│   │   │
│   │   ├── pages/                    # Page sections content
│   │   │   ├── pages.routes.ts
│   │   │   ├── pages.controller.ts
│   │   │   ├── pages.service.ts
│   │   │   └── pages.schema.ts
│   │   │
│   │   ├── navigation/              # Navbar, sidebar, footer links
│   │   │   ├── navigation.routes.ts
│   │   │   ├── navigation.controller.ts
│   │   │   ├── navigation.service.ts
│   │   │   └── navigation.schema.ts
│   │   │
│   │   ├── products/                 # Product catalog
│   │   │   ├── products.routes.ts
│   │   │   ├── products.controller.ts
│   │   │   ├── products.service.ts
│   │   │   └── products.schema.ts
│   │   │
│   │   ├── blog/                     # Blog posts
│   │   │   ├── blog.routes.ts
│   │   │   ├── blog.controller.ts
│   │   │   ├── blog.service.ts
│   │   │   └── blog.schema.ts
│   │   │
│   │   ├── testimonials/             # Customer reviews
│   │   │   ├── testimonials.routes.ts
│   │   │   ├── testimonials.controller.ts
│   │   │   ├── testimonials.service.ts
│   │   │   └── testimonials.schema.ts
│   │   │
│   │   ├── faq/                      # FAQ management
│   │   │   ├── faq.routes.ts
│   │   │   ├── faq.controller.ts
│   │   │   ├── faq.service.ts
│   │   │   └── faq.schema.ts
│   │   │
│   │   ├── team/                     # Team members
│   │   │   ├── team.routes.ts
│   │   │   ├── team.controller.ts
│   │   │   ├── team.service.ts
│   │   │   └── team.schema.ts
│   │   │
│   │   ├── careers/                  # Job listings
│   │   │   ├── careers.routes.ts
│   │   │   ├── careers.controller.ts
│   │   │   ├── careers.service.ts
│   │   │   └── careers.schema.ts
│   │   │
│   │   ├── videos/                   # Video content
│   │   │   ├── videos.routes.ts
│   │   │   ├── videos.controller.ts
│   │   │   ├── videos.service.ts
│   │   │   └── videos.schema.ts
│   │   │
│   │   ├── forms/                    # Form builder + submissions
│   │   │   ├── forms.routes.ts
│   │   │   ├── forms.controller.ts
│   │   │   ├── forms.service.ts
│   │   │   └── forms.schema.ts
│   │   │
│   │   ├── media/                    # File uploads
│   │   │   ├── media.routes.ts
│   │   │   ├── media.controller.ts
│   │   │   ├── media.service.ts
│   │   │   └── media.schema.ts
│   │   │
│   │   ├── social/                   # Social links
│   │   │   ├── social.routes.ts
│   │   │   ├── social.controller.ts
│   │   │   ├── social.service.ts
│   │   │   └── social.schema.ts
│   │   │
│   │   └── public/                   # Public API (no auth, for site rendering)
│   │       ├── public.routes.ts
│   │       ├── public.controller.ts
│   │       └── public.service.ts
│   │
│   ├── services/
│   │   ├── barterpay.ts              # BarterPay payment API integration
│   │   ├── email.ts                  # transactional email (submission notifications)
│   │   ├── storage.ts                # S3/R2 file operations
│   │   └── cache.ts                  # Redis caching layer
│   │
│   └── utils/
│       ├── slugify.ts                # URL-safe slug generation
│       ├── pagination.ts             # cursor/offset pagination helper
│       ├── errors.ts                 # custom error classes
│       └── crypto.ts                 # encryption/hashing helpers
│
└── tests/
    ├── setup.ts
    ├── auth.test.ts
    ├── products.test.ts
    └── ...
```

---

## 2. Authentication Flow

### Login
```
POST /api/auth/login
Body: { email, password }
Response: { accessToken, refreshToken, user: { id, email, fullName, role, tenant } }

- Validate credentials against bcrypt hash
- Generate JWT access token (15min expiry)
- Generate refresh token (7 day expiry), store in sessions table
- Set refreshToken in httpOnly cookie
```

### Token Refresh
```
POST /api/auth/refresh
Cookie: refreshToken
Response: { accessToken }

- Validate refresh token from httpOnly cookie
- Check session exists and not expired
- Issue new access token
- Rotate refresh token (invalidate old, issue new)
```

### Protected Request Flow
```
Client Request
     │
     ▼
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│ Rate Limiter │───>│ Auth Middle  │───>│ Role Check  │
│ (Redis)      │    │ (JWT verify) │    │ (RBAC)      │
└─────────────┘    └──────────────┘    └──────┬──────┘
                                              │
                                              ▼
                                       ┌─────────────┐
                                       │ Controller  │
                                       └─────────────┘
```

---

## 3. API Endpoints

### Authentication (`/api/auth`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | None | Register new tenant + owner account |
| POST | `/api/auth/login` | None | Login, get tokens |
| POST | `/api/auth/refresh` | Cookie | Refresh access token |
| POST | `/api/auth/logout` | Token | Invalidate session |
| POST | `/api/auth/forgot-password` | None | Send password reset email |
| POST | `/api/auth/reset-password` | Token (reset) | Set new password |
| GET | `/api/auth/me` | Token | Get current user profile |
| PATCH | `/api/auth/me` | Token | Update own profile |
| PATCH | `/api/auth/change-password` | Token | Change password |

### Site Settings (`/api/settings`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/settings` | Token | Get tenant site settings |
| PATCH | `/api/settings` | Token (admin+) | Update site settings |
| PATCH | `/api/settings/branding` | Token (admin+) | Update logo, favicon, colors |
| PATCH | `/api/settings/contact` | Token (admin+) | Update contact info |
| PATCH | `/api/settings/seo` | Token (admin+) | Update meta title, description, OG image |
| PATCH | `/api/settings/promo` | Token (admin+) | Update promo banner |
| PATCH | `/api/settings/legal/terms` | Token (admin+) | Update terms & conditions |
| PATCH | `/api/settings/legal/privacy` | Token (admin+) | Update privacy policy |

### Pages & Sections (`/api/pages`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/pages` | Token | List all pages |
| GET | `/api/pages/:slug` | Token | Get page with all sections |
| GET | `/api/pages/:slug/sections` | Token | List sections for a page |
| GET | `/api/pages/:slug/sections/:sectionKey` | Token | Get specific section |
| PATCH | `/api/pages/:slug/sections/:sectionKey` | Token (editor+) | Update section content |
| PATCH | `/api/pages/:slug/meta` | Token (admin+) | Update page title/description |
| PATCH | `/api/pages/:slug/visibility` | Token (admin+) | Toggle page active/inactive |

### Navigation (`/api/navigation`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/navigation` | Token | Get all nav items (grouped by location) |
| GET | `/api/navigation/:location` | Token | Get nav items for location |
| POST | `/api/navigation` | Token (admin+) | Create nav item |
| PATCH | `/api/navigation/:id` | Token (admin+) | Update nav item |
| DELETE | `/api/navigation/:id` | Token (admin+) | Delete nav item |
| PATCH | `/api/navigation/reorder` | Token (admin+) | Reorder nav items |

### Products (`/api/products`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/products` | Token | List products (filterable by category, status) |
| GET | `/api/products/:id` | Token | Get single product |
| POST | `/api/products` | Token (editor+) | Create product |
| PATCH | `/api/products/:id` | Token (editor+) | Update product |
| DELETE | `/api/products/:id` | Token (admin+) | Delete product |
| PATCH | `/api/products/reorder` | Token (editor+) | Reorder products |
| GET | `/api/products/categories` | Token | List product categories |
| POST | `/api/products/categories` | Token (admin+) | Create category |
| PATCH | `/api/products/categories/:id` | Token (admin+) | Update category |
| DELETE | `/api/products/categories/:id` | Token (admin+) | Delete category |

### Blog Posts (`/api/blog`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/blog` | Token | List posts (filterable by status, category) |
| GET | `/api/blog/:id` | Token | Get single post |
| POST | `/api/blog` | Token (editor+) | Create post |
| PATCH | `/api/blog/:id` | Token (editor+) | Update post |
| DELETE | `/api/blog/:id` | Token (admin+) | Delete post |
| PATCH | `/api/blog/:id/publish` | Token (editor+) | Publish draft |
| PATCH | `/api/blog/:id/unpublish` | Token (editor+) | Unpublish post |
| GET | `/api/blog/categories` | Token | List blog categories |
| POST | `/api/blog/categories` | Token (admin+) | Create category |
| PATCH | `/api/blog/categories/:id` | Token (admin+) | Update category |
| DELETE | `/api/blog/categories/:id` | Token (admin+) | Delete category |

### Testimonials (`/api/testimonials`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/testimonials` | Token | List all testimonials |
| GET | `/api/testimonials/:id` | Token | Get single testimonial |
| POST | `/api/testimonials` | Token (editor+) | Create testimonial |
| PATCH | `/api/testimonials/:id` | Token (editor+) | Update testimonial |
| DELETE | `/api/testimonials/:id` | Token (admin+) | Delete testimonial |
| PATCH | `/api/testimonials/reorder` | Token (editor+) | Reorder testimonials |

### FAQ (`/api/faq`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/faq` | Token | List FAQ items (filterable by category, page) |
| GET | `/api/faq/:id` | Token | Get single FAQ |
| POST | `/api/faq` | Token (editor+) | Create FAQ |
| PATCH | `/api/faq/:id` | Token (editor+) | Update FAQ |
| DELETE | `/api/faq/:id` | Token (admin+) | Delete FAQ |
| PATCH | `/api/faq/reorder` | Token (editor+) | Reorder FAQs |
| GET | `/api/faq/categories` | Token | List FAQ categories |
| POST | `/api/faq/categories` | Token (admin+) | Create category |
| PATCH | `/api/faq/categories/:id` | Token (admin+) | Update category |
| DELETE | `/api/faq/categories/:id` | Token (admin+) | Delete category |

### Team Members (`/api/team`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/team` | Token | List team members |
| GET | `/api/team/:id` | Token | Get single member |
| POST | `/api/team` | Token (admin+) | Create member |
| PATCH | `/api/team/:id` | Token (admin+) | Update member |
| DELETE | `/api/team/:id` | Token (admin+) | Delete member |
| PATCH | `/api/team/reorder` | Token (admin+) | Reorder members |

### Job Listings (`/api/careers`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/careers` | Token | List jobs (filterable by status) |
| GET | `/api/careers/:id` | Token | Get single job |
| POST | `/api/careers` | Token (admin+) | Create job listing |
| PATCH | `/api/careers/:id` | Token (admin+) | Update job listing |
| DELETE | `/api/careers/:id` | Token (admin+) | Delete job listing |

### Videos (`/api/videos`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/videos` | Token | List videos |
| GET | `/api/videos/:id` | Token | Get single video |
| POST | `/api/videos` | Token (editor+) | Create video entry |
| PATCH | `/api/videos/:id` | Token (editor+) | Update video |
| DELETE | `/api/videos/:id` | Token (admin+) | Delete video |
| PATCH | `/api/videos/reorder` | Token (editor+) | Reorder videos |

### Forms (`/api/forms`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/forms` | Token | List form definitions |
| GET | `/api/forms/:id` | Token | Get form with all fields |
| POST | `/api/forms` | Token (admin+) | Create form definition |
| PATCH | `/api/forms/:id` | Token (admin+) | Update form definition |
| DELETE | `/api/forms/:id` | Token (admin+) | Delete form (soft) |
| POST | `/api/forms/:id/fields` | Token (admin+) | Add field to form |
| PATCH | `/api/forms/:id/fields/:fieldId` | Token (admin+) | Update field |
| DELETE | `/api/forms/:id/fields/:fieldId` | Token (admin+) | Remove field |
| PATCH | `/api/forms/:id/fields/reorder` | Token (admin+) | Reorder fields |
| POST | `/api/forms/:id/duplicate` | Token (admin+) | Duplicate form |

### Form Submissions (`/api/submissions`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/submissions` | Token | List submissions (filterable by form, status, date) |
| GET | `/api/submissions/:id` | Token | Get submission with all data |
| PATCH | `/api/submissions/:id/status` | Token (admin+) | Update status (approve/reject) |
| PATCH | `/api/submissions/:id/notes` | Token (editor+) | Add internal notes |
| DELETE | `/api/submissions/:id` | Token (admin+) | Delete submission |
| GET | `/api/submissions/stats` | Token | Submission counts, trends |
| GET | `/api/submissions/export` | Token (admin+) | Export as CSV |

### Media Library (`/api/media`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/media` | Token | List media (filterable by folder, type) |
| POST | `/api/media/upload` | Token (editor+) | Upload file(s) |
| PATCH | `/api/media/:id` | Token (editor+) | Update alt text, folder |
| DELETE | `/api/media/:id` | Token (admin+) | Delete file |
| POST | `/api/media/folder` | Token (editor+) | Create folder |

### Social Links (`/api/social`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/social` | Token | List social links |
| POST | `/api/social` | Token (admin+) | Add social link |
| PATCH | `/api/social/:id` | Token (admin+) | Update social link |
| DELETE | `/api/social/:id` | Token (admin+) | Delete social link |
| PATCH | `/api/social/reorder` | Token (admin+) | Reorder social links |

### Users / Team Management (`/api/users`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/users` | Token (owner) | List tenant users |
| POST | `/api/users/invite` | Token (owner) | Invite user (sends email) |
| PATCH | `/api/users/:id/role` | Token (owner) | Change user role |
| DELETE | `/api/users/:id` | Token (owner) | Remove user from tenant |

### Payment / BarterPay (`/api/barterpay`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/barterpay/create-transaction` | None* | Create payment (from public form) |
| POST | `/api/barterpay/check-status` | None* | Poll payment status |
| GET | `/api/barterpay/config` | Token (owner) | Get BarterPay settings |
| PATCH | `/api/barterpay/config` | Token (owner) | Update BarterPay credentials |

*These use tenant resolution from subdomain, not JWT auth

### Public API (`/api/public`)
Unauthenticated endpoints used by the public-facing website renderer.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/public/site` | Tenant* | Full site data bundle for rendering |
| GET | `/api/public/page/:slug` | Tenant* | Page data with sections |
| GET | `/api/public/products` | Tenant* | Active products |
| GET | `/api/public/products/:slug` | Tenant* | Single product |
| GET | `/api/public/blog` | Tenant* | Published blog posts |
| GET | `/api/public/blog/:slug` | Tenant* | Single blog post |
| GET | `/api/public/testimonials` | Tenant* | Visible testimonials |
| GET | `/api/public/faq` | Tenant* | Visible FAQ items |
| GET | `/api/public/team` | Tenant* | Visible team members |
| GET | `/api/public/careers` | Tenant* | Active job listings |
| GET | `/api/public/videos` | Tenant* | Visible videos |
| POST | `/api/public/forms/:slug/submit` | Tenant* | Submit form (public) |
| POST | `/api/public/newsletter` | Tenant* | Email newsletter signup |
| POST | `/api/public/contact` | Tenant* | Contact form submission |

*Tenant resolved from subdomain/domain, not JWT

---

## 4. Middleware Pipeline

```
Every request passes through:

1. CORS                     - Allow dashboard origin + tenant domains
2. Helmet                   - Security headers (CSP, HSTS, X-Frame)
3. Rate Limiter             - Redis-backed, per IP + per tenant
4. Body Parser              - JSON (10MB limit) + URL-encoded
5. Cookie Parser            - For httpOnly refresh token
6. Request Logger           - Morgan/Pino structured logging
     │
     ├── /api/public/*      - Tenant Resolver (subdomain) → Controller
     │
     └── /api/*             - Auth Middleware (JWT) → Role Check → Audit Log → Controller
```

### Tenant Resolution Middleware
```typescript
// Runs on every public request
// 1. Read hostname: "ethicallife.barterpay.com" → slug = "ethicallife"
// 2. Check custom_domain: "www.ethicallife.co.uk" → lookup tenant by domain
// 3. Query tenant from DB (cached in Redis for 5 min)
// 4. Attach to req.tenant
// 5. 404 if tenant not found or suspended

async function tenantResolver(req, res, next) {
    const host = req.hostname;
    let tenant;

    // Check custom domain first
    tenant = await cache.get(`domain:${host}`) ||
             await db.tenant.findFirst({ where: { custom_domain: host, status: 'active' }});

    if (!tenant) {
        // Extract subdomain
        const slug = host.split('.')[0];
        tenant = await cache.get(`tenant:${slug}`) ||
                 await db.tenant.findFirst({ where: { slug, status: 'active' }});
    }

    if (!tenant) return res.status(404).json({ error: 'Site not found' });

    await cache.set(`tenant:${tenant.slug}`, tenant, 300); // cache 5min
    req.tenant = tenant;
    next();
}
```

---

## 5. Error Handling

### Standard Error Response
```json
{
    "error": {
        "code": "VALIDATION_ERROR",
        "message": "Email is required",
        "details": [
            { "field": "email", "message": "Required" }
        ]
    }
}
```

### Error Codes
| HTTP | Code | Description |
|------|------|-------------|
| 400 | `VALIDATION_ERROR` | Request body/params failed validation |
| 401 | `UNAUTHORIZED` | Missing or invalid token |
| 403 | `FORBIDDEN` | Insufficient role/permissions |
| 404 | `NOT_FOUND` | Resource doesn't exist |
| 409 | `CONFLICT` | Duplicate slug, email, etc. |
| 413 | `FILE_TOO_LARGE` | Upload exceeds size limit |
| 415 | `UNSUPPORTED_MEDIA_TYPE` | Invalid file type |
| 429 | `RATE_LIMITED` | Too many requests |
| 500 | `INTERNAL_ERROR` | Unexpected server error |

---

## 6. Caching Strategy

| Data | Cache Key | TTL | Invalidation |
|------|-----------|-----|-------------|
| Tenant lookup | `tenant:{slug}` | 5 min | On tenant update |
| Site settings | `settings:{tenantId}` | 5 min | On settings update |
| Public page data | `page:{tenantId}:{slug}` | 2 min | On section update |
| Product list | `products:{tenantId}` | 2 min | On product CRUD |
| Blog list | `blog:{tenantId}` | 2 min | On blog CRUD |
| Navigation | `nav:{tenantId}` | 5 min | On nav update |
| Full site bundle | `site:{tenantId}` | 1 min | On any content update |

All caches invalidated on relevant writes. Pattern: write to DB, then `cache.del(key)`.

---

## 7. File Upload Pipeline

```
Client uploads file
     │
     ▼
┌─────────────────────┐
│ Multer middleware    │  Max 10MB per file
│ - memoryStorage     │  Max 10 files per request
│ - fileFilter        │  Allowed: png, jpg, jpeg, gif, svg, webp, mp4, webm, pdf
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ Validation          │  Check mime type matches extension
│ - mime check        │  Check file isn't empty
│ - size check        │  Strip EXIF data from images
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ Storage service     │  Upload to S3/R2
│ - generate key      │  Key: {tenantId}/{folder}/{uuid}.{ext}
│ - upload to S3      │  Set public-read ACL
│ - get public URL    │  Return CDN URL
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ Save to DB          │  Create media_assets record
│ - filename, mime    │  Store dimensions for images
│ - url, size         │  Return asset object
└─────────────────────┘
```

---

## 8. Request Validation (Zod)

Every mutating endpoint validates the request body with Zod schemas before reaching the controller.

```typescript
// Example: Create Product validation
const createProductSchema = z.object({
    title: z.string().min(1).max(255),
    slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/),
    categoryId: z.string().uuid().optional(),
    tagline: z.string().max(500).optional(),
    description: z.string().optional(),
    priceText: z.string().max(100).optional(),
    priceAmount: z.number().positive().optional(),
    currency: z.enum(['GBP', 'USD', 'EUR']).default('GBP'),
    imageUrl: z.string().url().optional(),
    tag: z.string().max(50).optional(),
    features: z.array(z.string()).default([]),
    howItWorks: z.string().optional(),
    isActive: z.boolean().default(true),
    isFeatured: z.boolean().default(false),
});

// Middleware usage
router.post('/products', auth, requireRole('editor'), validate(createProductSchema), productsController.create);
```

---

## 9. Audit Logging

All dashboard write operations are automatically logged:

```typescript
// Audit middleware wraps controller response
async function auditLog(req, res, next) {
    const originalJson = res.json.bind(res);
    res.json = (body) => {
        if (req.method !== 'GET' && res.statusCode < 400) {
            db.auditLog.create({
                data: {
                    tenantId: req.user.tenantId,
                    userId: req.user.id,
                    action: `${req.baseUrl}.${req.method.toLowerCase()}`,
                    entityType: req.baseUrl.split('/').pop(),
                    entityId: body?.id || req.params.id,
                    changes: { body: req.body },
                    ipAddress: req.ip,
                    userAgent: req.headers['user-agent'],
                }
            });
        }
        return originalJson(body);
    };
    next();
}
```
