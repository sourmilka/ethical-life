import { useState, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { PageHeader, ColorPicker, ImageField, TextField } from '@/components/ui';

interface SiteSettings {
  companyName: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  tagline: string | null;
  colorPrimary: string;
  colorAccent: string;
  colorSecondary: string;
  colorBackground: string;
  colorBorder: string;
  colorBorderLight: string;
  colorWhite: string;
  promoBannerText: string | null;
  promoBannerActive: boolean;
  [key: string]: unknown;
}

export function BrandingPage() {
  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api<{ data: SiteSettings }>('/settings').then((r) => r.data),
  });

  if (isLoading || !settings) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Branding"
        description="Customize your site's logo, colors, and promotional banner."
      />
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <BrandingSection settings={settings} />
          <ColorsSection settings={settings} />
          <PromoSection settings={settings} />
        </div>

        {/* Live preview */}
        <div className="hidden lg:block">
          <LivePreview settings={settings} />
        </div>
      </div>
    </div>
  );
}

// ── Branding section ──────────────────────────────────────

function BrandingSection({ settings }: { settings: SiteSettings }) {
  const [companyName, setCompanyName] = useState(settings.companyName);
  const [tagline, setTagline] = useState(settings.tagline ?? '');
  const [logoUrl, setLogoUrl] = useState(settings.logoUrl ?? '');
  const [faviconUrl, setFaviconUrl] = useState(settings.faviconUrl ?? '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setCompanyName(settings.companyName);
    setTagline(settings.tagline ?? '');
    setLogoUrl(settings.logoUrl ?? '');
    setFaviconUrl(settings.faviconUrl ?? '');
  }, [settings]);

  const save = useCallback(async () => {
    setSaving(true);
    try {
      await api('/settings/branding', {
        method: 'PATCH',
        body: JSON.stringify({
          companyName,
          tagline: tagline || null,
          logoUrl: logoUrl || null,
          faviconUrl: faviconUrl || null,
        }),
      });
      toast.success('Branding saved');
    } catch {
      toast.error('Failed to save branding');
    } finally {
      setSaving(false);
    }
  }, [companyName, tagline, logoUrl, faviconUrl]);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 space-y-4">
      <h3 className="text-sm font-semibold text-gray-900">Branding</h3>
      <TextField label="Company Name" value={companyName} onChange={setCompanyName} />
      <TextField label="Tagline" value={tagline} onChange={setTagline} placeholder="Short tagline" />
      <ImageField label="Logo" value={logoUrl} onChange={setLogoUrl} />
      <ImageField label="Favicon" value={faviconUrl} onChange={setFaviconUrl} />
      <div className="flex justify-end">
        <button
          onClick={save}
          disabled={saving}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save Branding'}
        </button>
      </div>
    </div>
  );
}

// ── Colors section ────────────────────────────────────────

function ColorsSection({ settings }: { settings: SiteSettings }) {
  const [colors, setColors] = useState({
    colorPrimary: settings.colorPrimary,
    colorAccent: settings.colorAccent,
    colorSecondary: settings.colorSecondary,
    colorBackground: settings.colorBackground,
    colorBorder: settings.colorBorder,
    colorBorderLight: settings.colorBorderLight,
    colorWhite: settings.colorWhite,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setColors({
      colorPrimary: settings.colorPrimary,
      colorAccent: settings.colorAccent,
      colorSecondary: settings.colorSecondary,
      colorBackground: settings.colorBackground,
      colorBorder: settings.colorBorder,
      colorBorderLight: settings.colorBorderLight,
      colorWhite: settings.colorWhite,
    });
  }, [settings]);

  const set = useCallback(
    (key: keyof typeof colors, value: string) =>
      setColors((prev) => ({ ...prev, [key]: value })),
    [],
  );

  const save = useCallback(async () => {
    setSaving(true);
    try {
      await api('/settings/colors', {
        method: 'PATCH',
        body: JSON.stringify(colors),
      });
      toast.success('Colors saved');
    } catch {
      toast.error('Failed to save colors');
    } finally {
      setSaving(false);
    }
  }, [colors]);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 space-y-4">
      <h3 className="text-sm font-semibold text-gray-900">Colors</h3>
      <div className="grid grid-cols-2 gap-3">
        <ColorPicker label="Primary" value={colors.colorPrimary} onChange={(v) => set('colorPrimary', v)} />
        <ColorPicker label="Accent" value={colors.colorAccent} onChange={(v) => set('colorAccent', v)} />
        <ColorPicker label="Secondary" value={colors.colorSecondary} onChange={(v) => set('colorSecondary', v)} />
        <ColorPicker label="Background" value={colors.colorBackground} onChange={(v) => set('colorBackground', v)} />
        <ColorPicker label="Border" value={colors.colorBorder} onChange={(v) => set('colorBorder', v)} />
        <ColorPicker label="Border Light" value={colors.colorBorderLight} onChange={(v) => set('colorBorderLight', v)} />
        <ColorPicker label="White" value={colors.colorWhite} onChange={(v) => set('colorWhite', v)} />
      </div>
      <div className="flex justify-end">
        <button
          onClick={save}
          disabled={saving}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save Colors'}
        </button>
      </div>
    </div>
  );
}

// ── Promo banner section ──────────────────────────────────

function PromoSection({ settings }: { settings: SiteSettings }) {
  const [text, setText] = useState(settings.promoBannerText ?? '');
  const [active, setActive] = useState(settings.promoBannerActive);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setText(settings.promoBannerText ?? '');
    setActive(settings.promoBannerActive);
  }, [settings]);

  const save = useCallback(async () => {
    setSaving(true);
    try {
      await api('/settings/promo', {
        method: 'PATCH',
        body: JSON.stringify({
          promoBannerText: text || null,
          promoBannerActive: active,
        }),
      });
      toast.success('Promo banner saved');
    } catch {
      toast.error('Failed to save promo settings');
    } finally {
      setSaving(false);
    }
  }, [text, active]);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Promo Banner</h3>
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300"
          />
          Active
        </label>
      </div>
      <TextField
        label="Banner Text"
        value={text}
        onChange={setText}
        placeholder="Special promotion message"
      />
      <div className="flex justify-end">
        <button
          onClick={save}
          disabled={saving}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save Promo'}
        </button>
      </div>
    </div>
  );
}

// ── Live preview ──────────────────────────────────────────

function LivePreview({ settings }: { settings: SiteSettings }) {
  return (
    <div className="sticky top-6 rounded-lg border border-gray-200 bg-white p-5">
      <h3 className="mb-4 text-sm font-semibold text-gray-900">Live Preview</h3>
      <div className="overflow-hidden rounded-md border border-gray-100">
        {/* Promo banner */}
        {settings.promoBannerActive && settings.promoBannerText && (
          <div
            className="px-4 py-2 text-center text-xs font-medium text-white"
            style={{ backgroundColor: settings.colorAccent }}
          >
            {settings.promoBannerText}
          </div>
        )}

        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ backgroundColor: settings.colorPrimary }}
        >
          <div className="flex items-center gap-2">
            {settings.logoUrl && (
              <img src={settings.logoUrl} alt="" className="h-6 w-auto" />
            )}
            <span className="text-sm font-semibold" style={{ color: settings.colorWhite }}>
              {settings.companyName}
            </span>
          </div>
          <div className="flex gap-3">
            {['Home', 'Products', 'About'].map((l) => (
              <span key={l} className="text-xs" style={{ color: settings.colorWhite, opacity: 0.8 }}>
                {l}
              </span>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="p-4 space-y-3" style={{ backgroundColor: settings.colorBackground }}>
          <div
            className="h-8 w-48 rounded"
            style={{ backgroundColor: settings.colorPrimary }}
          />
          <div className="h-3 w-64 rounded" style={{ backgroundColor: settings.colorBorder }} />
          <div className="h-3 w-56 rounded" style={{ backgroundColor: settings.colorBorder }} />
          <button
            className="rounded px-4 py-1.5 text-xs font-medium text-white"
            style={{ backgroundColor: settings.colorSecondary }}
          >
            Call to Action
          </button>
        </div>

        {/* Footer */}
        <div
          className="px-4 py-3"
          style={{ backgroundColor: settings.colorPrimary }}
        >
          <p className="text-xs" style={{ color: settings.colorWhite, opacity: 0.6 }}>
            {settings.tagline || 'Your tagline here'}
          </p>
        </div>
      </div>
    </div>
  );
}
