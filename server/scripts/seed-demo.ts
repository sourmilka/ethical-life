/**
 * Seed demo content for the Ethical Life tenant.
 * Run: npx tsx --env-file .env scripts/seed-demo.ts
 */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString: DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Connecting to database...");
  await prisma.$connect();
  console.log("Connected!");

  // Find the tenant
  const tenant = await prisma.tenant.findUnique({ where: { slug: "ethical-life" } });
  if (!tenant) {
    console.error("Tenant 'ethical-life' not found. Run seed-users.ts first.");
    process.exit(1);
  }
  const tenantId = tenant.id;
  console.log(`Found tenant: ${tenant.name} (${tenantId})`);

  // ── Update site settings ──────────────────────────────────
  console.log("Updating site settings...");
  await prisma.siteSettings.updateMany({
    where: { tenantId },
    data: {
      companyName: "Ethical Life",
      logoUrl: "/assets/images/logo.svg",
      faviconUrl: "/assets/images/logo.svg",
      tagline: "Your Health, Reimagined",
      colorPrimary: "#0D0D0D",
      colorAccent: "#FFCD93",
      colorSecondary: "#FF967A",
      colorBackground: "#E6E6E6",
      colorBorder: "#D9D9D9",
      colorBorderLight: "#EBEBEB",
      colorWhite: "#ffffff",
      contactEmail: "hello@ethicallife.com",
      contactPhone: "+44 20 7946 0958",
      contactAddress: "123 Wellness Street, London, EC1A 1BB",
      businessHours: "Mon-Fri: 9am-6pm",
      metaTitle: "Ethical Life — Healthcare, Reimagined",
      metaDescription: "Access licensed clinicians, personalized treatments, and pharmacy fulfillment from home.",
      promoBannerText: "20% off now claimed. Auto-applied at checkout.",
      promoBannerActive: true,
      footerTagline: "Written by board-certified doctors to support your journey.",
      appStoreUrl: "#",
      playStoreUrl: "#",
      termsContent: "<h2>Terms of Service</h2><p>Welcome to Ethical Life. By accessing or using our services, you agree to be bound by these Terms of Service.</p><h3>1. Services</h3><p>Ethical Life provides telehealth consultations, personalised treatment plans, and pharmaceutical fulfilment for weight management and wellness. All medical services are delivered by licensed healthcare professionals.</p><h3>2. Eligibility</h3><p>You must be at least 18 years old and a UK resident to use our services. You agree to provide accurate and complete health information during registration and consultations.</p><h3>3. Medical Disclaimer</h3><p>Our services do not replace emergency medical care. If you are experiencing a medical emergency, call 999 immediately. Treatment plans are personalised and results may vary.</p><h3>4. Privacy</h3><p>Your personal and medical data is handled in accordance with our Privacy Policy and UK data protection regulations (UK GDPR).</p><h3>5. Payment</h3><p>All prices are displayed in GBP. Payment is required at the time of order. Subscription plans may be cancelled at any time with 30 days notice.</p><h3>6. Limitation of Liability</h3><p>Ethical Life and its medical partners are not liable for adverse reactions to prescribed treatments when used as directed. You acknowledge that all medical treatments carry inherent risks.</p><h3>7. Changes</h3><p>We reserve the right to update these terms at any time. Continued use of our services constitutes acceptance of revised terms.</p>",
      privacyContent: "<h2>Privacy Policy</h2><p>Ethical Life is committed to protecting your privacy. This policy explains how we collect, use, and safeguard your personal information.</p><h3>1. Information We Collect</h3><p>We collect personal information including your name, email address, date of birth, medical history, and payment details when you register for our services or complete a consultation.</p><h3>2. How We Use Your Information</h3><p>Your information is used to provide medical consultations, process prescriptions, improve our services, and communicate with you about your treatment plan. We do not sell your personal data to third parties.</p><h3>3. Data Security</h3><p>We implement industry-standard security measures including encryption, secure servers, and access controls to protect your personal and medical information.</p><h3>4. Data Retention</h3><p>Medical records are retained in accordance with NHS guidelines and UK law. You may request deletion of non-medical personal data at any time.</p><h3>5. Your Rights</h3><p>Under UK GDPR, you have the right to access, correct, or delete your personal data. You may also request a copy of your data in a portable format. To exercise these rights, contact us at privacy@ethicallife.com.</p><h3>6. Cookies</h3><p>Our website uses essential cookies to ensure proper functionality. Analytics cookies are only used with your consent.</p><h3>7. Contact</h3><p>For privacy-related enquiries, contact our Data Protection Officer at privacy@ethicallife.com or write to: Ethical Life, 123 Wellness Street, London, EC1A 1BB.</p>",
    },
  });

  // ── Create pages ──────────────────────────────────────────
  console.log("Creating pages...");
  const pageSlugs = ["home", "shop", "about", "blog", "contact", "faq", "careers", "terms", "privacy"];
  for (const slug of pageSlugs) {
    await prisma.page.upsert({
      where: { tenantId_slug: { tenantId, slug } },
      update: { isActive: true },
      create: { tenantId, slug, title: slug.charAt(0).toUpperCase() + slug.slice(1), isActive: true },
    });
  }

  const homePage = await prisma.page.findFirst({ where: { tenantId, slug: "home" } });
  if (!homePage) throw new Error("Home page not found");

  // ── Page Sections (hero, intro, expert, markers, whatif, guide) ──
  console.log("Creating home page sections...");
  const sections = [
    {
      sectionKey: "hero",
      sortOrder: 1,
      isVisible: true,
      content: {
        headline: "Your Health, Reimagined",
        tagline: "Access licensed clinicians, personalized treatments, and pharmacy fulfillment—all from the comfort of home. Start your journey today.",
        ctaUrl: "/pages/forms.html",
        ctaText: "Get Started",
        stats: [
          { label: "Patients Treated", value: "12,400+" },
          { label: "Licensed Clinicians", value: "46" },
          { label: "Avg. Weight Lost (lbs)", value: "22" },
        ],
        quote: "Your body holds the answers — we help you see them.",
      },
    },
    {
      sectionKey: "intro",
      sortOrder: 2,
      isVisible: true,
      content: {
        headline: "Healthcare That Fits Your Life",
        description: "Experience modern healthcare with convenience, privacy, and quality",
        ctaUrl: "/pages/forms.html",
        ctaText: "Fill our form",
      },
    },
    {
      sectionKey: "expert",
      sortOrder: 3,
      isVisible: true,
      content: {
        headline: "You've taken the first step toward a healthier, more confident version of you.",
        ctaUrl: "/pages/forms.html",
        ctaText: "Fill our form",
      },
    },
    {
      sectionKey: "markers",
      sortOrder: 4,
      isVisible: true,
      content: {
        headline: "Anyone. Anywhere. 500+ markers, 200+ patterns.",
        items: [
          { title: "No Appointments. No Waiting.", description: "Get actionable insights in minutes — no needles, no labs, no delays." },
          { title: "Smarter Than Guesswork", description: "We process 2,000+ medical references and millions of data points to predict your health risks — clearly and intelligently." },
          { title: "Tailored to You", description: "Every scan adapts to your biofeedback, lifestyle and unique markers — not generic checklists." },
          { title: "Always-On Awareness", description: "With each scan, patterns emerge. You see what's changing — and why it matters." },
        ],
      },
    },
    {
      sectionKey: "whatif",
      sortOrder: 5,
      isVisible: true,
      content: {
        headline: "What If Health Was...",
        items: [
          { title: "Fresh life", description: "Get actionable insights in minutes — no needles, no labs, no delays." },
          { title: "Smart care", description: "AI-powered diagnostics tailored to your unique health profile." },
          { title: "Clear results", description: "Visual reports you actually understand — no medical jargon required." },
          { title: "Full control", description: "Track every marker, set goals, and own your health journey completely." },
          { title: "Always ready", description: "Round-the-clock monitoring so you never miss a critical change." },
        ],
      },
    },
    {
      sectionKey: "guide",
      sortOrder: 6,
      isVisible: true,
      content: {
        headline: "Unlock the free Guide to Protein for Weight Loss",
        subtext: "Written by board-certified doctors to support your journey.",
        bgImage: "/assets/images/bg2.png",
        formAction: "#",
        ctaText: "Get the guide",
        boxes: [
          { title: "No Appointments. No Waiting.", description: "Get actionable insights in minutes — no needles, no labs, no delays." },
          { title: "Doctor-Led. Evidence-Based.", description: "Every treatment plan is reviewed and approved by board-certified clinicians." },
        ],
      },
    },
  ];

  for (const s of sections) {
    await prisma.pageSection.upsert({
      where: { tenantId_pageId_sectionKey: { tenantId, pageId: homePage.id, sectionKey: s.sectionKey } },
      update: { content: s.content, isVisible: s.isVisible, sortOrder: s.sortOrder },
      create: { tenantId, pageId: homePage.id, ...s },
    });
  }

  // ── Navigation items ──────────────────────────────────────
  console.log("Creating navigation items...");
  await prisma.navigationItem.deleteMany({ where: { tenantId } });

  const navItems = [
    // Navbar
    { location: "navbar", label: "Shop", url: "/pages/shop.html", sortOrder: 1 },
    { location: "navbar", label: "About", url: "/pages/about.html", sortOrder: 2 },
    { location: "navbar", label: "Blog", url: "/pages/blog.html", sortOrder: 3 },
    { location: "navbar", label: "Contact", url: "/pages/contact.html", sortOrder: 4 },
    { location: "navbar", label: "FAQ", url: "/pages/faq.html", sortOrder: 5 },
    { location: "navbar", label: "Redeem Offer", url: "/pages/forms.html", sortOrder: 6, cssClass: "redeem-btn" },
    // Sidebar
    { location: "sidebar", label: "Home", url: "/", sortOrder: 1 },
    { location: "sidebar", label: "Shop", url: "/pages/shop.html", sortOrder: 2 },
    { location: "sidebar", label: "About Us", url: "/pages/about.html", sortOrder: 3 },
    { location: "sidebar", label: "Blog", url: "/pages/blog.html", sortOrder: 4 },
    { location: "sidebar", label: "Contact", url: "/pages/contact.html", sortOrder: 5 },
    { location: "sidebar", label: "FAQ", url: "/pages/faq.html", sortOrder: 6 },
    { location: "sidebar", label: "Careers", url: "/pages/careers.html", sortOrder: 7 },
    { location: "sidebar", label: "Terms & Conditions", url: "/pages/terms.html", sortOrder: 8 },
    { location: "sidebar", label: "Privacy Policy", url: "/pages/privacy.html", sortOrder: 9 },
    // Footer col 1
    { location: "footer_col1", label: "Shop", url: "/pages/shop.html", sortOrder: 1 },
    { location: "footer_col1", label: "Contact Us", url: "/pages/contact.html", sortOrder: 2 },
    { location: "footer_col1", label: "FAQs", url: "/pages/faq.html", sortOrder: 3 },
    { location: "footer_col1", label: "Terms & Conditions", url: "/pages/terms.html", sortOrder: 4 },
    { location: "footer_col1", label: "Become An Ambassador", url: "#", sortOrder: 5 },
    { location: "footer_col1", label: "Become A Brand Partner", url: "#", sortOrder: 6 },
    // Footer col 2
    { location: "footer_col2", label: "About ethical life", url: "/pages/about.html", sortOrder: 1 },
    { location: "footer_col2", label: "Careers", url: "/pages/careers.html", sortOrder: 2 },
    { location: "footer_col2", label: "Privacy Policy", url: "/pages/privacy.html", sortOrder: 3 },
    { location: "footer_col2", label: "Blogs", url: "/pages/blog.html", sortOrder: 4 },
  ];

  for (const nav of navItems) {
    await prisma.navigationItem.create({
      data: { tenantId, isVisible: true, openInNewTab: false, ...nav },
    });
  }

  // ── Social links ──────────────────────────────────────────
  console.log("Creating social links...");
  await prisma.socialLink.deleteMany({ where: { tenantId } });

  const socials = [
    { platform: "Instagram", url: "#", sortOrder: 1 },
    { platform: "WhatsApp", url: "#", sortOrder: 2 },
    { platform: "TikTok", url: "#", sortOrder: 3 },
    { platform: "Facebook", url: "#", sortOrder: 4 },
  ];

  for (const s of socials) {
    await prisma.socialLink.create({
      data: { tenantId, isVisible: true, ...s },
    });
  }

  // ── Product categories & products ─────────────────────────
  console.log("Creating products...");
  await prisma.product.deleteMany({ where: { tenantId } });
  await prisma.productCategory.deleteMany({ where: { tenantId } });

  const catWeightLoss = await prisma.productCategory.create({
    data: { tenantId, name: "Weight Loss", slug: "weight-loss", sortOrder: 1 },
  });
  const catWellness = await prisma.productCategory.create({
    data: { tenantId, name: "Wellness", slug: "wellness", sortOrder: 2 },
  });
  const catSupplements = await prisma.productCategory.create({
    data: { tenantId, name: "Supplements", slug: "supplements", sortOrder: 3 },
  });

  const products = [
    {
      slug: "semaglutide",
      title: "Semaglutide Injection",
      categoryId: catWeightLoss.id,
      tagline: "Clinically proven weight management",
      description: "A GLP-1 receptor agonist that helps regulate appetite and blood sugar for clinically proven weight management.",
      howItWorks: "A GLP-1 receptor agonist that helps regulate appetite and blood sugar for clinically proven weight management.",
      priceText: "From £149/month",
      priceAmount: 149,
      imageUrl: "/assets/images/1.png",
      isFeatured: true,
      sortOrder: 1,
      features: ["Clinically proven GLP-1 receptor agonist", "Appetite regulation & blood sugar control", "Weekly injection schedule", "Doctor-monitored treatment plan", "Discreet home delivery"],
    },
    {
      slug: "tirzepatide",
      title: "Tirzepatide Injection",
      categoryId: catWeightLoss.id,
      tagline: "Enhanced metabolic support",
      description: "A dual GIP/GLP-1 receptor agonist offering enhanced metabolic support and appetite control.",
      howItWorks: "A dual GIP/GLP-1 receptor agonist offering enhanced metabolic support and appetite control.",
      priceText: "From £199/month",
      priceAmount: 199,
      imageUrl: "/assets/images/2.png",
      isFeatured: true,
      sortOrder: 2,
      features: ["Dual GIP/GLP-1 receptor agonist", "Enhanced metabolic support", "Superior appetite control", "Personalised dosing schedule", "Clinical monitoring included"],
    },
    {
      slug: "metabolic-support-pack",
      title: "Metabolic Support Pack",
      categoryId: catWellness.id,
      tagline: "Complement your weight-loss journey",
      description: "Targeted vitamins and minerals formulated by clinicians to complement your weight-loss journey.",
      howItWorks: "Targeted vitamins and minerals formulated by clinicians to complement your weight-loss journey.",
      priceText: "£39.99",
      priceAmount: 39.99,
      imageUrl: "/assets/images/3.png",
      isFeatured: true,
      sortOrder: 3,
      features: ["Clinician-formulated vitamin blend", "Supports weight-loss journey", "Essential minerals included", "Easy daily supplement", "No prescription required"],
    },
    {
      slug: "vitamin-b12-complex",
      title: "Vitamin B12 Complex",
      categoryId: catSupplements.id,
      tagline: "Support energy levels",
      description: "High-strength B12 to support energy levels, reduce fatigue, and aid nervous system function.",
      howItWorks: "High-strength B12 to support energy levels, reduce fatigue, and aid nervous system function.",
      priceText: "£19.99",
      priceAmount: 19.99,
      imageUrl: "/assets/images/4.png",
      isFeatured: true,
      sortOrder: 4,
      features: ["High-strength B12 formula", "Reduces fatigue & tiredness", "Supports nervous system function", "Easy-to-swallow capsules", "90-day supply"],
    },
    {
      slug: "omega-3-fish-oil",
      title: "Omega-3 Fish Oil",
      categoryId: catSupplements.id,
      tagline: "Heart health & inflammation support",
      description: "Pharmaceutical-grade omega-3 for heart health, inflammation support, and overall wellbeing.",
      howItWorks: "Pharmaceutical-grade omega-3 for heart health, inflammation support, and overall wellbeing.",
      priceText: "£14.99",
      priceAmount: 14.99,
      imageUrl: "/assets/images/5.png",
      isFeatured: true,
      sortOrder: 5,
      features: ["Pharmaceutical-grade omega-3", "Supports heart health", "Anti-inflammatory benefits", "Sustainably sourced fish oil", "60-capsule supply"],
    },
  ];

  for (const p of products) {
    await prisma.product.create({
      data: { tenantId, isActive: true, ...p },
    });
  }

  // ── Videos ────────────────────────────────────────────────
  console.log("Creating videos...");
  await prisma.video.deleteMany({ where: { tenantId } });

  const videoData = [
    { title: "Dr Sarah Mitchell", speakerName: "Dr Sarah Mitchell", speakerRole: "Medical Director", speakerAvatar: "/assets/images/doctor.png", thumbnailUrl: "/assets/images/bg.png", sortOrder: 1 },
    { title: "James Chen", speakerName: "James Chen", speakerRole: "Nutritionist", speakerAvatar: "/assets/images/pp.png", thumbnailUrl: "/assets/images/bg.png", sortOrder: 2 },
    { title: "Amara Osei", speakerName: "Amara Osei", speakerRole: "Health Coach", speakerAvatar: "/assets/images/user.png", thumbnailUrl: "/assets/images/bg.png", sortOrder: 3 },
    { title: "Dr Raj Patel", speakerName: "Dr Raj Patel", speakerRole: "Endocrinologist", speakerAvatar: "/assets/images/doctor.png", thumbnailUrl: "/assets/images/bg.png", sortOrder: 4 },
    { title: "Emma Williams", speakerName: "Emma Williams", speakerRole: "Patient Story", speakerAvatar: "/assets/images/pp.png", thumbnailUrl: "/assets/images/bg.png", sortOrder: 5 },
    { title: "Michael Rivera", speakerName: "Michael Rivera", speakerRole: "Patient Story", speakerAvatar: "/assets/images/user.png", thumbnailUrl: "/assets/images/bg.png", sortOrder: 6 },
    { title: "Dr Lisa Kim", speakerName: "Dr Lisa Kim", speakerRole: "Clinical Pharmacist", speakerAvatar: "/assets/images/doctor.png", thumbnailUrl: "/assets/images/bg.png", sortOrder: 7 },
    { title: "Priya Patel", speakerName: "Priya Patel", speakerRole: "Patient Story", speakerAvatar: "/assets/images/pp.png", thumbnailUrl: "/assets/images/bg.png", sortOrder: 8 },
  ];

  for (const v of videoData) {
    await prisma.video.create({
      data: {
        tenantId,
        isVisible: true,
        videoUrl: "/assets/video/What_it_takes_to_be_a_doctor_480p.mp4",
        ...v,
      },
    });
  }

  // ── FAQ categories & items ────────────────────────────────
  console.log("Creating FAQs...");
  await prisma.faqItem.deleteMany({ where: { tenantId } });
  await prisma.faqCategory.deleteMany({ where: { tenantId } });

  const faqCat = await prisma.faqCategory.create({
    data: { tenantId, name: "General", slug: "general", sortOrder: 1 },
  });

  const faqs = [
    {
      question: "What is compounded GLP-1 and how does it work?",
      answer: "Compounded GLP-1 is a custom-prepared version of glucagon-like peptide-1 receptor agonists. These medications work by mimicking the natural GLP-1 hormone your body produces after eating. They help regulate blood sugar levels, slow gastric emptying, and reduce appetite signals in the brain, supporting sustainable weight management.",
    },
    {
      question: "Who is eligible for microdose treatment plans?",
      answer: "Eligibility depends on several factors including your current health status, BMI, medical history, and treatment goals. Generally, adults with a BMI over 27 who have struggled with traditional weight management approaches may be candidates. A licensed healthcare provider will evaluate your specific situation during the consultation to determine if this treatment is appropriate for you.",
    },
    {
      question: "What are the common side effects?",
      answer: "The most common side effects include mild nausea, which typically subsides within the first few weeks. Some patients also report decreased appetite, mild headaches, or digestive changes. The microdose approach is specifically designed to minimize these effects by starting at lower doses and gradually increasing, allowing your body to adjust comfortably over time. Serious side effects are rare but should be discussed with your provider.",
    },
    {
      question: "How long before I see results?",
      answer: "Most patients begin noticing changes within 2\u20134 weeks. Results vary by individual.",
    },
    {
      question: "Can I combine this with other medications or supplements?",
      answer: "In many cases, GLP-1 microdose treatments can be safely combined with other medications, but this must be evaluated on a case-by-case basis. Certain drug interactions exist, particularly with insulin or other diabetes medications, that require careful monitoring. During your initial consultation, your provider will review your complete medication list. Never start, stop, or change any medication without professional guidance from your healthcare team.",
    },
  ];

  for (let i = 0; i < faqs.length; i++) {
    await prisma.faqItem.create({
      data: {
        tenantId,
        categoryId: faqCat.id,
        question: faqs[i].question,
        answer: faqs[i].answer,
        pageLocation: "both",
        sortOrder: i + 1,
        isVisible: true,
      },
    });
  }

  // ── Testimonials ──────────────────────────────────────────
  console.log("Creating testimonials...");
  await prisma.testimonial.deleteMany({ where: { tenantId } });

  const testimonials = [
    { authorName: "Sarah Thompson", reviewDate: new Date("2025-01-15"), reviewText: "I was sceptical at first, but after 8 weeks on the programme I\u2019ve lost over 2 stone. The medical team answered every question I had and the whole process felt really safe." },
    { authorName: "James Okafor", reviewDate: new Date("2024-12-28"), reviewText: "The convenience of telehealth made all the difference for me. I got my prescription approved within a day and the medication arrived discreetly at my door. Truly life-changing service." },
    { authorName: "Priya Patel", reviewDate: new Date("2024-11-10"), reviewText: "After years of yo-yo dieting I finally found something that works. My energy levels are up, my appetite is under control, and I feel healthier than I have in decades." },
    { authorName: "Michael Rivera", reviewDate: new Date("2024-10-22"), reviewText: "What impressed me most was the ongoing support. The clinical team checked in regularly and adjusted my plan as needed. This isn\u2019t just a prescription service, it\u2019s real care." },
    { authorName: "Emma Williams", reviewDate: new Date("2024-09-05"), reviewText: "I used to dread stepping on the scales. Now I look forward to tracking my progress. Down 18 lbs in 6 weeks and my blood work has improved across the board." },
    { authorName: "Daniel Kim", reviewDate: new Date("2024-08-17"), reviewText: "Signing up was quick and the form took less than five minutes. Within 48 hours I had a treatment plan tailored to my needs. Highly recommend for anyone on the fence." },
    { authorName: "Olivia Chen", reviewDate: new Date("2024-07-30"), reviewText: "The metabolic support pack has been a game-changer alongside my GLP-1 treatment. More energy, better sleep, and no more afternoon crashes. Wish I\u2019d started sooner." },
    { authorName: "Robert Clarke", reviewDate: new Date("2024-07-08"), reviewText: "As a busy dad I needed something that fits around my schedule. No appointments, no waiting rooms. Just straightforward healthcare delivered to my home. Five stars." },
  ];

  for (let i = 0; i < testimonials.length; i++) {
    await prisma.testimonial.create({
      data: {
        tenantId,
        rating: 5,
        source: "Google",
        sourceIcon: "/assets/images/google.svg",
        isVisible: true,
        sortOrder: i + 1,
        authorAvatar: "/assets/images/user.png",
        ...testimonials[i],
      },
    });
  }

  // ── Team Members ──────────────────────────────────────────
  console.log("Creating team members...");
  await prisma.teamMember.deleteMany({ where: { tenantId } });

  const team = [
    { fullName: "Dr Sarah Mitchell", jobTitle: "Medical Director", bio: "Board-certified physician with over 15 years of clinical experience in weight management and metabolic health.", photoUrl: "/assets/images/doctor.png", sortOrder: 1 },
    { fullName: "James Chen", jobTitle: "Lead Nutritionist", bio: "Registered dietitian specialising in evidence-based nutrition for sustainable weight loss.", photoUrl: "/assets/images/pp.png", sortOrder: 2 },
    { fullName: "Amara Osei", jobTitle: "Health Coach", bio: "Certified health coach passionate about helping clients achieve lasting lifestyle changes.", photoUrl: "/assets/images/user.png", sortOrder: 3 },
  ];

  for (const t of team) {
    await prisma.teamMember.create({
      data: { tenantId, isVisible: true, ...t },
    });
  }

  // ── Blog posts ────────────────────────────────────────────
  console.log("Creating blog posts...");
  await prisma.blogPost.deleteMany({ where: { tenantId } });
  await prisma.blogCategory.deleteMany({ where: { tenantId } });

  const blogCat = await prisma.blogCategory.create({
    data: { tenantId, name: "Health & Wellness", slug: "health-wellness", sortOrder: 1 },
  });

  const blogPosts = [
    {
      slug: "understanding-glp1-weight-management",
      title: "Understanding GLP-1 Medications for Weight Management",
      excerpt: "Learn how GLP-1 receptor agonists like semaglutide work, their benefits, and what to expect during treatment.",
      content: "<h2>What are GLP-1 medications?</h2><p>GLP-1 (glucagon-like peptide-1) receptor agonists are a class of medications originally developed for type 2 diabetes that have shown remarkable results in weight management. These medications mimic the natural GLP-1 hormone produced in your gut after eating.</p><h2>How do they work?</h2><p>GLP-1 medications work by slowing gastric emptying, reducing appetite signals in the brain, and helping regulate blood sugar levels. This combination leads to reduced caloric intake and sustainable weight loss.</p><h2>What to expect</h2><p>Most patients begin at a low dose, gradually increasing over several weeks. This approach minimises side effects and allows your body to adjust. Results typically become noticeable within 2-4 weeks.</p>",
      coverImageUrl: "/assets/images/bg.png",
      authorName: "Dr Sarah Mitchell",
      readTime: "5 min read",
      status: "published",
      isFeatured: true,
      publishedAt: new Date("2025-01-10"),
    },
    {
      slug: "protein-guide-weight-loss",
      title: "The Ultimate Guide to Protein for Weight Loss",
      excerpt: "Discover why protein is essential for weight loss and how to optimise your intake for best results.",
      content: "<h2>Why protein matters</h2><p>Protein is the most important macronutrient for weight loss. It increases satiety, boosts metabolism, and helps preserve lean muscle mass during caloric deficit.</p><h2>How much do you need?</h2><p>Most experts recommend 1.2-1.6 grams of protein per kilogram of body weight for active individuals pursuing weight loss. This ensures adequate muscle recovery and metabolic support.</p><h2>Best sources</h2><p>Focus on lean proteins such as chicken, fish, eggs, Greek yogurt, and legumes. Protein supplements can help fill gaps when whole food intake falls short.</p>",
      coverImageUrl: "/assets/images/bg2.png",
      authorName: "James Chen",
      readTime: "4 min read",
      status: "published",
      isFeatured: false,
      publishedAt: new Date("2025-01-05"),
    },
    {
      slug: "telehealth-future-healthcare",
      title: "Why Telehealth Is the Future of Healthcare",
      excerpt: "Explore how telehealth is transforming access to healthcare, making quality treatment available from home.",
      content: "<h2>The telehealth revolution</h2><p>Telehealth has transformed from a niche service to a mainstream healthcare delivery method. Patients now have access to licensed clinicians without leaving their homes, breaking down barriers of distance, mobility, and time.</p><h2>Benefits for patients</h2><p>No waiting rooms, no travel time, and no scheduling conflicts. Telehealth appointments fit around your life, not the other way around. Prescription management, follow-ups, and consultations can all happen virtually.</p><h2>Quality of care</h2><p>Studies consistently show that telehealth delivers comparable outcomes to in-person visits for many conditions. The key is ensuring providers are properly licensed and following evidence-based protocols.</p>",
      coverImageUrl: "/assets/images/Form.jpg",
      authorName: "Amara Osei",
      readTime: "3 min read",
      status: "published",
      isFeatured: false,
      publishedAt: new Date("2024-12-20"),
    },
  ];

  for (const post of blogPosts) {
    await prisma.blogPost.create({
      data: { tenantId, categoryId: blogCat.id, ...post },
    });
  }

  // ── Job listings ──────────────────────────────────────────
  console.log("Creating job listings...");
  await prisma.jobListing.deleteMany({ where: { tenantId } });

  const jobs = [
    {
      title: "Clinical Pharmacist",
      department: "Clinical",
      location: "Remote (UK)",
      type: "full-time",
      description: "Join our clinical team to review and approve treatment plans for patients across the UK.",
      responsibilities: ["Review patient intake forms", "Approve prescriptions", "Liaise with medical director"],
      requirements: ["GPhC registered", "3+ years clinical experience", "Telehealth experience preferred"],
      status: "active",
      postedAt: new Date("2025-01-01"),
    },
    {
      title: "Frontend Developer",
      department: "Engineering",
      location: "Remote",
      type: "full-time",
      description: "Help us build beautiful, accessible healthcare interfaces that patients love.",
      responsibilities: ["Build responsive web interfaces", "Work with design team", "Implement accessibility standards"],
      requirements: ["3+ years React/TypeScript", "Healthcare industry experience a plus", "Strong CSS skills"],
      status: "active",
      postedAt: new Date("2025-01-10"),
    },
  ];

  for (const job of jobs) {
    await prisma.jobListing.create({ data: { tenantId, ...job } });
  }

  // ── Form definition (Patient Intake) ──────────────────────
  console.log("Creating patient intake form...");
  await prisma.formField.deleteMany({ where: { tenantId } });
  await prisma.formDefinition.deleteMany({ where: { tenantId } });

  const form = await prisma.formDefinition.create({
    data: {
      tenantId,
      name: "Patient Intake Form",
      slug: "patient-intake",
      description: "Complete this form to begin your treatment journey.",
      type: "intake",
      isMultiStep: true,
      submitButtonText: "Submit Application",
      successMessage: "Thank you! A member of our clinical team will review your submission within 48 hours.",
      redirectUrl: "/pages/thank-you.html",
      requiresPayment: false,
      status: "active",
    },
  });

  const formFields = [
    // Step 1: Personal Info
    { fieldKey: "firstName", fieldType: "text", label: "First Name", placeholder: "Enter your first name", stepNumber: 1, stepTitle: "Personal Information", sortOrder: 1, isRequired: true },
    { fieldKey: "lastName", fieldType: "text", label: "Last Name", placeholder: "Enter your last name", stepNumber: 1, stepTitle: "Personal Information", sortOrder: 2, isRequired: true },
    { fieldKey: "email", fieldType: "email", label: "Email Address", placeholder: "you@example.com", stepNumber: 1, stepTitle: "Personal Information", sortOrder: 3, isRequired: true },
    { fieldKey: "phone", fieldType: "tel", label: "Phone Number", placeholder: "+44 7xxx xxxxxx", stepNumber: 1, stepTitle: "Personal Information", sortOrder: 4, isRequired: true },
    { fieldKey: "dob", fieldType: "date", label: "Date of Birth", stepNumber: 1, stepTitle: "Personal Information", sortOrder: 5, isRequired: true },
    { fieldKey: "gender", fieldType: "select", label: "Gender", stepNumber: 1, stepTitle: "Personal Information", sortOrder: 6, isRequired: true, options: [{ label: "Male", value: "male" }, { label: "Female", value: "female" }, { label: "Other", value: "other" }, { label: "Prefer not to say", value: "undisclosed" }] },
    // Step 2: Medical History
    { fieldKey: "height", fieldType: "text", label: "Height (cm)", placeholder: "e.g. 175", stepNumber: 2, stepTitle: "Medical History", sortOrder: 1, isRequired: true },
    { fieldKey: "weight", fieldType: "text", label: "Current Weight (kg)", placeholder: "e.g. 85", stepNumber: 2, stepTitle: "Medical History", sortOrder: 2, isRequired: true },
    { fieldKey: "conditions", fieldType: "checkbox-group", label: "Do you have any of the following conditions?", stepNumber: 2, stepTitle: "Medical History", sortOrder: 3, isRequired: false, options: [{ label: "Type 2 Diabetes", value: "diabetes" }, { label: "High Blood Pressure", value: "hypertension" }, { label: "Thyroid Disorder", value: "thyroid" }, { label: "Heart Condition", value: "heart" }, { label: "None of the above", value: "none" }] },
    { fieldKey: "medications", fieldType: "textarea", label: "Current Medications", placeholder: "List any medications you are currently taking", stepNumber: 2, stepTitle: "Medical History", sortOrder: 4, isRequired: false },
    // Step 3: Treatment Goals
    { fieldKey: "goal", fieldType: "select", label: "Primary Goal", stepNumber: 3, stepTitle: "Treatment Goals", sortOrder: 1, isRequired: true, options: [{ label: "Weight Loss", value: "weight-loss" }, { label: "Metabolic Health", value: "metabolic" }, { label: "General Wellness", value: "wellness" }] },
    { fieldKey: "targetWeight", fieldType: "text", label: "Target Weight (kg)", placeholder: "e.g. 70", stepNumber: 3, stepTitle: "Treatment Goals", sortOrder: 2, isRequired: false },
    { fieldKey: "previousTreatments", fieldType: "textarea", label: "Previous Weight Loss Attempts", placeholder: "Describe any previous programs or treatments", stepNumber: 3, stepTitle: "Treatment Goals", sortOrder: 3, isRequired: false },
    // Step 4: Consent
    { fieldKey: "consent", fieldType: "checkbox", label: "I confirm the information provided is accurate and consent to treatment", stepNumber: 4, stepTitle: "Review & Consent", sortOrder: 1, isRequired: true },
    { fieldKey: "termsAccepted", fieldType: "checkbox", label: "I have read and agree to the Terms & Conditions and Privacy Policy", stepNumber: 4, stepTitle: "Review & Consent", sortOrder: 2, isRequired: true },
  ];

  for (const f of formFields) {
    await prisma.formField.create({
      data: { formDefinitionId: form.id, tenantId, ...f },
    });
  }

  console.log("\n\u2705 Demo content seeded successfully!");
  console.log("   - Site settings updated");
  console.log("   - 9 pages created");
  console.log("   - 6 home page sections (hero, intro, expert, markers, whatif, guide)");
  console.log("   - 24 navigation items");
  console.log("   - 4 social links");
  console.log("   - 3 product categories + 5 products");
  console.log("   - 8 videos");
  console.log("   - 5 FAQs");
  console.log("   - 8 testimonials");
  console.log("   - 3 team members");
  console.log("   - 3 blog posts");
  console.log("   - 2 job listings");
  console.log("   - 1 patient intake form (15 fields, 4 steps)");

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Seed failed:", err);
  prisma.$disconnect();
  process.exit(1);
});
