# Form Builder

> **Last updated:** 2026-03-15

## 1. Overview

The Form Builder is the most complex feature in the dashboard. It lets tenants:

1. **Create custom forms** with any combination of fields
2. **Customize the existing intake form** (add/remove fields, change labels)
3. **Attach forms** to specific pages, products, or standalone URLs
4. **View all submissions** in a unified inbox
5. **Track where each submission came from** (source + product)
6. **Optionally require payment** after form completion

The visual form layout (the multi-step card design) stays the same — tenants customize the fields and content inside, not the look.

---

## 2. Current Form System (What Exists)

Today, the intake form is fully hardcoded in `forms.js`:

```
Step 0: Patient Details     → 6 fields + 6 consent checkboxes
Step 1: Goals & Metrics     → 3 fields (1 conditional)
Step 2: Medical History     → 1 checkbox group (10 options + conditional)
Step 3: Surgeries & Allergy → 2 textareas
Step 4: Medications         → 2 textareas
Step 5: Safety Screening    → 5 checkboxes
Step 6: Notes               → 1 textarea
```

**Current flow:**
```
Site visitor clicks "Get Started"
  → Redirects to /pages/forms.html?source=hero&product=semaglutide
  → forms.js reads URL params (source, product)
  → User fills 7-step form
  → Data saved to localStorage with _id, _source, _product
  → Redirect to /pages/payment.html?intakeId=xxx
  → Payment processed via BarterPay
  → Redirect to /pages/thank-you.html
```

---

## 3. Target Form System (What We're Building)

### 3.1 Form Definitions

Each tenant can have multiple form definitions:

| Form Name | Type | Use Case |
|-----------|------|----------|
| Patient Intake | intake | Primary consultation form |
| Contact Form | contact | Contact page inquiries |
| Newsletter | newsletter | Email capture on guide section |
| Job Application | custom | Careers page applications |
| Quick Assessment | custom | Shortened form for specific products |

**Form Properties:**
```
Form Definition
├── name: "Patient Intake Form"
├── slug: "patient-intake"
├── type: "intake"
├── is_multi_step: true
├── submit_button_text: "Submit Consultation"
├── success_message: "Thank you! A clinician will review within 24-48 hours."
├── redirect_url: "/pages/payment.html"
├── requires_payment: true
├── payment_amount: 149.00
├── notification_emails: ["clinic@ethicallife.com", "admin@ethicallife.com"]
└── fields: [...]
```

### 3.2 Field Types

| Type | Renders As | Example |
|------|-----------|---------|
| `text` | `<input type="text">` | Full Name |
| `email` | `<input type="email">` | Email Address |
| `tel` | `<input type="tel">` | Phone Number |
| `number` | `<input type="number">` | Weight, Height |
| `date` | `<input type="date">` | Date of Birth |
| `select` | `<select>` | State, Goal |
| `textarea` | `<textarea>` | Medical Notes, Allergies |
| `checkbox` | Single `<input type="checkbox">` | Consent checkbox |
| `checkbox_group` | Multiple checkboxes | Medical conditions |
| `radio` | Radio button group | Yes/No questions |
| `heading` | `<h3>` (non-input) | Section subtitle within a step |
| `paragraph` | `<p>` (non-input) | Instructional text within a step |
| `divider` | `<hr>` (non-input) | Visual separator |

### 3.3 Field Properties

Every field has:

```json
{
    "field_key": "fullName",
    "field_type": "text",
    "label": "Full Name",
    "placeholder": "Enter your full name",
    "help_text": "As it appears on your photo ID",
    "step_number": 0,
    "step_title": "Patient Details",
    "sort_order": 0,
    "is_required": true,
    "validation_rules": {
        "minLength": 2,
        "maxLength": 100,
        "pattern": "^[a-zA-Z ]+$",
        "pattern_message": "Only letters and spaces allowed"
    },
    "options": [],
    "conditional_on": null,
    "default_value": null
}
```

### 3.4 Conditional Fields

Fields can be shown/hidden based on another field's value:

```json
{
    "field_key": "goalOther",
    "field_type": "text",
    "label": "Please describe your goal",
    "conditional_on": {
        "field_key": "goal",
        "operator": "equals",
        "value": "other"
    }
}
```

**Supported operators:**
| Operator | Logic |
|----------|-------|
| `equals` | Show when field === value |
| `not_equals` | Show when field !== value |
| `contains` | Show when field contains value (for checkbox groups) |
| `not_empty` | Show when field has any value |
| `is_empty` | Show when field is empty |

---

## 4. Form Builder UI

### 4.1 Builder Layout

```
┌──────────────────────────────────────────────────────────────────────┐
│ Form Builder: Patient Intake Form                    [Save] [Prevw] │
├──────────────────┬───────────────────────────────────────────────────┤
│ Form Settings    │  Step 1: Patient Details                [+ Step] │
│                  │  ─────────────────────────────────────────────── │
│ Name:            │                                                  │
│ [Patient Intake] │  ┌─────────────────────────────────────────────┐ │
│                  │  │ ≡ Full Name              [text]   [req] [✎]│ │
│ Multi-step: [✓]  │  │ ≡ Date of Birth          [date]   [req] [✎]│ │
│                  │  │ ≡ Email Address           [email]  [req] [✎]│ │
│ Requires Payment:│  │ ≡ Phone Number            [tel]    [req] [✎]│ │
│ [✓]              │  │ ≡ State                   [select] [req] [✎]│ │
│                  │  │ ≡ City                    [text]   [req] [✎]│ │
│ Amount:          │  │ ≡ ── Consent Section ──   [heading]     [✎]│ │
│ [149.00]         │  │ ≡ I agree to terms        [checkbox][req][✎]│ │
│                  │  │ ≡ I consent to treatment  [checkbox][req][✎]│ │
│ Submit Text:     │  │                                             │ │
│ [Submit Consult] │  │                           [+ Add Field]     │ │
│                  │  └─────────────────────────────────────────────┘ │
│ Success Message: │                                                  │
│ [Thank you!...]  │  Step 2: Goals & Metrics                         │
│                  │  ─────────────────────────────────────────────── │
│ Notify:          │  ┌─────────────────────────────────────────────┐ │
│ [clinic@...]     │  │ ≡ Goal                   [select] [req] [✎]│ │
│ [+ Add Email]    │  │ ≡ Goal (Other)           [text]   [?]  [✎]│ │
│                  │  │   └ if Goal = "other"                      │ │
│                  │  │ ≡ Height                  [number] [req] [✎]│ │
│                  │  │ ≡ Weight                  [number] [req] [✎]│ │
│                  │  │                           [+ Add Field]     │ │
│                  │  └─────────────────────────────────────────────┘ │
│                  │                                                  │
│                  │  Step 3: Medical History ...                     │
│                  │  Step 4: Surgeries & Allergies ...               │
│                  │  Step 5: Medications ...                         │
│                  │  Step 6: Safety Screening ...                    │
│                  │  Step 7: Notes ...                               │
└──────────────────┴───────────────────────────────────────────────────┘
```

### 4.2 Field Editor (opens when clicking ✎)

```
┌──────────────────────────────────────────────────────┐
│ Edit Field: Full Name                          [x]  │
├──────────────────────────────────────────────────────┤
│                                                      │
│ Field Key:        [fullName           ]  (unique ID) │
│ Label:            [Full Name          ]              │
│ Type:             [Text Input ▼       ]              │
│ Placeholder:      [Enter your full name]             │
│ Help Text:        [As it appears on your photo ID]   │
│                                                      │
│ Validation:                                          │
│   Required: [✓]                                      │
│   Min Length: [2  ]                                   │
│   Max Length: [100]                                   │
│   Pattern:   [^[a-zA-Z ]+$           ]               │
│   Error Msg: [Only letters and spaces]               │
│                                                      │
│ Conditional:                                         │
│   Show only when: [None ▼]                           │
│                                                      │
│ Default Value: [                     ]               │
│                                                      │
│              [Save Field]  [Cancel]                  │
└──────────────────────────────────────────────────────┘
```

### 4.3 Select/Checkbox Options Editor

For `select`, `radio`, and `checkbox_group` fields, an options editor appears:

```
┌──────────────────────────────────────────────────────┐
│ Options:                                             │
│ ┌──────────────────────────────────────────────────┐ │
│ │ ≡  Value: [diabetes    ]  Label: [Diabetes    ]  │ │
│ │ ≡  Value: [thyroid     ]  Label: [Thyroid     ]  │ │
│ │ ≡  Value: [hypertension]  Label: [Hypertension]  │ │
│ │ ≡  Value: [sleepApnea  ]  Label: [Sleep Apnea]  │ │
│ │ ≡  Value: [other       ]  Label: [Other       ]  │ │
│ │                                   [+ Add Option]  │ │
│ └──────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘
```

---

## 5. Form Rendering (Public Site)

### 5.1 How the Form Loads

```
1. Visitor navigates to /pages/forms.html?product=semaglutide&source=shop

2. Client JS (forms.js) calls:
   GET /api/public/forms/patient-intake
   (or default intake form for the tenant)

3. API returns form definition + all fields:
   {
       name: "Patient Intake Form",
       isMultiStep: true,
       submitButtonText: "Submit Consultation",
       requiresPayment: true,
       steps: [
           {
               number: 0,
               title: "Patient Details",
               fields: [
                   { key: "fullName", type: "text", label: "Full Name", ... },
                   ...
               ]
           },
           ...
       ]
   }

4. forms.js dynamically generates the form HTML from this definition
   (instead of reading hardcoded HTML)

5. Validation runs client-side based on validation_rules from API

6. On submit:
   POST /api/public/forms/patient-intake/submit
   Body: { fields: { fullName: "John", ... }, source: "shop", productSlug: "semaglutide" }

7. API creates form_submission + form_submission_data records
8. If requires_payment: redirect to payment page
9. If no payment: show success message or redirect
```

### 5.2 Dynamic Form Rendering

The existing multi-step form UI is preserved. The JS changes from reading hardcoded HTML steps to generating steps from the API response:

```javascript
// BEFORE (hardcoded):
const steps = document.querySelectorAll('.form-step');

// AFTER (dynamic):
async function loadForm(formSlug) {
    const response = await fetch(`/api/public/forms/${formSlug}`);
    const formDef = await response.json();

    const container = document.querySelector('.form-steps-container');
    formDef.steps.forEach(step => {
        const stepEl = createStepElement(step);
        container.appendChild(stepEl);
    });
}

function createStepElement(step) {
    const div = document.createElement('div');
    div.className = 'form-step';
    div.innerHTML = `<h3 class="form-step-title">${sanitize(step.title)}</h3>`;

    step.fields.forEach(field => {
        div.appendChild(createFieldElement(field));
    });

    return div;
}

function createFieldElement(field) {
    // Returns appropriate input element based on field.type
    // Applies validation rules, placeholder, help text
    // Sets up conditional visibility listeners
}
```

### 5.3 Form Style Stays the Same

The design of the form never changes. What tenants can change:

| Can Change | Cannot Change |
|-----------|--------------|
| Field labels | Form card design (border, shadow, padding) |
| Field placeholder text | Step transition animation |
| Field types | Progress bar style |
| Step count and titles | Button styling (colors follow brand) |
| Validation rules | Input field design (border-radius, spacing) |
| Required/optional per field | Checkbox custom styling |
| Conditional logic | Navigation (back/next/submit) behavior |
| Help text | Overall form layout (left panel + right card) |
| Select/checkbox options | Left panel design |
| Success message | |
| Submit button text | |
| Post-submission redirect | |

**Color customization applies to the form via CSS variables:**
- Button colors follow `--color-accent`
- Border colors follow `--color-border`
- Background follows `--color-bg`
- These are set from `site_settings` colors

---

## 6. Form Submission Pipeline

```
┌───────────┐    ┌───────────────┐    ┌──────────────────────┐
│  Visitor   │───>│  Validate     │───>│  Store Submission    │
│  submits   │    │  (client JS)  │    │  in Database         │
└───────────┘    └───────────────┘    └──────────┬───────────┘
                                                  │
                  ┌───────────────┐               │
                  │  Send Email   │<──────────────┤
                  │  Notification │               │
                  └───────────────┘               │
                                                  │
                  ┌───────────────┐               │
                  │  Payment?     │<──────────────┘
                  │  Yes → Redir  │
                  │  No → Success │
                  └───────────────┘
```

### Server-Side Submission Handler

```typescript
async function submitForm(req, res) {
    const { slug } = req.params;
    const { fields, source, productSlug } = req.body;
    const tenantId = req.tenant.id;

    // 1. Load form definition
    const formDef = await db.formDefinition.findFirst({
        where: { tenantId, slug, status: 'active' },
        include: { fields: true }
    });
    if (!formDef) return res.status(404).json({ error: 'Form not found' });

    // 2. Server-side validation (never trust client)
    const errors = validateSubmission(formDef.fields, fields);
    if (errors.length) return res.status(400).json({ error: 'Validation failed', details: errors });

    // 3. Resolve product (if any)
    let productId = null;
    if (productSlug) {
        const product = await db.product.findFirst({ where: { tenantId, slug: productSlug } });
        productId = product?.id;
    }

    // 4. Create submission
    const submission = await db.formSubmission.create({
        data: {
            tenantId,
            formDefinitionId: formDef.id,
            productId,
            source: source || 'direct',
            status: 'new',
            paymentStatus: formDef.requiresPayment ? 'pending' : null,
            paymentAmount: formDef.paymentAmount,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
            data: {
                create: Object.entries(fields).map(([key, value]) => ({
                    fieldKey: key,
                    fieldLabel: formDef.fields.find(f => f.fieldKey === key)?.label || key,
                    value: String(value),
                }))
            }
        }
    });

    // 5. Send notification emails
    if (formDef.notificationEmails?.length) {
        await sendSubmissionNotification(formDef, submission, fields);
    }

    // 6. Return response
    if (formDef.requiresPayment) {
        return res.json({
            success: true,
            submissionId: submission.id,
            redirectTo: `/pages/payment.html?submissionId=${submission.id}`,
        });
    }

    return res.json({
        success: true,
        message: formDef.successMessage,
        redirectTo: formDef.redirectUrl,
    });
}
```

---

## 7. Form Attachment Points

Forms can be "attached" to different places on the site:

| Attachment | How It Works |
|-----------|-------------|
| **Default Intake** | Main form linked from hero CTA, nav buttons, product pages |
| **Product Form** | When clicking "Get Started" on a product, `?product=slug` is passed |
| **Contact Form** | Separate form definition (type: "contact") rendered on contact page |
| **Newsletter** | Simple email-only form on guide section |
| **Custom URL** | `/pages/forms.html?form=custom-assessment` loads specific form by slug |
| **Job Application** | Form attached to a job listing, submission linked to job ID |

The `?form=` URL parameter tells the public site which form definition to load. If no `?form=` param is present, the tenant's default intake form is loaded.

---

## 8. Submission Notifications

When a form is submitted, the system can:

1. **Email the tenant** - Send notification to all emails in `notification_emails`
2. **Dashboard notification** - Real-time badge count on Submissions nav item
3. **Webhook** (future) - POST submission data to an external URL

### Email Template
```
Subject: New [Form Name] Submission from [Visitor Name]

New submission received:
─────────────────────
Form: [Patient Intake Form]
Date: [15 Mar 2026, 14:32]
Source: [Shop Page]
Product: [Semaglutide]

Summary:
  Full Name: John Smith
  Email: john@example.com
  Phone: (555) 123-4567
  Goal: Weight Loss

View full submission:
https://dashboard.barterpay.com/submissions/[id]
```

---

## 9. Submission Export

Tenants can export submissions as CSV:

| Column | Source |
|--------|--------|
| Submission ID | `form_submissions.id` |
| Date | `form_submissions.created_at` |
| Form | `form_definitions.name` |
| Status | `form_submissions.status` |
| Payment | `form_submissions.payment_status` |
| Source | `form_submissions.source` |
| Product | `products.title` |
| (Dynamic) | One column per unique `field_key` across all submissions for the form |

CSV generation happens server-side with streaming to handle large datasets.

---

## 10. Default Forms (Seed Data)

When a new tenant registers, they get pre-built forms:

### Default Intake Form (7 steps, mirrors current)
Pre-populated with all 7 steps and fields from the current hardcoded form. Tenant can immediately use it or customize.

### Default Contact Form (1 step)
```
Fields: Full Name, Email, Phone (optional), Subject (select), Message (textarea)
```

### Default Newsletter Form (1 step)
```
Fields: Email
```

These are created from a form template system during tenant provisioning.
