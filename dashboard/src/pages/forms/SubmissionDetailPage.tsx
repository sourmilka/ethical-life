import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Breadcrumb, PageHeader, StatusBadge, ConfirmDialog } from '@/components/ui';
import { Trash2, Printer } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface SubmissionData {
  id: string;
  fieldKey: string;
  fieldLabel?: string;
  value?: string;
}

interface Submission {
  id: string;
  status: string;
  source?: string;
  notes?: string;
  paymentStatus?: string;
  paymentAmount?: number;
  paidAt?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  updatedAt: string;
  formDefinition: { name: string; slug: string };
  product?: { id: string; title: string } | null;
  data: SubmissionData[];
}

const STATUS_OPTIONS = ['new', 'in_review', 'approved', 'completed', 'rejected'];
const statusColorMap: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  new: 'info', in_review: 'warning', approved: 'success', completed: 'success', rejected: 'error',
};

export function SubmissionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [showDelete, setShowDelete] = useState(false);
  const [notes, setNotes] = useState('');
  const [notesLoaded, setNotesLoaded] = useState(false);

  const { data: submission, isLoading } = useQuery({
    queryKey: ['submission', id],
    queryFn: () => api<{ data: Submission }>(`/submissions/${id}`).then((r) => {
      if (!notesLoaded) {
        setNotes(r.data.notes ?? '');
        setNotesLoaded(true);
      }
      return r.data;
    }),
  });

  const updateMut = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      api(`/submissions/${id}`, { method: 'PATCH', body }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['submission', id] });
      qc.invalidateQueries({ queryKey: ['submissions'] });
      toast.success('Submission updated');
    },
  });

  const deleteMut = useMutation({
    mutationFn: () => api(`/submissions/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['submissions'] });
      toast.success('Submission deleted');
      navigate('/dashboard/forms/submissions');
    },
  });

  if (isLoading || !submission) {
    return <div className="p-8 text-center text-gray-500">Loading…</div>;
  }

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: 'Submissions', to: '/dashboard/forms/submissions' },
        { label: `#${submission.id.slice(0, 8)}` },
      ]} />

      <PageHeader title={`Submission — ${submission.formDefinition.name}`}
        description={`Received ${format(new Date(submission.createdAt), 'MMM d, yyyy h:mm a')}`}
        actions={
          <div className="flex gap-2">
            <button onClick={() => window.print()}
              className="btn btn-secondary inline-flex items-center gap-2">
              <Printer className="w-4 h-4" /> Print
            </button>
            <button onClick={() => setShowDelete(true)}
              className="btn btn-secondary text-red-600 inline-flex items-center gap-2">
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          </div>
        } />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content — field values */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Form Responses</h3>
            {submission.data.length === 0 ? (
              <p className="text-gray-500 text-sm">No field data.</p>
            ) : (
              <dl className="space-y-4">
                {submission.data.map((d) => (
                  <div key={d.id}>
                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      {d.fieldLabel || d.fieldKey}
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                      {d.value || <span className="text-gray-400 italic">Empty</span>}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </div>

          {/* Internal notes */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="font-semibold text-gray-900 mb-3">Internal Notes</h3>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
              rows={4} placeholder="Add internal notes about this submission…"
              className="block w-full rounded-lg border-gray-300 shadow-sm text-sm focus:ring-blue-500 focus:border-blue-500" />
            <div className="mt-3 flex justify-end">
              <button onClick={() => updateMut.mutate({ notes })}
                className="btn btn-primary text-sm">Save Notes</button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
            <h3 className="font-semibold text-gray-900">Status</h3>
            <div className="flex items-center gap-2 mb-3">
              <StatusBadge variant={statusColorMap[submission.status] ?? 'default'}
                label={submission.status.replace('_', ' ')} />
            </div>
            <select value={submission.status}
              onChange={(e) => updateMut.mutate({ status: e.target.value })}
              className="block w-full rounded-lg border-gray-300 shadow-sm text-sm focus:ring-blue-500 focus:border-blue-500">
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s.replace('_', ' ')}</option>
              ))}
            </select>

            {/* Quick actions */}
            <div className="flex gap-2 pt-2">
              {submission.status !== 'approved' && (
                <button onClick={() => updateMut.mutate({ status: 'approved' })}
                  className="btn btn-primary text-sm flex-1">Approve</button>
              )}
              {submission.status !== 'rejected' && (
                <button onClick={() => updateMut.mutate({ status: 'rejected' })}
                  className="btn btn-secondary text-red-600 text-sm flex-1">Reject</button>
              )}
            </div>
          </div>

          {/* Meta info */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-3">
            <h3 className="font-semibold text-gray-900">Details</h3>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-gray-500">Form</dt>
                <dd className="font-medium text-gray-900">{submission.formDefinition.name}</dd>
              </div>
              {submission.source && (
                <div>
                  <dt className="text-gray-500">Source</dt>
                  <dd className="text-gray-900">{submission.source}</dd>
                </div>
              )}
              {submission.product && (
                <div>
                  <dt className="text-gray-500">Product</dt>
                  <dd className="text-gray-900">{submission.product.title}</dd>
                </div>
              )}
              <div>
                <dt className="text-gray-500">Submitted</dt>
                <dd className="text-gray-900">{format(new Date(submission.createdAt), 'PPpp')}</dd>
              </div>
              {submission.updatedAt !== submission.createdAt && (
                <div>
                  <dt className="text-gray-500">Last Updated</dt>
                  <dd className="text-gray-900">{format(new Date(submission.updatedAt), 'PPpp')}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Payment */}
          {submission.paymentStatus && (
            <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-3">
              <h3 className="font-semibold text-gray-900">Payment</h3>
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="text-gray-500">Status</dt>
                  <dd><StatusBadge
                    variant={submission.paymentStatus === 'paid' ? 'success' : 'warning'}
                    label={submission.paymentStatus} /></dd>
                </div>
                {submission.paymentAmount != null && (
                  <div>
                    <dt className="text-gray-500">Amount</dt>
                    <dd className="text-gray-900">${Number(submission.paymentAmount).toFixed(2)}</dd>
                  </div>
                )}
                {submission.paidAt && (
                  <div>
                    <dt className="text-gray-500">Paid At</dt>
                    <dd className="text-gray-900">{format(new Date(submission.paidAt), 'PPpp')}</dd>
                  </div>
                )}
              </dl>
            </div>
          )}

          {/* Device info */}
          {(submission.ipAddress || submission.userAgent) && (
            <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-3">
              <h3 className="font-semibold text-gray-900">Device Info</h3>
              <dl className="space-y-2 text-sm">
                {submission.ipAddress && (
                  <div>
                    <dt className="text-gray-500">IP Address</dt>
                    <dd className="text-gray-900 font-mono text-xs">{submission.ipAddress}</dd>
                  </div>
                )}
                {submission.userAgent && (
                  <div>
                    <dt className="text-gray-500">User Agent</dt>
                    <dd className="text-gray-900 text-xs break-all">{submission.userAgent}</dd>
                  </div>
                )}
              </dl>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog open={showDelete} onCancel={() => setShowDelete(false)}
        title="Delete Submission"
        message="Permanently delete this submission? This cannot be undone."
        onConfirm={() => deleteMut.mutate()}
        variant="danger" />
    </div>
  );
}
