import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { PageHeader, DataTable, StatusBadge, ConfirmDialog, type Column } from '@/components/ui';
import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  coverImageUrl: string | null;
  authorName: string | null;
  status: string;
  isFeatured: boolean;
  publishedAt: string | null;
  category: { name: string } | null;
  [key: string]: unknown;
}

const columns: Column<BlogPost>[] = [
  {
    key: 'coverImageUrl',
    header: 'Image',
    render: (row) =>
      row.coverImageUrl ? (
        <img src={row.coverImageUrl} alt="" className="h-10 w-14 rounded object-cover" />
      ) : (
        <div className="h-10 w-14 rounded bg-gray-100" />
      ),
  },
  { key: 'title', header: 'Title', sortable: true },
  {
    key: 'category',
    header: 'Category',
    render: (row) => row.category?.name ?? '—',
  },
  {
    key: 'authorName',
    header: 'Author',
    render: (row) => row.authorName ?? '—',
  },
  {
    key: 'status',
    header: 'Status',
    render: (row) => (
      <StatusBadge
        label={row.status}
        variant={row.status === 'published' ? 'success' : row.status === 'draft' ? 'warning' : 'default'}
      />
    ),
  },
  {
    key: 'publishedAt',
    header: 'Published',
    render: (row) => (row.publishedAt ? format(new Date(row.publishedAt), 'MMM d, yyyy') : '—'),
  },
];

export function BlogPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<BlogPost | null>(null);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['blog'],
    queryFn: () => api<{ data: BlogPost[] }>('/blog').then((r) => r.data),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api(`/blog/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.success('Post deleted');
      setDeleteTarget(null);
      qc.invalidateQueries({ queryKey: ['blog'] });
    },
    onError: () => toast.error('Failed to delete post'),
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
        title="Blog"
        description="Manage blog posts."
        actions={
          <button
            onClick={() => navigate('/dashboard/content/blog/new')}
            className="flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" /> New Post
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
        data={posts}
        keyExtractor={(r) => r.id}
        searchable
        searchKeys={['title', 'authorName']}
        emptyTitle="No blog posts"
        emptyDescription="Write your first blog post."
        onRowClick={(row) => navigate(`/dashboard/content/blog/${row.id}`)}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Post"
        message={`Delete "${deleteTarget?.title}"? This cannot be undone.`}
        variant="danger"
        onConfirm={() => { if (deleteTarget) deleteMut.mutate(deleteTarget.id); }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
