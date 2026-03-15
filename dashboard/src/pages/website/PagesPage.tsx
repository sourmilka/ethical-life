import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { api } from '@/lib/api';
import { PageHeader, DataTable, StatusBadge, type Column } from '@/components/ui';

interface Page {
  id: string;
  title: string;
  slug: string;
  status: string;
  updatedAt: string;
  _count?: { sections: number };
  [key: string]: unknown;
}

const columns: Column<Page>[] = [
  { key: 'title', header: 'Page Name', sortable: true },
  { key: 'slug', header: 'Slug', sortable: true },
  {
    key: '_count',
    header: 'Sections',
    render: (row) => (row._count?.sections ?? 0).toString(),
  },
  {
    key: 'status',
    header: 'Status',
    render: (row) => (
      <StatusBadge
        label={row.status}
        variant={row.status === 'active' ? 'success' : 'default'}
      />
    ),
  },
];

export function PagesPage() {
  const navigate = useNavigate();
  const { data: pages = [], isLoading } = useQuery({
    queryKey: ['pages'],
    queryFn: () => api<{ data: Page[] }>('/pages').then((r) => r.data),
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
      <PageHeader title="Pages" description="Edit page content and sections." />
      <DataTable
        columns={columns}
        data={pages}
        keyExtractor={(r) => r.id}
        searchable
        searchKeys={['title', 'slug']}
        emptyTitle="No pages"
        emptyDescription="Pages will appear here once your site has content."
        onRowClick={(row) => navigate(`/dashboard/website/pages/${row.slug}`)}
      />
    </div>
  );
}
