import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { PageHeader, ConfirmDialog, TextField, ImageField, Field } from '@/components/ui';
import { Plus, Star, Trash2, Pencil, Eye, EyeOff } from 'lucide-react';
import { format } from 'date-fns';

interface Testimonial {
  id: string;
  authorName: string;
  authorAvatar: string | null;
  rating: number;
  reviewText: string;
  reviewDate: string | null;
  source: string | null;
  isVisible: boolean;
  sortOrder: number;
}

export function TestimonialsPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Testimonial | null>(null);
  const [adding, setAdding] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Testimonial | null>(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['testimonials'],
    queryFn: () => api<{ data: Testimonial[] }>('/content/testimonials').then((r) => r.data),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api(`/content/testimonials/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.success('Testimonial deleted');
      setDeleteTarget(null);
      qc.invalidateQueries({ queryKey: ['testimonials'] });
    },
    onError: () => toast.error('Failed to delete'),
  });

  const mutated = useCallback(() => {
    qc.invalidateQueries({ queryKey: ['testimonials'] });
    setEditing(null);
    setAdding(false);
  }, [qc]);

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
        title="Testimonials"
        description="Manage customer reviews."
        actions={
          <button
            onClick={() => { setAdding(true); setEditing(null); }}
            className="flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" /> Add Testimonial
          </button>
        }
      />

      {(adding || editing) && (
        <div className="mt-4">
          <TestimonialForm
            testimonial={editing}
            onDone={mutated}
            onCancel={() => { setEditing(null); setAdding(false); }}
          />
        </div>
      )}

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                {item.authorAvatar ? (
                  <img src={item.authorAvatar} alt="" className="h-8 w-8 rounded-full object-cover" />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-500">
                    {item.authorName.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-900">{item.authorName}</p>
                  {item.source && <p className="text-xs text-gray-400">{item.source}</p>}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => { setEditing(item); setAdding(false); }} className="text-gray-400 hover:text-blue-600">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => setDeleteTarget(item)} className="text-gray-400 hover:text-red-600">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`h-3.5 w-3.5 ${i < item.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
              ))}
            </div>
            <p className="text-sm text-gray-600 line-clamp-3">{item.reviewText}</p>
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>{item.reviewDate ? format(new Date(item.reviewDate), 'MMM d, yyyy') : ''}</span>
              {item.isVisible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            </div>
          </div>
        ))}
      </div>

      {items.length === 0 && !adding && (
        <p className="py-12 text-center text-sm text-gray-400">No testimonials yet.</p>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Testimonial"
        message={`Delete review by "${deleteTarget?.authorName}"?`}
        variant="danger"
        onConfirm={() => { if (deleteTarget) deleteMut.mutate(deleteTarget.id); }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

// ── Form ──────────────────────────────────────────────────

function TestimonialForm({
  testimonial,
  onDone,
  onCancel,
}: {
  testimonial: Testimonial | null;
  onDone: () => void;
  onCancel: () => void;
}) {
  const isNew = !testimonial;
  const [authorName, setAuthorName] = useState(testimonial?.authorName ?? '');
  const [authorAvatar, setAuthorAvatar] = useState(testimonial?.authorAvatar ?? '');
  const [rating, setRating] = useState(testimonial?.rating ?? 5);
  const [reviewText, setReviewText] = useState(testimonial?.reviewText ?? '');
  const [reviewDate, setReviewDate] = useState(testimonial?.reviewDate?.slice(0, 10) ?? '');
  const [source, setSource] = useState(testimonial?.source ?? '');
  const [isVisible, setIsVisible] = useState(testimonial?.isVisible ?? true);
  const [saving, setSaving] = useState(false);

  const save = useCallback(async () => {
    if (!authorName.trim() || !reviewText.trim()) {
      toast.error('Author name and review text are required');
      return;
    }
    setSaving(true);
    try {
      const body = {
        authorName,
        authorAvatar: authorAvatar || null,
        rating,
        reviewText,
        reviewDate: reviewDate || null,
        source: source || null,
        isVisible,
      };
      if (isNew) {
        await api('/content/testimonials', { method: 'POST', body: JSON.stringify(body) });
        toast.success('Testimonial added');
      } else {
        await api(`/content/testimonials/${testimonial.id}`, { method: 'PATCH', body: JSON.stringify(body) });
        toast.success('Testimonial updated');
      }
      onDone();
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  }, [authorName, authorAvatar, rating, reviewText, reviewDate, source, isVisible, isNew, testimonial, onDone]);

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-5 space-y-4">
      <h3 className="text-sm font-semibold text-gray-900">{isNew ? 'Add Testimonial' : 'Edit Testimonial'}</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Author Name" value={authorName} onChange={setAuthorName} />
        <ImageField label="Author Avatar" value={authorAvatar} onChange={setAuthorAvatar} />
        <Field label="Rating">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((v) => (
              <button key={v} type="button" onClick={() => setRating(v)}>
                <Star className={`h-5 w-5 ${v <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
              </button>
            ))}
          </div>
        </Field>
        <Field label="Source">
          <select value={source} onChange={(e) => setSource(e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
            <option value="">Select…</option>
            <option value="Google">Google</option>
            <option value="Trustpilot">Trustpilot</option>
            <option value="Custom">Custom</option>
          </select>
        </Field>
      </div>
      <TextField label="Review Text" value={reviewText} onChange={setReviewText} multiline rows={3} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Review Date">
          <input
            type="date"
            value={reviewDate}
            onChange={(e) => setReviewDate(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </Field>
        <div className="flex items-end">
          <label className="flex items-center gap-2 pb-2 text-sm text-gray-700">
            <input type="checkbox" checked={isVisible} onChange={(e) => setIsVisible(e.target.checked)} className="h-4 w-4 rounded border-gray-300" />
            Visible
          </label>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
        <button onClick={save} disabled={saving} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
          {saving ? 'Saving…' : isNew ? 'Add' : 'Update'}
        </button>
      </div>
    </div>
  );
}
