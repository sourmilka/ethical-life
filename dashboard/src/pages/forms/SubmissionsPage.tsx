import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { PageHeader, StatusBadge } from '@/components/ui';
import { Inbox, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

interface Submission {
  id: string;
  status: string;
  source?: string;
  paymentStatus?: string;
  createdAt: string;
  formDefinition: { name: string; slug: string };
  product?: { id: string; title: string } | null;
}

interface FormOption {
  id: string;
  name: string;
}

const STATUS_OPTIONS = ['new', 'in_review', 'approved', 'completed', 'rejected'];

const statusColorMap: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  new: 'info',
  in_review: 'warning',
  approved: 'success',
  completed: 'success',
  rejected: 'error',
};

export function SubmissionsPage() {
  const navigate = useNavigate();
  const [formId, setFormId] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const limit = 25;

  const { data: forms = [] } = useQuery({
    queryKey: ['forms-list'],
    queryFn: () => api<{ data: FormOption[] }>('/forms').then((r) => r.data),
  });

  const queryParams = new URLSearchParams();
  queryParams.set('page', String(page));
  queryParams.set('limit', String(limit));
  if (formId) queryParams.set('formId', formId);
  if (status) queryParams.set('status', status);

  const { data, isLoading } = useQuery({
    queryKey: ['submissions', page, formId, status],
    queryFn: () =>
      api<{ data: Submission[]; meta: { total: number; page: number; limit: number } }>(
        `/submissions?${queryParams.toString()}`
      ),
  });

  const submissions = data?.data ?? [];
  const total = data?.meta?.total ?? 0;
  const totalPages = Math.ceil(total / limit);

  async function handleExport() {
    try {
      const params = new URLSearchParams();
      if (formId) params.set('formId', formId);
      if (status) params.set('status', status);
      const res = await api<{ data: Submission[] }>(`/submissions?${params.toString()}&limit=10000`);
      const rows = res.data;
      if (!rows.length) return;

      const csvRows = [
        ['ID', 'Form', 'Status', 'Source', 'Payment Status', 'Date'].join(','),
        ...rows.map((r) =>
          [r.id, r.formDefinition.name, r.status, r.source ?? '', r.paymentStatus ?? '', r.createdAt].join(',')
        ),
      ];
      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `submissions-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // silently fail
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Submissions" description={`${total} total submissions`}
        actions={
          <button onClick={handleExport} className="btn btn-secondary inline-flex items-center gap-2">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        } />

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select value={formId} onChange={(e) => { setFormId(e.target.value); setPage(1); }}
          className="rounded-lg border-gray-300 shadow-sm text-sm focus:ring-blue-500 focus:border-blue-500">
          <option value="">All Forms</option>
          {forms.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="rounded-lg border-gray-300 shadow-sm text-sm focus:ring-blue-500 focus:border-blue-500">
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s.replace('_', ' ')}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Loading…</div>
      ) : submissions.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Inbox className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-lg font-medium">No submissions found</p>
          <p className="text-sm">Adjust your filters or wait for new submissions.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Form</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {submissions.map((s, i) => (
                <tr key={s.id} onClick={() => navigate(`/dashboard/forms/submissions/${s.id}`)}
                  className="hover:bg-gray-50 cursor-pointer">
                  <td className="px-4 py-3 text-sm text-gray-500">{(page - 1) * limit + i + 1}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{s.formDefinition.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{s.source ?? '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{s.product?.title ?? '—'}</td>
                  <td className="px-4 py-3">
                    <StatusBadge variant={statusColorMap[s.status] ?? 'default'} label={s.status.replace('_', ' ')} />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {format(new Date(s.createdAt), 'MMM d, yyyy h:mm a')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t border-gray-200">
              <span className="text-sm text-gray-600">
                Page {page} of {totalPages} ({total} results)
              </span>
              <div className="flex gap-1">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
                  className="p-1 rounded text-gray-500 hover:text-gray-900 disabled:opacity-30">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                  className="p-1 rounded text-gray-500 hover:text-gray-900 disabled:opacity-30">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
