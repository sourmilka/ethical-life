import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import {
  Building2,
  Palette,
  Mail,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import clsx from 'clsx';

const STEPS = [
  { label: 'Business', icon: Building2 },
  { label: 'Branding', icon: Palette },
  { label: 'Contact', icon: Mail },
  { label: 'Done', icon: CheckCircle2 },
] as const;

const ONBOARDING_KEY = 'onboarding_completed';

export function isOnboardingCompleted(tenantId: string): boolean {
  try {
    const data = JSON.parse(localStorage.getItem(ONBOARDING_KEY) || '{}');
    return !!data[tenantId];
  } catch {
    return false;
  }
}

function markOnboardingCompleted(tenantId: string) {
  try {
    const data = JSON.parse(localStorage.getItem(ONBOARDING_KEY) || '{}');
    data[tenantId] = true;
    localStorage.setItem(ONBOARDING_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage errors
  }
}

export function OnboardingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Form state
  const [businessName, setBusinessName] = useState(user?.tenant?.name || '');
  const [tagline, setTagline] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#4f46e5');
  const [contactEmail, setContactEmail] = useState(user?.email || '');
  const [contactPhone, setContactPhone] = useState('');
  const [contactAddress, setContactAddress] = useState('');

  async function handleNext() {
    if (step === 0) {
      if (!businessName.trim()) {
        toast.error('Business name is required');
        return;
      }
      setSaving(true);
      try {
        await api('/settings/branding', {
          method: 'PATCH',
          body: { companyName: businessName, tagline: tagline || null },
        });
        setStep(1);
      } catch {
        toast.error('Failed to save business name');
      } finally {
        setSaving(false);
      }
    } else if (step === 1) {
      setSaving(true);
      try {
        const updates: Record<string, string | null> = { colorPrimary: primaryColor };
        await api('/settings/colors', { method: 'PATCH', body: updates });
        if (logoUrl.trim()) {
          await api('/settings/branding', { method: 'PATCH', body: { logoUrl } });
        }
        setStep(2);
      } catch {
        toast.error('Failed to save branding');
      } finally {
        setSaving(false);
      }
    } else if (step === 2) {
      setSaving(true);
      try {
        await api('/settings/contact', {
          method: 'PATCH',
          body: {
            contactEmail: contactEmail || null,
            contactPhone: contactPhone || null,
            contactAddress: contactAddress || null,
          },
        });
        setStep(3);
      } catch {
        toast.error('Failed to save contact info');
      } finally {
        setSaving(false);
      }
    }
  }

  function handleFinish() {
    if (user?.tenant?.id) {
      markOnboardingCompleted(user.tenant.id);
    }
    navigate('/dashboard');
  }

  function handleSkip() {
    if (user?.tenant?.id) {
      markOnboardingCompleted(user.tenant.id);
    }
    navigate('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Step indicators */}
        <div className="bg-indigo-600 px-8 py-6">
          <div className="flex items-center justify-between">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="flex items-center">
                  <div
                    className={clsx(
                      'flex items-center gap-2',
                      i <= step ? 'text-white' : 'text-indigo-300',
                    )}
                  >
                    <div
                      className={clsx(
                        'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                        i < step
                          ? 'bg-indigo-400'
                          : i === step
                            ? 'bg-white text-indigo-600'
                            : 'bg-indigo-500',
                      )}
                    >
                      {i < step ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                    </div>
                    <span className="hidden sm:inline text-sm font-medium">{s.label}</span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div
                      className={clsx(
                        'w-12 h-0.5 mx-2',
                        i < step ? 'bg-indigo-400' : 'bg-indigo-500',
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {step === 0 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Welcome to BarterPay!</h2>
                <p className="mt-1 text-gray-500">Let's set up your website. What's your business called?</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Business Name *
                  </label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    placeholder="My Awesome Business"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tagline
                  </label>
                  <input
                    type="text"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    placeholder="Your catchy slogan"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Brand your site</h2>
                <p className="mt-1 text-gray-500">Choose your primary color and add a logo.</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Primary Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="h-10 w-14 rounded border border-gray-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-32 rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono"
                      placeholder="#4f46e5"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Logo URL
                  </label>
                  <input
                    type="url"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    placeholder="https://example.com/logo.png"
                  />
                  <p className="mt-1 text-xs text-gray-400">
                    Upload your logo in the Media Library later, or paste a URL now.
                  </p>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Contact information</h2>
                <p className="mt-1 text-gray-500">How can customers reach you?</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    placeholder="hello@mybusiness.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <textarea
                    value={contactAddress}
                    onChange={(e) => setContactAddress(e.target.value)}
                    rows={2}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    placeholder="123 Main St, City, State, ZIP"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="text-center space-y-4 py-8">
              <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">You're all set!</h2>
              <p className="text-gray-500 max-w-md mx-auto">
                Your site is ready to go. You can always update these settings later from the dashboard.
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-8 py-4 bg-gray-50 flex items-center justify-between border-t">
          <div>
            {step > 0 && step < 3 && (
              <button
                onClick={() => setStep(step - 1)}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
              >
                <ChevronLeft className="h-4 w-4" /> Back
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            {step < 3 && (
              <button
                onClick={handleSkip}
                className="text-sm text-gray-400 hover:text-gray-600"
              >
                Skip for now
              </button>
            )}
            {step < 3 ? (
              <button
                onClick={handleNext}
                disabled={saving}
                className="flex items-center gap-1 px-5 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Next'}
                {!saving && <ChevronRight className="h-4 w-4" />}
              </button>
            ) : (
              <button
                onClick={handleFinish}
                className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-500"
              >
                Go to Dashboard
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
