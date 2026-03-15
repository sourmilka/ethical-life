import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { PageHeader, Breadcrumb, TextField, ImageField, Field, RichTextEditor } from '@/components/ui';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  coverImageUrl: string | null;
  authorName: string | null;
  authorAvatar: string | null;
  readTime: string | null;
  status: string;
  isFeatured: boolean;
  categoryId: string | null;
}

interface Category {
  id: string;
  name: string;
}

export function BlogEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === 'new';

  const { data: post, isLoading } = useQuery({
    queryKey: ['blog-post', id],
    queryFn: () => api<{ data: BlogPost }>(`/blog/${id}`).then((r) => r.data),
    enabled: !isNew,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['blog-categories'],
    queryFn: () => api<{ data: Category[] }>('/blog/categories').then((r) => r.data),
  });

  const [form, setForm] = useState<Partial<BlogPost>>({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    coverImageUrl: '',
    authorName: '',
    authorAvatar: '',
    readTime: '',
    status: 'draft',
    isFeatured: false,
    categoryId: null,
  });

  useEffect(() => {
    if (post) {
      setForm({
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt ?? '',
        content: post.content ?? '',
        coverImageUrl: post.coverImageUrl ?? '',
        authorName: post.authorName ?? '',
        authorAvatar: post.authorAvatar ?? '',
        readTime: post.readTime ?? '',
        status: post.status,
        isFeatured: post.isFeatured,
        categoryId: post.categoryId,
      });
    }
  }, [post]);

  const set = useCallback(
    (key: string, value: unknown) => setForm((prev) => ({ ...prev, [key]: value })),
    [],
  );

  const [saving, setSaving] = useState(false);

  const save = useCallback(
    async (status?: string) => {
      if (!form.title?.trim()) {
        toast.error('Title is required');
        return;
      }
      setSaving(true);
      try {
        const body = {
          ...form,
          status: status ?? form.status,
          excerpt: form.excerpt || null,
          content: form.content || null,
          coverImageUrl: form.coverImageUrl || null,
          authorName: form.authorName || null,
          authorAvatar: form.authorAvatar || null,
          readTime: form.readTime || null,
          slug: form.slug || form.title!.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
        };

        if (isNew) {
          const created = await api<{ data: { id: string } }>('/blog', {
            method: 'POST',
            body: JSON.stringify(body),
          });
          toast.success('Post created');
          navigate(`/dashboard/content/blog/${created.data.id}`, { replace: true });
        } else {
          await api(`/blog/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(body),
          });
          toast.success('Post saved');
        }
      } catch {
        toast.error('Failed to save post');
      } finally {
        setSaving(false);
      }
    },
    [form, isNew, id, navigate],
  );

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
          { label: 'Blog', to: '/dashboard/content/blog' },
          { label: isNew ? 'New Post' : form.title || 'Edit' },
        ]}
      />
      <PageHeader title={isNew ? 'New Post' : 'Edit Post'} />

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-4 rounded-lg border border-gray-200 bg-white p-5">
          <TextField label="Title" value={form.title ?? ''} onChange={(v) => set('title', v)} />
          <TextField label="Slug" value={form.slug ?? ''} onChange={(v) => set('slug', v)} placeholder="auto-generated" />
          <ImageField label="Cover Image" value={(form.coverImageUrl as string) ?? ''} onChange={(v) => set('coverImageUrl', v)} />
          <TextField label="Excerpt" value={(form.excerpt as string) ?? ''} onChange={(v) => set('excerpt', v)} multiline rows={3} />
          <Field label="Content">
            <RichTextEditor content={(form.content as string) ?? ''} onChange={(v) => set('content', v)} />
          </Field>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="rounded-lg border border-gray-200 bg-white p-5 space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">Post Settings</h3>
            <Field label="Status">
              <select
                value={form.status ?? 'draft'}
                onChange={(e) => set('status', e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </Field>
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
            <TextField label="Author Name" value={(form.authorName as string) ?? ''} onChange={(v) => set('authorName', v)} />
            <ImageField label="Author Avatar" value={(form.authorAvatar as string) ?? ''} onChange={(v) => set('authorAvatar', v)} />
            <TextField label="Read Time" value={(form.readTime as string) ?? ''} onChange={(v) => set('readTime', v)} placeholder="5 min read" />
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

          <div className="flex gap-2">
            <button
              onClick={() => save()}
              disabled={saving}
              className="flex-1 rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving…' : isNew ? 'Create Post' : 'Save'}
            </button>
            {form.status === 'draft' && (
              <button
                onClick={() => save('published')}
                disabled={saving}
                className="rounded-md bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                Publish
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
