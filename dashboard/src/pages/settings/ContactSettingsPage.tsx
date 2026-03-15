import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/ui';
import { Save } from 'lucide-react';
import { toast } from 'sonner';

interface Settings {
  contactEmail?: string;
  contactPhone?: string;
  contactAddress?: string;
  businessHours?: string;
}

export function ContactSettingsPage() {
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
        contactEmail: settings.contactEmail ?? '',
        contactPhone: settings.contactPhone ?? '',
        contactAddress: settings.contactAddress ?? '',
        businessHours: settings.businessHours ?? '',
      });
      setLoaded(true);
    }
  }, [settings, loaded]);

  const saveMut = useMutation({
    mutationFn: () => api('/settings/contact', {
      method: 'PATCH',
      body: {
        contactEmail: form.contactEmail || null,
        contactPhone: form.contactPhone || null,
        contactAddress: form.contactAddress || null,
        businessHours: form.businessHours || null,
      },
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Contact info saved');
    },
  });

  const upd = (patch: Partial<Settings>) => setForm((f) => ({ ...f, ...patch }));

  return (
    <div className="space-y-6">
      <PageHeader title="Contact Settings" description="Business contact information"
        actions={
          <button onClick={() => saveMut.mutate()}
            className="btn btn-primary inline-flex items-center gap-2">
            <Save className="w-4 h-4" /> Save
          </button>
        } />

      <div className="max-w-2xl bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Email</span>
          <input type="email" value={form.contactEmail ?? ''} onChange={(e) => upd({ contactEmail: e.target.value })}
            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500" />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Phone</span>
          <input type="tel" value={form.contactPhone ?? ''} onChange={(e) => upd({ contactPhone: e.target.value })}
            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500" />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Address</span>
          <textarea value={form.contactAddress ?? ''} onChange={(e) => upd({ contactAddress: e.target.value })}
            rows={3} className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500" />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Business Hours</span>
          <input type="text" value={form.businessHours ?? ''} onChange={(e) => upd({ businessHours: e.target.value })}
            placeholder="e.g. Mon-Fri 9am-5pm"
            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500" />
        </label>
      </div>
    </div>
  );
}
