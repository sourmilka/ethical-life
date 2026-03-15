import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { PageHeader, DataTable, StatusBadge, ConfirmDialog, type Column } from '@/components/ui';
import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

interface Job {
  id: string;
  title: string;
  department: string | null;
  location: string | null;
  type: string | null;
  status: string;
  postedAt: string;
  [key: string]: unknown;
}

const columns: Column<Job>[] = [
  { key: 'title', header: 'Title', sortable: true },
  { key: 'department', header: 'Department', render: (r) => r.department ?? '—' },
  { key: 'location', header: 'Location', render: (r) => r.location ?? '—' },
  { key: 'type', header: 'Type', render: (r) => r.type ?? '—' },
  {
    key: 'status',
    header: 'Status',
    render: (r) => (
      <StatusBadge
        label={r.status}
        variant={r.status === 'active' ? 'success' : r.status === 'closed' ? 'error' : 'warning'}
      />
    ),
  },
  {
    key: 'postedAt',
    header: 'Posted',
    render: (r) => format(new Date(r.postedAt), 'MMM d, yyyy'),
  },
];

export function CareersPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<Job | null>(null);

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => api<{ data: Job[] }>('/content/jobs').then((r) => r.data),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api(`/content/jobs/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.success('Job deleted');
      setDeleteTarget(null);
      qc.invalidateQueries({ queryKey: ['jobs'] });
    },
    onError: () => toast.error('Failed to delete'),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Careers"
        description="Manage job listings."
        actions={
          <button
            onClick={() => navigate('/dashboard/content/careers/new')}
            className="flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" /> Add Job
          </button>
        }
      />
      <DataTable
        columns={[
          ...columns,
          {
            key: '_actions',
            header: '',
            render: (row) => (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteTarget(row);
                }}
                className="text-gray-400 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            ),
          },
        ]}
        data={jobs}
        keyExtractor={(r) => r.id}
        searchable
        searchKeys={['title', 'department', 'location']}
        emptyTitle="No job listings"
        emptyDescription="Add your first job listing."
        onRowClick={(row) => navigate(`/dashboard/content/careers/${row.id}`)}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Job"
        message={`Delete "${deleteTarget?.title}"?`}
        variant="danger"
        onConfirm={() => { if (deleteTarget) deleteMut.mutate(deleteTarget.id); }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
