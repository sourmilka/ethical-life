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
  barterpayMerchantId?: string;
  createdAt: string;
}

export function PaymentSettingsPage() {
  const qc = useQueryClient();
  const [merchantId, setMerchantId] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [loaded, setLoaded] = useState(false);

  const { data: tenant } = useQuery({
    queryKey: ['tenant'],
    queryFn: () => api<{ data: Tenant }>('/settings/tenant').then((r) => r.data),
  });

  useEffect(() => {
    if (tenant && !loaded) {
      setMerchantId(tenant.barterpayMerchantId ?? '');
      setLoaded(true);
    }
  }, [tenant, loaded]);

  const saveMut = useMutation({
    mutationFn: () => api('/settings/tenant', {
      method: 'PATCH',
      body: {
        barterpayMerchantId: merchantId || null,
        barterpayApiKey: apiKey || null,
      },
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenant'] });
      toast.success('Payment settings saved');
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Payment Settings" description="BarterPay payment integration"
        actions={
          <button onClick={() => saveMut.mutate()}
            className="btn btn-primary inline-flex items-center gap-2">
            <Save className="w-4 h-4" /> Save
          </button>
        } />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* BarterPay credentials */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
          <h3 className="font-semibold text-gray-900">BarterPay Credentials</h3>
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Merchant ID</span>
            <input type="text" value={merchantId} onChange={(e) => setMerchantId(e.target.value)}
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-gray-700">API Key</span>
            <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter to update (not shown for security)"
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500" />
            <p className="text-xs text-gray-500 mt-1">Leave blank to keep existing key</p>
          </label>
        </div>

        {/* Tenant plan info */}
        {tenant && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-3">
            <h3 className="font-semibold text-gray-900">Account Info</h3>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-gray-500">Tenant Name</dt>
                <dd className="font-medium text-gray-900">{tenant.name}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Plan</dt>
                <dd><StatusBadge variant="info" label={tenant.plan} /></dd>
              </div>
              <div>
                <dt className="text-gray-500">Status</dt>
                <dd><StatusBadge variant={tenant.status === 'active' ? 'success' : 'warning'} label={tenant.status} /></dd>
              </div>
              <div>
                <dt className="text-gray-500">Created</dt>
                <dd className="text-gray-900">{format(new Date(tenant.createdAt), 'PPP')}</dd>
              </div>
            </dl>
          </div>
        )}
      </div>
    </div>
  );
}
