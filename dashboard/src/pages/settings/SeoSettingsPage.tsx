import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/ui';
import { Save } from 'lucide-react';
import { toast } from 'sonner';

interface Settings {
  metaTitle?: string;
  metaDescription?: string;
  ogImageUrl?: string;
  googleAnalyticsId?: string;
}

export function SeoSettingsPage() {
  const qc = useQueryClient();
  const [form, setForm] = useState<Settings>({});
  const [loaded, setLoaded] = useState(false);

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api<{ data: Settings }>('/settings').then((r) => r.data),
  });

  useEffect(() => {
    if (settings && !loaded) {
      setForm({
        metaTitle: settings.metaTitle ?? '',
        metaDescription: settings.metaDescription ?? '',
        ogImageUrl: settings.ogImageUrl ?? '',
        googleAnalyticsId: settings.googleAnalyticsId ?? '',
      });
      setLoaded(true);
    }
  }, [settings, loaded]);

  const saveMut = useMutation({
    mutationFn: () => api('/settings/seo', {
      method: 'PATCH',
      body: {
        metaTitle: form.metaTitle || null,
        metaDescription: form.metaDescription || null,
        ogImageUrl: form.ogImageUrl || null,
        googleAnalyticsId: form.googleAnalyticsId || null,
      },
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings'] });
      toast.success('SEO settings saved');
    },
  });

  const upd = (patch: Partial<Settings>) => setForm((f) => ({ ...f, ...patch }));

  return (
    <div className="space-y-6">
      <PageHeader title="SEO Settings" description="Search engine optimization and analytics"
        actions={
          <button onClick={() => saveMut.mutate()}
            className="btn btn-primary inline-flex items-center gap-2">
            <Save className="w-4 h-4" /> Save
          </button>
        } />

      <div className="max-w-2xl bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Meta Title</span>
          <input type="text" value={form.metaTitle ?? ''} onChange={(e) => upd({ metaTitle: e.target.value })}
            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500" />
          <p className="text-xs text-gray-500 mt-1">Shown in browser tabs and search results</p>
        </label>
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Meta Description</span>
          <textarea value={form.metaDescription ?? ''} onChange={(e) => upd({ metaDescription: e.target.value })}
            rows={3} className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500" />
          <p className="text-xs text-gray-500 mt-1">Appears below the title in search results</p>
        </label>
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Open Graph Image URL</span>
          <input type="url" value={form.ogImageUrl ?? ''} onChange={(e) => upd({ ogImageUrl: e.target.value })}
            placeholder="https://..."
            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500" />
          <p className="text-xs text-gray-500 mt-1">Image shown when sharing on social media (1200x630 recommended)</p>
        </label>
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Google Analytics ID</span>
          <input type="text" value={form.googleAnalyticsId ?? ''} onChange={(e) => upd({ googleAnalyticsId: e.target.value })}
            placeholder="G-XXXXXXXXXX"
            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500" />
        </label>
      </div>
    </div>
  );
}
