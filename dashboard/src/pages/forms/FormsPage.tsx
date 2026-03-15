import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { PageHeader, DataTable, StatusBadge, ConfirmDialog, type Column } from '@/components/ui';
import { Plus, Copy, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface FormDef {
  id: string;
  name: string;
  slug: string;
  type: string;
  status: string;
  isMultiStep: boolean;
  requiresPayment: boolean;
  createdAt: string;
  _count: { fields: number; submissions: number };
}

export function FormsPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<FormDef | null>(null);

  const { data: forms = [] } = useQuery({
    queryKey: ['forms'],
    queryFn: () => api<{ data: FormDef[] }>('/forms').then((r) => r.data),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api(`/forms/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['forms'] });
      toast.success('Form deleted');
      setDeleteTarget(null);
    },
  });

  const duplicateMut = useMutation({
    mutationFn: (id: string) => api(`/forms/${id}/duplicate`, { method: 'POST' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['forms'] });
      toast.success('Form duplicated');
    },
  });

  const columns: Column<FormDef>[] = [
    { key: 'name', header: 'Name', render: (r) => (
      <div>
        <div className="font-medium text-gray-900">{r.name}</div>
        <div className="text-xs text-gray-500">/{r.slug}</div>
      </div>
    )},
    { key: 'type', header: 'Type', render: (r) => (
      <span className="capitalize">{r.type}</span>
    )},
    { key: 'fields', header: 'Fields', render: (r) => r._count.fields },
    { key: 'submissions', header: 'Submissions', render: (r) => r._count.submissions },
    { key: 'isMultiStep', header: 'Multi-step', render: (r) => r.isMultiStep ? 'Yes' : 'No' },
    { key: 'requiresPayment', header: 'Payment', render: (r) => r.requiresPayment ? (
      <StatusBadge variant="success" label="Required" />
    ) : <span className="text-gray-400">—</span> },
    { key: 'status', header: 'Status', render: (r) => (
      <StatusBadge variant={r.status === 'active' ? 'success' : 'default'} label={r.status} />
    )},
    { key: 'actions', header: '', render: (r) => (
      <div className="flex gap-1">
        <button onClick={(e) => { e.stopPropagation(); duplicateMut.mutate(r.id); }}
          className="p-1 text-gray-400 hover:text-blue-600" title="Duplicate">
          <Copy className="w-4 h-4" />
        </button>
        <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(r); }}
          className="p-1 text-gray-400 hover:text-red-600" title="Delete">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Forms" description="Manage form definitions and their fields"
        actions={
          <button onClick={() => navigate('/dashboard/forms/builder/new')}
            className="btn btn-primary inline-flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Form
          </button>
        } />

      <DataTable columns={columns} data={forms as (FormDef & Record<string, unknown>)[]}
        keyExtractor={(r) => r.id}
        onRowClick={(r) => navigate(`/dashboard/forms/builder/${r.id}`)}
        emptyTitle="No forms yet" emptyDescription="Create your first form to get started." />

      <ConfirmDialog open={!!deleteTarget} onCancel={() => setDeleteTarget(null)}
        title="Delete Form"
        message={`Delete "${deleteTarget?.name}"? This will also remove all fields and submissions.`}
        onConfirm={() => { if (deleteTarget) deleteMut.mutate(deleteTarget.id); }}
        variant="danger" />
    </div>
  );
}
