import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Loader2 } from 'lucide-react';

// Lazy-loaded pages for code splitting
const LoginPage = lazy(() => import('@/pages/LoginPage').then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('@/pages/RegisterPage').then(m => ({ default: m.RegisterPage })));
const OverviewPage = lazy(() => import('@/pages/OverviewPage').then(m => ({ default: m.OverviewPage })));
const PreviewPage = lazy(() => import('@/pages/PreviewPage').then(m => ({ default: m.PreviewPage })));

// Website
const PagesPage = lazy(() => import('@/pages/website/PagesPage').then(m => ({ default: m.PagesPage })));
const PageEditorPage = lazy(() => import('@/pages/website/PageEditorPage').then(m => ({ default: m.PageEditorPage })));
const NavigationPage = lazy(() => import('@/pages/website/NavigationPage').then(m => ({ default: m.NavigationPage })));
const BrandingPage = lazy(() => import('@/pages/website/BrandingPage').then(m => ({ default: m.BrandingPage })));

// Content
const ProductsPage = lazy(() => import('@/pages/content/ProductsPage').then(m => ({ default: m.ProductsPage })));
const ProductEditorPage = lazy(() => import('@/pages/content/ProductEditorPage').then(m => ({ default: m.ProductEditorPage })));
const BlogPage = lazy(() => import('@/pages/content/BlogPage').then(m => ({ default: m.BlogPage })));
const BlogEditorPage = lazy(() => import('@/pages/content/BlogEditorPage').then(m => ({ default: m.BlogEditorPage })));
const TestimonialsPage = lazy(() => import('@/pages/content/TestimonialsPage').then(m => ({ default: m.TestimonialsPage })));
const FAQPage = lazy(() => import('@/pages/content/FAQPage').then(m => ({ default: m.FAQPage })));
const TeamPage = lazy(() => import('@/pages/content/TeamPage').then(m => ({ default: m.TeamPage })));
const CareersPage = lazy(() => import('@/pages/content/CareersPage').then(m => ({ default: m.CareersPage })));
const CareerEditorPage = lazy(() => import('@/pages/content/CareerEditorPage').then(m => ({ default: m.CareerEditorPage })));
const VideosPage = lazy(() => import('@/pages/content/VideosPage').then(m => ({ default: m.VideosPage })));

// Forms
const FormsPage = lazy(() => import('@/pages/forms/FormsPage').then(m => ({ default: m.FormsPage })));
const FormBuilderPage = lazy(() => import('@/pages/forms/FormBuilderPage').then(m => ({ default: m.FormBuilderPage })));
const SubmissionsPage = lazy(() => import('@/pages/forms/SubmissionsPage').then(m => ({ default: m.SubmissionsPage })));
const SubmissionDetailPage = lazy(() => import('@/pages/forms/SubmissionDetailPage').then(m => ({ default: m.SubmissionDetailPage })));

// Media
const MediaLibraryPage = lazy(() => import('@/pages/media/MediaLibraryPage').then(m => ({ default: m.MediaLibraryPage })));

// Settings
const ContactSettingsPage = lazy(() => import('@/pages/settings/ContactSettingsPage').then(m => ({ default: m.ContactSettingsPage })));
const SeoSettingsPage = lazy(() => import('@/pages/settings/SeoSettingsPage').then(m => ({ default: m.SeoSettingsPage })));
const UsersSettingsPage = lazy(() => import('@/pages/settings/UsersSettingsPage').then(m => ({ default: m.UsersSettingsPage })));
const PaymentSettingsPage = lazy(() => import('@/pages/settings/PaymentSettingsPage').then(m => ({ default: m.PaymentSettingsPage })));
const LegalSettingsPage = lazy(() => import('@/pages/settings/LegalSettingsPage').then(m => ({ default: m.LegalSettingsPage })));
const OnboardingPage = lazy(() => import('@/pages/OnboardingPage').then(m => ({ default: m.OnboardingPage })));

function PageFallback() {
  return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
      {/* Redirect root to dashboard */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Public auth routes */}
      <Route path="/dashboard/login" element={<LoginPage />} />
      <Route path="/dashboard/register" element={<RegisterPage />} />

      {/* Protected dashboard routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard/onboarding" element={<OnboardingPage />} />
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<OverviewPage />} />

          {/* Website */}
          <Route path="website/pages" element={<PagesPage />} />
          <Route path="website/pages/:slug" element={<PageEditorPage />} />
          <Route path="website/navigation" element={<NavigationPage />} />
          <Route path="website/branding" element={<BrandingPage />} />

          {/* Content */}
          <Route path="content/products" element={<ProductsPage />} />
          <Route path="content/products/:id" element={<ProductEditorPage />} />
          <Route path="content/blog" element={<BlogPage />} />
          <Route path="content/blog/:id" element={<BlogEditorPage />} />
          <Route path="content/faq" element={<FAQPage />} />
          <Route path="content/team" element={<TeamPage />} />
          <Route path="content/careers" element={<CareersPage />} />
          <Route path="content/careers/:id" element={<CareerEditorPage />} />
          <Route path="content/testimonials" element={<TestimonialsPage />} />
          <Route path="content/videos" element={<VideosPage />} />

          {/* Forms */}
          <Route path="forms" element={<FormsPage />} />
          <Route path="forms/builder/:id" element={<FormBuilderPage />} />
          <Route path="forms/submissions" element={<SubmissionsPage />} />
          <Route path="forms/submissions/:id" element={<SubmissionDetailPage />} />

          {/* Media */}
          <Route path="media" element={<MediaLibraryPage />} />

          {/* Settings */}
          <Route path="settings/branding" element={<BrandingPage />} />
          <Route path="settings/contact" element={<ContactSettingsPage />} />
          <Route path="settings/seo" element={<SeoSettingsPage />} />
          <Route path="settings/users" element={<UsersSettingsPage />} />
          <Route path="settings/payment" element={<PaymentSettingsPage />} />
          <Route path="settings/legal" element={<LegalSettingsPage />} />

          {/* Preview */}
          <Route path="preview" element={<PreviewPage />} />
        </Route>
      </Route>
    </Routes>
    </Suspense>
  );
}
