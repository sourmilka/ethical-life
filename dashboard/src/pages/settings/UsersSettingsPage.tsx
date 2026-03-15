import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { PageHeader, StatusBadge } from '@/components/ui';
import { Save } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  customDomain?: string;
  plan: string;
  status: string;
  createdAt: string;
}

export function UsersSettingsPage() {
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [loaded, setLoaded] = useState(false);

  const { data: tenant } = useQuery({
    queryKey: ['tenant'],
    queryFn: () => api<{ data: Tenant }>('/settings/tenant').then((r) => r.data),
  });

  useEffect(() => {
    if (tenant && !loaded) {
      setName(tenant.name);
      setLoaded(true);
    }
  }, [tenant, loaded]);

  const saveMut = useMutation({
    mutationFn: () => api('/settings/tenant', { method: 'PATCH', body: { name } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenant'] });
      toast.success('Account updated');
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Account Settings" description="Manage your account and domain"
        actions={
          <button onClick={() => saveMut.mutate()}
            className="btn btn-primary inline-flex items-center gap-2">
            <Save className="w-4 h-4" /> Save
          </button>
        } />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Account info */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
          <h3 className="font-semibold text-gray-900">Account</h3>
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Organization Name</span>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500" />
          </label>
          {tenant && (
            <dl className="space-y-2 text-sm pt-2 border-t border-gray-100">
              <div className="flex justify-between">
                <dt className="text-gray-500">Slug</dt>
                <dd className="font-mono text-gray-900">{tenant.slug}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Plan</dt>
                <dd><StatusBadge variant="info" label={tenant.plan} /></dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Status</dt>
                <dd><StatusBadge variant={tenant.status === 'active' ? 'success' : 'warning'} label={tenant.status} /></dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Created</dt>
                <dd className="text-gray-900">{format(new Date(tenant.createdAt), 'PPP')}</dd>
              </div>
            </dl>
          )}
        </div>

        {/* Domain */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
          <h3 className="font-semibold text-gray-900">Custom Domain</h3>
          {tenant?.customDomain ? (
            <div className="text-sm">
              <p className="text-gray-900 font-medium">{tenant.customDomain}</p>
              <p className="text-gray-500 mt-1">Your site is accessible at this domain.</p>
            </div>
          ) : (
            <div className="text-sm text-gray-500">
              <p>No custom domain configured.</p>
              <p className="mt-2">To set up a custom domain:</p>
              <ol className="list-decimal list-inside mt-2 space-y-1">
                <li>Add a CNAME record pointing to <code className="text-xs bg-gray-100 px-1 rounded">sites.barterpay.com</code></li>
                <li>Contact support to verify your domain</li>
              </ol>
            </div>
          )}
          {tenant && (
            <div className="pt-2 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                Default URL: <span className="font-mono">{tenant.slug}.barterpay.com</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
