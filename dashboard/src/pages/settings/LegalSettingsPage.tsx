import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { PageHeader, RichTextEditor } from '@/components/ui';
import { Save } from 'lucide-react';
import { toast } from 'sonner';

interface Settings {
  termsContent?: string;
  privacyContent?: string;
}

type Tab = 'terms' | 'privacy';

export function LegalSettingsPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>('terms');
  const [terms, setTerms] = useState('');
  const [privacy, setPrivacy] = useState('');
  const [loaded, setLoaded] = useState(false);

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api<{ data: Settings }>('/settings').then((r) => r.data),
  });

  useEffect(() => {
    if (settings && !loaded) {
      setTerms(settings.termsContent ?? '');
      setPrivacy(settings.privacyContent ?? '');
      setLoaded(true);
    }
  }, [settings, loaded]);

  const saveMut = useMutation({
    mutationFn: () => api('/settings/legal', {
      method: 'PATCH',
      body: {
        termsContent: terms || null,
        privacyContent: privacy || null,
      },
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Legal content saved');
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Legal Pages" description="Terms of Service and Privacy Policy"
        actions={
          <button onClick={() => saveMut.mutate()}
            className="btn btn-primary inline-flex items-center gap-2">
            <Save className="w-4 h-4" /> Save
          </button>
        } />

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6">
          {([
            { id: 'terms' as Tab, label: 'Terms of Service' },
            { id: 'privacy' as Tab, label: 'Privacy Policy' },
          ]).map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`py-3 border-b-2 text-sm font-medium transition
                ${tab === t.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        {tab === 'terms' ? (
          <RichTextEditor content={terms} onChange={setTerms} />
        ) : (
          <RichTextEditor content={privacy} onChange={setPrivacy} />
        )}
      </div>
    </div>
  );
}
