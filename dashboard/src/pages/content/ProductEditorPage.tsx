import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { PageHeader, Breadcrumb, TextField, ImageField, Field } from '@/components/ui';

interface Product {
  id: string;
  title: string;
  slug: string;
  tagline: string | null;
  description: string | null;
  priceText: string | null;
  priceAmount: string | null;
  currency: string;
  imageUrl: string | null;
  tag: string | null;
  features: string[];
  howItWorks: string | null;
  isActive: boolean;
  isFeatured: boolean;
  categoryId: string | null;
}

interface Category {
  id: string;
  name: string;
}

export function ProductEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === 'new';

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => api<{ data: Product }>(`/products/${id}`).then((r) => r.data),
    enabled: !isNew,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['product-categories'],
    queryFn: () => api<{ data: Category[] }>('/products/categories').then((r) => r.data),
  });

  const [form, setForm] = useState<Partial<Product>>({
    title: '',
    slug: '',
    tagline: '',
    description: '',
    priceText: '',
    priceAmount: '',
    currency: 'GBP',
    imageUrl: '',
    tag: '',
    features: [],
    howItWorks: '',
    isActive: true,
    isFeatured: false,
    categoryId: null,
  });

  useEffect(() => {
    if (product) {
      setForm({
        title: product.title,
        slug: product.slug,
        tagline: product.tagline ?? '',
        description: product.description ?? '',
        priceText: product.priceText ?? '',
        priceAmount: product.priceAmount ?? '',
        currency: product.currency,
        imageUrl: product.imageUrl ?? '',
        tag: product.tag ?? '',
        features: product.features ?? [],
        howItWorks: product.howItWorks ?? '',
        isActive: product.isActive,
        isFeatured: product.isFeatured,
        categoryId: product.categoryId,
      });
    }
  }, [product]);

  const set = useCallback(
    <K extends keyof Product>(key: K, value: Product[K]) =>
      setForm((prev) => ({ ...prev, [key]: value })),
    [],
  );

  const [saving, setSaving] = useState(false);

  const save = useCallback(async () => {
    if (!form.title?.trim()) {
      toast.error('Title is required');
      return;
    }
    setSaving(true);
    try {
      const body = {
        ...form,
        priceAmount: form.priceAmount ? parseFloat(form.priceAmount as string) : null,
        tagline: form.tagline || null,
        description: form.description || null,
        priceText: form.priceText || null,
        imageUrl: form.imageUrl || null,
        tag: form.tag || null,
        howItWorks: form.howItWorks || null,
        slug: form.slug || form.title!.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      };

      if (isNew) {
        const created = await api<{ data: { id: string } }>('/products', {
          method: 'POST',
          body: JSON.stringify(body),
        });
        toast.success('Product created');
        navigate(`/dashboard/content/products/${created.data.id}`, { replace: true });
      } else {
        await api(`/products/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(body),
        });
        toast.success('Product saved');
      }
    } catch {
      toast.error('Failed to save product');
    } finally {
      setSaving(false);
    }
  }, [form, isNew, id, navigate]);

  if (!isNew && isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
      </div>
    );
  }

  return (
    <div>
      <Breadcrumb
        items={[
          { label: 'Products', to: '/dashboard/content/products' },
          { label: isNew ? 'New Product' : form.title || 'Edit' },
        ]}
      />
      <PageHeader title={isNew ? 'New Product' : 'Edit Product'} />

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-4 rounded-lg border border-gray-200 bg-white p-5">
          <TextField label="Title" value={form.title ?? ''} onChange={(v) => set('title', v)} />
          <TextField label="Slug" value={form.slug ?? ''} onChange={(v) => set('slug', v)} placeholder="auto-generated" />
          <TextField label="Tagline" value={(form.tagline as string) ?? ''} onChange={(v) => set('tagline', v)} />
          <TextField label="Description" value={(form.description as string) ?? ''} onChange={(v) => set('description', v)} multiline rows={5} />
          <TextField label="How It Works" value={(form.howItWorks as string) ?? ''} onChange={(v) => set('howItWorks', v)} multiline rows={4} />
          <TextField
            label="Features (one per line)"
            value={((form.features as string[]) ?? []).join('\n')}
            onChange={(v) => set('features', v.split('\n').filter(Boolean) as unknown as string[])}
            multiline
            rows={4}
          />
          <ImageField label="Image" value={(form.imageUrl as string) ?? ''} onChange={(v) => set('imageUrl', v)} />
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="rounded-lg border border-gray-200 bg-white p-5 space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">Settings</h3>
            <Field label="Category">
              <select
                value={form.categoryId ?? ''}
                onChange={(e) => set('categoryId', e.target.value || null)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">No category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <TextField label="Price Display" value={(form.priceText as string) ?? ''} onChange={(v) => set('priceText', v)} placeholder="e.g. £9.99" />
              <TextField label="Price Amount" value={(form.priceAmount as string) ?? ''} onChange={(v) => set('priceAmount', v as unknown as string)} placeholder="9.99" />
            </div>
            <Field label="Currency">
              <select
                value={form.currency ?? 'GBP'}
                onChange={(e) => set('currency', e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="GBP">GBP</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </Field>
            <TextField label="Tag" value={(form.tag as string) ?? ''} onChange={(v) => set('tag', v)} placeholder="e.g. new, popular" />
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={form.isActive ?? true}
                  onChange={(e) => set('isActive', e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                Active
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={form.isFeatured ?? false}
                  onChange={(e) => set('isFeatured', e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                Featured
              </label>
            </div>
          </div>

          <button
            onClick={save}
            disabled={saving}
            className="w-full rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving…' : isNew ? 'Create Product' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
