import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { PageHeader, ConfirmDialog, TextField, Field } from '@/components/ui';
import { Plus, Trash2, Pencil, ChevronDown, Eye, EyeOff } from 'lucide-react';

interface FaqCategory {
  id: string;
  name: string;
  slug: string;
}

interface FaqItem {
  id: string;
  question: string;
  answer: string;
  categoryId: string | null;
  pageLocation: string;
  isVisible: boolean;
  sortOrder: number;
  category: FaqCategory | null;
}

export function FAQPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<FaqItem | null>(null);
  const [adding, setAdding] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<FaqItem | null>(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['faqs'],
    queryFn: () => api<{ data: FaqItem[] }>('/content/faqs').then((r) => r.data),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['faq-categories'],
    queryFn: () => api<{ data: FaqCategory[] }>('/content/faq-categories').then((r) => r.data),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api(`/content/faqs/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.success('FAQ deleted');
      setDeleteTarget(null);
      qc.invalidateQueries({ queryKey: ['faqs'] });
    },
    onError: () => toast.error('Failed to delete'),
  });

  const mutated = useCallback(() => {
    qc.invalidateQueries({ queryKey: ['faqs'] });
    setEditing(null);
    setAdding(false);
  }, [qc]);

  // Group by category
  const grouped = new Map<string, FaqItem[]>();
  const uncategorized: FaqItem[] = [];
  for (const item of items) {
    if (item.category) {
      const list = grouped.get(item.category.name) ?? [];
      list.push(item);
      grouped.set(item.category.name, list);
    } else {
      uncategorized.push(item);
    }
  }

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
        title="FAQs"
        description="Manage frequently asked questions."
        actions={
          <button
            onClick={() => { setAdding(true); setEditing(null); }}
            className="flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" /> Add FAQ
          </button>
        }
      />

      {(adding || editing) && (
        <div className="mt-4">
          <FaqForm
            item={editing}
            categories={categories}
            onDone={mutated}
            onCancel={() => { setEditing(null); setAdding(false); }}
          />
        </div>
      )}

      <div className="mt-4 space-y-6">
        {Array.from(grouped.entries()).map(([catName, catItems]) => (
          <FaqGroup
            key={catName}
            title={catName}
            items={catItems}
            onEdit={(item) => { setEditing(item); setAdding(false); }}
            onDelete={setDeleteTarget}
          />
        ))}
        {uncategorized.length > 0 && (
          <FaqGroup
            title="Uncategorized"
            items={uncategorized}
            onEdit={(item) => { setEditing(item); setAdding(false); }}
            onDelete={setDeleteTarget}
          />
        )}
      </div>

      {items.length === 0 && !adding && (
        <p className="py-12 text-center text-sm text-gray-400">No FAQs yet.</p>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete FAQ"
        message="Delete this FAQ? This cannot be undone."
        variant="danger"
        onConfirm={() => { if (deleteTarget) deleteMut.mutate(deleteTarget.id); }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

// ── FAQ Group ─────────────────────────────────────────────

function FaqGroup({
  title,
  items,
  onEdit,
  onDelete,
}: {
  title: string;
  items: FaqItem[];
  onEdit: (item: FaqItem) => void;
  onDelete: (item: FaqItem) => void;
}) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold text-gray-900"
      >
        <span>{title} ({items.length})</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>
      {expanded && (
        <div className="divide-y divide-gray-100 border-t border-gray-100">
          {items.map((item) => (
            <div key={item.id} className="flex items-start justify-between px-4 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{item.question}</p>
                <p className="mt-1 text-sm text-gray-500 line-clamp-2">{item.answer}</p>
                <div className="mt-1 flex items-center gap-2 text-xs text-gray-400">
                  <span className="rounded bg-gray-100 px-1.5 py-0.5">{item.pageLocation.replace('_', ' ')}</span>
                  {item.isVisible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                </div>
              </div>
              <div className="ml-3 flex items-center gap-1.5">
                <button onClick={() => onEdit(item)} className="text-gray-400 hover:text-blue-600">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => onDelete(item)} className="text-gray-400 hover:text-red-600">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Form ──────────────────────────────────────────────────

function FaqForm({
  item,
  categories,
  onDone,
  onCancel,
}: {
  item: FaqItem | null;
  categories: FaqCategory[];
  onDone: () => void;
  onCancel: () => void;
}) {
  const isNew = !item;
  const [question, setQuestion] = useState(item?.question ?? '');
  const [answer, setAnswer] = useState(item?.answer ?? '');
  const [categoryId, setCategoryId] = useState(item?.categoryId ?? '');
  const [pageLocation, setPageLocation] = useState(item?.pageLocation ?? 'faq_page');
  const [isVisible, setIsVisible] = useState(item?.isVisible ?? true);
  const [saving, setSaving] = useState(false);

  const save = useCallback(async () => {
    if (!question.trim() || !answer.trim()) {
      toast.error('Question and answer are required');
      return;
    }
    setSaving(true);
    try {
      const body = { question, answer, categoryId: categoryId || null, pageLocation, isVisible };
      if (isNew) {
        await api('/content/faqs', { method: 'POST', body: JSON.stringify(body) });
        toast.success('FAQ added');
      } else {
        await api(`/content/faqs/${item.id}`, { method: 'PATCH', body: JSON.stringify(body) });
        toast.success('FAQ updated');
      }
      onDone();
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  }, [question, answer, categoryId, pageLocation, isVisible, isNew, item, onDone]);

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-5 space-y-4">
      <h3 className="text-sm font-semibold text-gray-900">{isNew ? 'Add FAQ' : 'Edit FAQ'}</h3>
      <TextField label="Question" value={question} onChange={setQuestion} />
      <TextField label="Answer" value={answer} onChange={setAnswer} multiline rows={4} />
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Category">
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
            <option value="">No category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Show On">
          <select value={pageLocation} onChange={(e) => setPageLocation(e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
            <option value="faq_page">FAQ Page</option>
            <option value="home_page">Home Page</option>
            <option value="both">Both</option>
          </select>
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
