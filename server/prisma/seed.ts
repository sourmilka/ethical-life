import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
});

async function main() {
  console.log("Seeding database...");

  // ── 1. Template ───────────────────────────────────────
  const template = await prisma.template.upsert({
    where: { slug: "healthcare-pro" },
    update: {},
    create: {
      name: "Healthcare Pro",
      slug: "healthcare-pro",
      description:
        "Professional healthcare and telemedicine website template with product catalog, blog, intake forms, and patient testimonials.",
      version: "1.0.0",
      isActive: true,
    },
  });

  // ── 2. Demo Tenant ────────────────────────────────────
  const tenant = await prisma.tenant.upsert({
    where: { slug: "ethicallife" },
    update: {},
    create: {
      name: "Ethical Life",
      slug: "ethicallife",
      templateId: template.id,
      status: "active",
      plan: "professional",
    },
  });

  // ── 3. Owner user ─────────────────────────────────────
  const passwordHash = await hash("demo-password-123", 12);
  await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: "admin@ethicallife.co.uk" } },
    update: {},
    create: {
      tenantId: tenant.id,
      email: "admin@ethicallife.co.uk",
      passwordHash,
      fullName: "Demo Admin",
      role: "owner",
    },
  });

  // ── 4. Site settings ──────────────────────────────────
  await prisma.siteSettings.upsert({
    where: { tenantId: tenant.id },
    update: {},
    create: {
      tenantId: tenant.id,
      companyName: "Ethical Life",
      tagline: "Your Health, Reimagined",
      colorPrimary: "#0D0D0D",
      colorAccent: "#FFCD93",
      colorSecondary: "#FF967A",
      colorBackground: "#E6E6E6",
      colorBorder: "#D9D9D9",
      colorBorderLight: "#EBEBEB",
      colorWhite: "#FFFFFF",
      contactEmail: "info@ethicallife.co.uk",
      contactPhone: "+44 20 7946 0958",
      contactAddress: "12 Harley Street, London, W1G 9PG",
      businessHours: "Mon-Fri 9am - 6pm",
      metaTitle: "Ethical Life — Modern Healthcare & Telemedicine",
      metaDescription:
        "Access licensed clinicians, personalized treatments, and pharmacy fulfillment from the comfort of home.",
      promoBannerText: "20% off now claimed. Auto-applied at checkout.",
      promoBannerActive: true,
      footerTagline: "Written by board-certified doctors to support your journey.",
    },
  });

  // ── 5. Navigation items ───────────────────────────────
  const navItems = [
    // Sidebar / main nav
    { location: "sidebar", label: "Home", url: "/", sortOrder: 0 },
    { location: "sidebar", label: "Shop", url: "/pages/shop.html", sortOrder: 1 },
    { location: "sidebar", label: "About Us", url: "/pages/about.html", sortOrder: 2 },
    { location: "sidebar", label: "Blog", url: "/pages/blog.html", sortOrder: 3 },
    { location: "sidebar", label: "Contact", url: "/pages/contact.html", sortOrder: 4 },
    { location: "sidebar", label: "FAQ", url: "/pages/faq.html", sortOrder: 5 },
    { location: "sidebar", label: "Careers", url: "/pages/careers.html", sortOrder: 6 },
    { location: "sidebar", label: "Terms & Conditions", url: "/pages/terms.html", sortOrder: 7 },
    { location: "sidebar", label: "Privacy Policy", url: "/pages/privacy.html", sortOrder: 8 },
    // Footer column 1 — Help & Support
    { location: "footer_col1", label: "Shop", url: "/pages/shop.html", sortOrder: 0 },
    { location: "footer_col1", label: "Contact Us", url: "/pages/contact.html", sortOrder: 1 },
    { location: "footer_col1", label: "FAQs", url: "/pages/faq.html", sortOrder: 2 },
    { location: "footer_col1", label: "Terms & Conditions", url: "/pages/terms.html", sortOrder: 3 },
    { location: "footer_col1", label: "Become An Ambassador", url: "/pages/contact.html", sortOrder: 4 },
    { location: "footer_col1", label: "Become A Brand Partner", url: "/pages/contact.html", sortOrder: 5 },
    // Footer column 2 — About
    { location: "footer_col2", label: "About ethical life", url: "/pages/about.html", sortOrder: 0 },
    { location: "footer_col2", label: "Careers", url: "/pages/careers.html", sortOrder: 1 },
    { location: "footer_col2", label: "Privacy Policy", url: "/pages/privacy.html", sortOrder: 2 },
    { location: "footer_col2", label: "Blogs", url: "/pages/blog.html", sortOrder: 3 },
  ];
  for (const item of navItems) {
    await prisma.navigationItem.create({
      data: { tenantId: tenant.id, ...item },
    });
  }

  // ── 6. Social links ───────────────────────────────────
  const socials = [
    { platform: "instagram", url: "#", sortOrder: 0 },
    { platform: "whatsapp", url: "#", sortOrder: 1 },
    { platform: "tiktok", url: "#", sortOrder: 2 },
    { platform: "messenger", url: "#", sortOrder: 3 },
    { platform: "facebook", url: "#", sortOrder: 4 },
  ];
  for (const s of socials) {
    await prisma.socialLink.upsert({
      where: { tenantId_platform: { tenantId: tenant.id, platform: s.platform } },
      update: {},
      create: { tenantId: tenant.id, ...s },
    });
  }

  // ── 7. Product categories ─────────────────────────────
  const weightLoss = await prisma.productCategory.upsert({
    where: { tenantId_slug: { tenantId: tenant.id, slug: "weight-loss" } },
    update: {},
    create: { tenantId: tenant.id, name: "Weight Loss", slug: "weight-loss", sortOrder: 0 },
  });
  const wellness = await prisma.productCategory.upsert({
    where: { tenantId_slug: { tenantId: tenant.id, slug: "wellness" } },
    update: {},
    create: { tenantId: tenant.id, name: "Wellness", slug: "wellness", sortOrder: 1 },
  });
  const supplements = await prisma.productCategory.upsert({
    where: { tenantId_slug: { tenantId: tenant.id, slug: "supplements" } },
    update: {},
    create: { tenantId: tenant.id, name: "Supplements", slug: "supplements", sortOrder: 2 },
  });

  // ── 8. Products ───────────────────────────────────────
  const products = [
    {
      slug: "semaglutide",
      title: "Semaglutide Injection",
      tagline: "FDA-approved GLP-1 receptor agonist for clinically proven weight management.",
      description:
        "A GLP-1 receptor agonist that helps regulate appetite and blood sugar for clinically proven weight management.",
      priceText: "From £149/mo",
      priceAmount: 149.0,
      tag: "Best Seller",
      categoryId: weightLoss.id,
      isFeatured: true,
      sortOrder: 0,
    },
    {
      slug: "tirzepatide",
      title: "Tirzepatide Injection",
      tagline: "Dual GIP/GLP-1 receptor agonist for enhanced metabolic support.",
      description:
        "A dual GIP/GLP-1 receptor agonist offering enhanced metabolic support and appetite control.",
      priceText: "From £199/mo",
      priceAmount: 199.0,
      categoryId: weightLoss.id,
      isFeatured: true,
      sortOrder: 1,
    },
    {
      slug: "metabolic-support",
      title: "Metabolic Support Pack",
      tagline: "Targeted vitamins and minerals to complement your weight-loss journey.",
      description:
        "Targeted vitamins and minerals formulated by clinicians to complement your weight-loss journey.",
      priceText: "£39/mo",
      priceAmount: 39.0,
      categoryId: wellness.id,
      isFeatured: true,
      sortOrder: 2,
    },
    {
      slug: "vitamin-b12",
      title: "Vitamin B12 Complex",
      tagline: "High-strength B12 to support energy levels and reduce fatigue.",
      description:
        "High-strength B12 to support energy levels, reduce fatigue, and aid nervous system function.",
      priceText: "£19/mo",
      priceAmount: 19.0,
      categoryId: supplements.id,
      isFeatured: true,
      sortOrder: 3,
    },
    {
      slug: "omega-3",
      title: "Omega-3 Fish Oil",
      tagline: "Pharmaceutical-grade omega-3 for heart health and inflammation support.",
      description:
        "Pharmaceutical-grade omega-3 for heart health, inflammation support, and overall wellbeing.",
      priceText: "£24/mo",
      priceAmount: 24.0,
      categoryId: supplements.id,
      isFeatured: true,
      sortOrder: 4,
    },
    {
      slug: "gut-health",
      title: "Gut Health Probiotic",
      tagline: "Multi-strain probiotic formulated to support digestive wellness.",
      description: "Multi-strain probiotic formulated to support digestive wellness.",
      priceText: "£29/mo",
      priceAmount: 29.0,
      categoryId: wellness.id,
      isFeatured: false,
      sortOrder: 5,
    },
  ];
  for (const p of products) {
    await prisma.product.upsert({
      where: { tenantId_slug: { tenantId: tenant.id, slug: p.slug } },
      update: {},
      create: { tenantId: tenant.id, currency: "GBP", features: [], isActive: true, ...p },
    });
  }

  // ── 9. Testimonials ───────────────────────────────────
  const testimonials = [
    {
      authorName: "Sarah Thompson",
      reviewText:
        "I was sceptical at first, but after 8 weeks on the programme I've lost over 2 stone. The medical team answered every question I had and the whole process felt really safe.",
      reviewDate: new Date("2025-01-15"),
      source: "Google",
      sortOrder: 0,
    },
    {
      authorName: "James Okafor",
      reviewText:
        "The convenience of telehealth made all the difference for me. I got my prescription approved within a day and the medication arrived discreetly at my door. Truly life-changing service.",
      reviewDate: new Date("2024-12-28"),
      source: "Google",
      sortOrder: 1,
    },
    {
      authorName: "Priya Patel",
      reviewText:
        "After years of yo-yo dieting I finally found something that works. My energy levels are up, my appetite is under control, and I feel healthier than I have in decades.",
      reviewDate: new Date("2024-11-10"),
      source: "Google",
      sortOrder: 2,
    },
    {
      authorName: "Michael Rivera",
      reviewText:
        "What impressed me most was the ongoing support. The clinical team checked in regularly and adjusted my plan as needed. This isn't just a prescription service, it's real care.",
      reviewDate: new Date("2024-10-22"),
      source: "Google",
      sortOrder: 3,
    },
    {
      authorName: "Emma Williams",
      reviewText:
        "I used to dread stepping on the scales. Now I look forward to tracking my progress. Down 18 lbs in 6 weeks and my blood work has improved across the board.",
      reviewDate: new Date("2024-09-05"),
      source: "Google",
      sortOrder: 4,
    },
    {
      authorName: "Daniel Kim",
      reviewText:
        "Signing up was quick and the form took less than five minutes. Within 48 hours I had a treatment plan tailored to my needs. Highly recommend for anyone on the fence.",
      reviewDate: new Date("2024-08-17"),
      source: "Google",
      sortOrder: 5,
    },
    {
      authorName: "Olivia Chen",
      reviewText:
        "The metabolic support pack has been a game-changer alongside my GLP-1 treatment. More energy, better sleep, and no more afternoon crashes. Wish I'd started sooner.",
      reviewDate: new Date("2024-07-30"),
      source: "Google",
      sortOrder: 6,
    },
    {
      authorName: "Robert Clarke",
      reviewText:
        "As a busy dad I needed something that fits around my schedule. No appointments, no waiting rooms. Just straightforward healthcare delivered to my home. Five stars.",
      reviewDate: new Date("2024-07-08"),
      source: "Google",
      sortOrder: 7,
    },
  ];
  for (const t of testimonials) {
    await prisma.testimonial.create({
      data: { tenantId: tenant.id, rating: 5, isVisible: true, ...t },
    });
  }

  // ── 10. FAQ categories & items ────────────────────────
  const faqGeneral = await prisma.faqCategory.upsert({
    where: { tenantId_slug: { tenantId: tenant.id, slug: "general" } },
    update: {},
    create: { tenantId: tenant.id, name: "General Questions", slug: "general", sortOrder: 0 },
  });
  const faqTreatment = await prisma.faqCategory.upsert({
    where: { tenantId_slug: { tenantId: tenant.id, slug: "treatment" } },
    update: {},
    create: { tenantId: tenant.id, name: "Treatment & Medication", slug: "treatment", sortOrder: 1 },
  });
  const faqOrders = await prisma.faqCategory.upsert({
    where: { tenantId_slug: { tenantId: tenant.id, slug: "orders-shipping" } },
    update: {},
    create: { tenantId: tenant.id, name: "Orders & Shipping", slug: "orders-shipping", sortOrder: 2 },
  });

  const faqItems = [
    // Home-page FAQ
    {
      question: "What is compounded GLP-1 and how does it work?",
      answer:
        "Compounded GLP-1 is a custom-prepared version of glucagon-like peptide-1 receptor agonists. These medications work by mimicking the natural GLP-1 hormone your body produces after eating. They help regulate blood sugar levels, slow gastric emptying, and reduce appetite signals in the brain, supporting sustainable weight management.",
      pageLocation: "home",
      categoryId: faqTreatment.id,
      sortOrder: 0,
    },
    {
      question: "Who is eligible for microdose treatment plans?",
      answer:
        "Eligibility depends on several factors including your current health status, BMI, medical history, and treatment goals. Generally, adults with a BMI over 27 who have struggled with traditional weight management approaches may be candidates. A licensed healthcare provider will evaluate your specific situation during the consultation to determine if this treatment is appropriate for you.",
      pageLocation: "home",
      categoryId: faqTreatment.id,
      sortOrder: 1,
    },
    {
      question: "What are the common side effects?",
      answer:
        "The most common side effects include mild nausea, which typically subsides within the first few weeks. Some patients also report decreased appetite, mild headaches, or digestive changes. The microdose approach is specifically designed to minimize these effects by starting at lower doses and gradually increasing, allowing your body to adjust comfortably over time. Serious side effects are rare but should be discussed with your provider.",
      pageLocation: "home",
      categoryId: faqTreatment.id,
      sortOrder: 2,
    },
    {
      question: "How long before I see results?",
      answer: "Most patients begin noticing changes within 2\u20134 weeks. Results vary by individual.",
      pageLocation: "home",
      categoryId: faqTreatment.id,
      sortOrder: 3,
    },
    {
      question: "Can I combine this with other medications or supplements?",
      answer:
        "In many cases, GLP-1 microdose treatments can be safely combined with other medications, but this must be evaluated on a case-by-case basis. Certain drug interactions exist, particularly with insulin or other diabetes medications, that require careful monitoring. During your initial consultation, your provider will review your complete medication list. Never start, stop, or change any medication without professional guidance from your healthcare team.",
      pageLocation: "home",
      categoryId: faqTreatment.id,
      sortOrder: 4,
    },
    // FAQ-page items
    {
      question: "What is Ethical Life?",
      answer:
        "Ethical Life is a licensed telehealth platform that connects you with board-certified clinicians for personalised weight-loss treatments, delivered discreetly to your door.",
      pageLocation: "faq_page",
      categoryId: faqGeneral.id,
      sortOrder: 5,
    },
    {
      question: "How does the process work?",
      answer:
        "Complete our short online intake form, a licensed clinician reviews your information and \u2014 if appropriate \u2014 prescribes a treatment plan. Your medication is then dispensed by a regulated pharmacy and shipped to you.",
      pageLocation: "faq_page",
      categoryId: faqGeneral.id,
      sortOrder: 6,
    },
    {
      question: "Is the service confidential?",
      answer:
        "Absolutely. All consultations are private, your data is encrypted, and packages are shipped in plain, discreet packaging with no indication of the contents.",
      pageLocation: "faq_page",
      categoryId: faqGeneral.id,
      sortOrder: 7,
    },
    {
      question: "What medications do you offer?",
      answer:
        "We currently offer GLP-1 receptor agonists including Semaglutide and Tirzepatide, along with complementary wellness supplements. All medications are FDA-approved and clinician-prescribed.",
      pageLocation: "faq_page",
      categoryId: faqTreatment.id,
      sortOrder: 8,
    },
    {
      question: "Are there any side effects?",
      answer:
        "As with any medication, side effects are possible. Common ones include mild nausea and digestive changes, which typically subside within the first few weeks. Your clinician will discuss all potential side effects before prescribing.",
      pageLocation: "faq_page",
      categoryId: faqTreatment.id,
      sortOrder: 9,
    },
    {
      question: "How long does treatment take to work?",
      answer:
        "Most patients begin noticing results within the first 4\u20138 weeks. Individual results vary depending on starting weight, adherence, and lifestyle factors.",
      pageLocation: "faq_page",
      categoryId: faqTreatment.id,
      sortOrder: 10,
    },
    {
      question: "How long does delivery take?",
      answer:
        "Once approved, orders are typically dispatched within 1\u20132 business days. Standard delivery takes 2\u20134 business days, with next-day options available.",
      pageLocation: "faq_page",
      categoryId: faqOrders.id,
      sortOrder: 11,
    },
    {
      question: "Can I cancel my subscription?",
      answer:
        "Yes. You can pause or cancel your subscription at any time from your account dashboard, or by contacting our support team. There are no cancellation fees.",
      pageLocation: "faq_page",
      categoryId: faqOrders.id,
      sortOrder: 12,
    },
    {
      question: "What is your refund policy?",
      answer:
        "If your treatment is not approved by our clinicians, you receive a full refund. For other refund queries, please contact our support team within 14 days of delivery.",
      pageLocation: "faq_page",
      categoryId: faqOrders.id,
      sortOrder: 13,
    },
  ];
  for (const f of faqItems) {
    await prisma.faqItem.create({
      data: { tenantId: tenant.id, isVisible: true, ...f },
    });
  }

  // ── 11. Videos ────────────────────────────────────────
  const videos = [
    { speakerName: "Dr Sarah Mitchell", speakerRole: "Medical Director", sortOrder: 0 },
    { speakerName: "James Chen", speakerRole: "Nutritionist", sortOrder: 1 },
    { speakerName: "Amara Osei", speakerRole: "Health Coach", sortOrder: 2 },
    { speakerName: "Dr Raj Patel", speakerRole: "Endocrinologist", sortOrder: 3 },
    { speakerName: "Emma Williams", speakerRole: "Patient Story", sortOrder: 4 },
    { speakerName: "Michael Rivera", speakerRole: "Patient Story", sortOrder: 5 },
  ];
  for (const v of videos) {
    await prisma.video.create({
      data: {
        tenantId: tenant.id,
        videoUrl: "/assets/video/What_it_takes_to_be_a_doctor_480p.mp4",
        isVisible: true,
        ...v,
      },
    });
  }

  // ── 12. Pages & sections ──────────────────────────────
  const homePage = await prisma.page.upsert({
    where: { tenantId_slug: { tenantId: tenant.id, slug: "home" } },
    update: {},
    create: {
      tenantId: tenant.id,
      slug: "home",
      title: "Home",
      metaDescription: "Access licensed clinicians, personalized treatments, and pharmacy fulfillment from home.",
    },
  });

  const homeSections = [
    {
      sectionKey: "hero",
      sortOrder: 0,
      content: {
        headline: "Your Health, Reimagined",
        tagline:
          "Access licensed clinicians, personalized treatments, and pharmacy fulfillment\u2014all from the comfort of home. Start your journey today.",
        cta_text: "Get Started",
        cta_url: "/pages/forms.html?source=hero",
        stats: [
          { label: "Patients Treated", value: "12,400+" },
          { label: "Licensed Clinicians", value: "46" },
          { label: "Avg. Weight Lost (lbs)", value: "22" },
        ],
        quote: "Your body holds the answers \u2014 we help you see them.",
      },
    },
    {
      sectionKey: "intro",
      sortOrder: 1,
      content: {
        title: "Healthcare That Fits Your Life",
        description: "Experience modern healthcare with convenience, privacy, and quality",
        cta_text: "Fill our form",
        cta_url: "/pages/forms.html?source=intro",
      },
    },
    {
      sectionKey: "markers",
      sortOrder: 2,
      content: {
        title: "Anyone. Anywhere. 500+ markers, 200+ patterns.",
        boxes: [
          {
            title: "No Appointments. No Waiting.",
            description: "Get actionable insights in minutes \u2014 no needles, no labs, no delays.",
          },
          {
            title: "Smarter Than Guesswork",
            description:
              "We process 2,000+ medical references and millions of data points to predict your health risks \u2014 clearly and intelligently.",
          },
          {
            title: "Tailored to You",
            description:
              "Every scan adapts to your biofeedback, lifestyle and unique markers \u2014 not generic checklists.",
          },
          {
            title: "Always-On Awareness",
            description: "With each scan, patterns emerge. You see what\u2019s changing \u2014 and why it matters.",
          },
        ],
      },
    },
    {
      sectionKey: "expert",
      sortOrder: 3,
      content: {
        heading:
          "You\u2019ve taken the first step toward a healthier, more confident version of you.",
        cta_text: "Fill our form",
        cta_url: "/pages/forms.html?source=expert",
      },
    },
    {
      sectionKey: "whatif",
      sortOrder: 4,
      content: {
        title: "What If Health Was...",
        slides: [
          { title: "Fresh life", subtitle: "Get actionable insights in minutes \u2014 no needles, no labs, no delays." },
          { title: "Smart care", subtitle: "AI-powered diagnostics tailored to your unique health profile." },
          { title: "Clear results", subtitle: "Visual reports you actually understand \u2014 no medical jargon required." },
          { title: "Full control", subtitle: "Track every marker, set goals, and own your health journey completely." },
          { title: "Always ready", subtitle: "Round-the-clock monitoring so you never miss a critical change." },
        ],
      },
    },
    {
      sectionKey: "guide",
      sortOrder: 5,
      content: {
        title: "Unlock the free Guide to Protein for Weight Loss",
        description: "Written by board-certified doctors to support your journey.",
        email_placeholder: "Enter your email",
        cta_text: "Get the guide",
        boxes: [
          {
            title: "No Appointments. No Waiting.",
            description: "Get actionable insights in minutes \u2014 no needles, no labs, no delays.",
          },
          {
            title: "Doctor-Led. Evidence-Based.",
            description: "Every treatment plan is reviewed and approved by board-certified clinicians.",
          },
        ],
      },
    },
    {
      sectionKey: "faq",
      sortOrder: 6,
      content: {
        title: "Ease in with compounded GLP-1 microdose treatment plans",
        description_1:
          "Sugar is no longer an occasional indulgence. In today\u2019s food environment, it appears constantly, not only as added sugar, but through refined grains and fast-absorbing carbohydrates. While sugar provides energy, repeated exposure changes how the body responds to it. What once worked smoothly now places continuous pressure on metabolic and hormonal systems.",
        description_2:
          "Over time, frequent sugar intake affects more than blood sugar alone. It influences appetite regulation, energy stability, mood, and long-term metabolic health. Many people experience this as energy dips after meals, persistent cravings, disrupted sleep, or weight gain, even when their eating habits have not significantly changed. Understanding how sugar works inside the body helps explain why these patterns develop and why long-term change requires more than willpower.",
        disclaimer:
          "*Disclaimer: This information is for educational and informational purposes only. It is not intended to be a substitute for professional medical advice.",
      },
    },
  ];
  for (const s of homeSections) {
    await prisma.pageSection.upsert({
      where: {
        tenantId_pageId_sectionKey: {
          tenantId: tenant.id,
          pageId: homePage.id,
          sectionKey: s.sectionKey,
        },
      },
      update: {},
      create: { tenantId: tenant.id, pageId: homePage.id, ...s },
    });
  }

  // About page
  const aboutPage = await prisma.page.upsert({
    where: { tenantId_slug: { tenantId: tenant.id, slug: "about" } },
    update: {},
    create: { tenantId: tenant.id, slug: "about", title: "About Us" },
  });
  await prisma.pageSection.upsert({
    where: {
      tenantId_pageId_sectionKey: {
        tenantId: tenant.id,
        pageId: aboutPage.id,
        sectionKey: "hero",
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      pageId: aboutPage.id,
      sectionKey: "hero",
      sortOrder: 0,
      content: { headline: "About Ethical Life", tagline: "Our mission is your health" },
    },
  });

  // Other pages (stubs)
  const pageStubs = ["shop", "blog", "contact", "faq", "careers", "terms", "privacy", "forms", "payment", "thank-you"];
  for (const slug of pageStubs) {
    await prisma.page.upsert({
      where: { tenantId_slug: { tenantId: tenant.id, slug } },
      update: {},
      create: {
        tenantId: tenant.id,
        slug,
        title: slug
          .split("-")
          .map((w) => w[0].toUpperCase() + w.slice(1))
          .join(" "),
      },
    });
  }

  // ── 13. Blog posts (6 seed posts) ─────────────────────
  const blogCat = await prisma.blogCategory.upsert({
    where: { tenantId_slug: { tenantId: tenant.id, slug: "weight-loss" } },
    update: {},
    create: { tenantId: tenant.id, name: "Weight Loss", slug: "weight-loss", sortOrder: 0 },
  });
  const blogCat2 = await prisma.blogCategory.upsert({
    where: { tenantId_slug: { tenantId: tenant.id, slug: "wellness" } },
    update: {},
    create: { tenantId: tenant.id, name: "Wellness", slug: "wellness", sortOrder: 1 },
  });

  const blogPosts = [
    {
      slug: "understanding-glp1-medications",
      title: "Understanding GLP-1 Medications: What You Need to Know",
      excerpt: "A comprehensive guide to how GLP-1 receptor agonists work for weight management.",
      status: "published",
      isFeatured: true,
      categoryId: blogCat.id,
      readTime: "8 min read",
      authorName: "Dr Sarah Mitchell",
      publishedAt: new Date("2025-01-10"),
    },
    {
      slug: "5-habits-for-sustainable-weight-loss",
      title: "5 Habits for Sustainable Weight Loss",
      excerpt: "Evidence-based lifestyle changes that complement medical weight management.",
      status: "published",
      categoryId: blogCat.id,
      readTime: "5 min read",
      authorName: "James Chen",
      publishedAt: new Date("2025-01-05"),
    },
    {
      slug: "telehealth-revolution-healthcare",
      title: "The Telehealth Revolution: Healthcare From Home",
      excerpt: "How telemedicine is making quality healthcare accessible to everyone.",
      status: "published",
      categoryId: blogCat2.id,
      readTime: "6 min read",
      authorName: "Dr Sarah Mitchell",
      publishedAt: new Date("2024-12-20"),
    },
    {
      slug: "protein-guide-weight-management",
      title: "The Complete Protein Guide for Weight Management",
      excerpt: "Why protein matters and how to optimize your intake during treatment.",
      status: "published",
      categoryId: blogCat.id,
      readTime: "7 min read",
      authorName: "James Chen",
      publishedAt: new Date("2024-12-15"),
    },
    {
      slug: "gut-health-weight-connection",
      title: "Gut Health and Weight: The Hidden Connection",
      excerpt: "How your microbiome affects metabolism, cravings, and weight management.",
      status: "published",
      categoryId: blogCat2.id,
      readTime: "6 min read",
      authorName: "Amara Osei",
      publishedAt: new Date("2024-12-01"),
    },
    {
      slug: "managing-treatment-side-effects",
      title: "Managing Treatment Side Effects: A Patient Guide",
      excerpt: "Practical tips for minimizing and managing common GLP-1 side effects.",
      status: "published",
      categoryId: blogCat.id,
      readTime: "5 min read",
      authorName: "Dr Raj Patel",
      publishedAt: new Date("2024-11-20"),
    },
  ];
  for (const b of blogPosts) {
    await prisma.blogPost.upsert({
      where: { tenantId_slug: { tenantId: tenant.id, slug: b.slug } },
      update: {},
      create: { tenantId: tenant.id, ...b },
    });
  }

  // ── 14. Team members ──────────────────────────────────
  const team = [
    { fullName: "Dr Sarah Mitchell", jobTitle: "Medical Director", sortOrder: 0 },
    { fullName: "James Chen", jobTitle: "Head Nutritionist", sortOrder: 1 },
    { fullName: "Amara Osei", jobTitle: "Lead Health Coach", sortOrder: 2 },
    { fullName: "Dr Raj Patel", jobTitle: "Endocrinologist", sortOrder: 3 },
  ];
  for (const m of team) {
    await prisma.teamMember.create({
      data: { tenantId: tenant.id, isVisible: true, ...m },
    });
  }

  // ── 15. Job listings ──────────────────────────────────
  const jobs = [
    {
      title: "Senior Pharmacist",
      department: "Clinical",
      location: "London, UK",
      type: "Full-Time",
      description: "Join our clinical team to oversee prescription fulfilment and patient safety.",
      salaryRange: "£55,000 - £70,000",
      status: "active",
    },
    {
      title: "Full Stack Developer",
      department: "Engineering",
      location: "Remote",
      type: "Full-Time",
      description: "Build and maintain the platform powering our telehealth services.",
      salaryRange: "£65,000 - £85,000",
      status: "active",
    },
    {
      title: "Marketing Manager",
      department: "Marketing",
      location: "London, UK",
      type: "Full-Time",
      description: "Lead our brand growth strategy and patient acquisition campaigns.",
      salaryRange: "£45,000 - £60,000",
      status: "active",
    },
    {
      title: "Customer Support Lead",
      department: "Operations",
      location: "Remote",
      type: "Full-Time",
      description: "Manage our support team and ensure outstanding patient experience.",
      salaryRange: "£35,000 - £45,000",
      status: "active",
    },
  ];
  for (const j of jobs) {
    await prisma.jobListing.create({
      data: { tenantId: tenant.id, responsibilities: [], requirements: [], ...j },
    });
  }

  console.log("Seed completed successfully!");
  console.log(`  Template: ${template.name}`);
  console.log(`  Tenant: ${tenant.name} (${tenant.slug})`);
  console.log(`  Products: ${products.length}`);
  console.log(`  Testimonials: ${testimonials.length}`);
  console.log(`  FAQ items: ${faqItems.length}`);
  console.log(`  Blog posts: ${blogPosts.length}`);
  console.log(`  Videos: ${videos.length}`);
  console.log(`  Team members: ${team.length}`);
  console.log(`  Job listings: ${jobs.length}`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
