import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { PageHeader, DataTable, StatusBadge, ConfirmDialog, type Column } from '@/components/ui';
import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

interface Product {
  id: string;
  title: string;
  slug: string;
  priceText: string | null;
  priceAmount: string | null;
  imageUrl: string | null;
  isActive: boolean;
  isFeatured: boolean;
  category: { name: string } | null;
  [key: string]: unknown;
}

const columns: Column<Product>[] = [
  {
    key: 'imageUrl',
    header: 'Image',
    render: (row) =>
      row.imageUrl ? (
        <img src={row.imageUrl} alt="" className="h-10 w-10 rounded object-cover" />
      ) : (
        <div className="h-10 w-10 rounded bg-gray-100" />
      ),
  },
  { key: 'title', header: 'Title', sortable: true },
  {
    key: 'category',
    header: 'Category',
    render: (row) => row.category?.name ?? '—',
  },
  {
    key: 'priceText',
    header: 'Price',
    render: (row) => row.priceText ?? (row.priceAmount ? `£${row.priceAmount}` : '—'),
  },
  {
    key: 'isActive',
    header: 'Status',
    render: (row) => (
      <StatusBadge label={row.isActive ? 'Active' : 'Inactive'} variant={row.isActive ? 'success' : 'default'} />
    ),
  },
  {
    key: 'isFeatured',
    header: 'Featured',
    render: (row) => (row.isFeatured ? <StatusBadge label="Featured" variant="info" /> : '—'),
  },
];

export function ProductsPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => api<{ data: Product[] }>('/products').then((r) => r.data),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api(`/products/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.success('Product deleted');
      setDeleteTarget(null);
      qc.invalidateQueries({ queryKey: ['products'] });
    },
    onError: () => toast.error('Failed to delete product'),
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
        title="Products"
        description="Manage your product catalog."
        actions={
          <button
            onClick={() => navigate('/dashboard/content/products/new')}
            className="flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" /> Add Product
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
        data={products}
        keyExtractor={(r) => r.id}
        searchable
        searchKeys={['title', 'slug']}
        emptyTitle="No products"
        emptyDescription="Add your first product to get started."
        onRowClick={(row) => navigate(`/dashboard/content/products/${row.id}`)}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Product"
        message={`Delete "${deleteTarget?.title}"? This cannot be undone.`}
        variant="danger"
        onConfirm={() => { if (deleteTarget) deleteMut.mutate(deleteTarget.id); }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
