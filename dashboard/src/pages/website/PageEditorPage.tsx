import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { PageHeader, Breadcrumb, SectionEditor, TextField, ImageField } from '@/components/ui';

interface PageSection {
  id: string;
  sectionKey: string;
  sortOrder: number;
  isVisible: boolean;
  content: Record<string, unknown>;
}

interface PageData {
  id: string;
  title: string;
  slug: string;
  metaDescription: string | null;
  isActive: boolean;
  sections: PageSection[];
}

function sectionTitle(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function PageEditorPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: page, isLoading } = useQuery({
    queryKey: ['page', slug],
    queryFn: async () => {
      // list all pages and find by slug since API uses id
      const pages = await api<{ data: PageData[] }>('/pages').then((r) => r.data);
      const found = pages.find((p) => p.slug === slug);
      if (!found) throw new Error('Page not found');
      return api<{ data: PageData }>(`/pages/${found.id}`).then((r) => r.data);
    },
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
      </div>
    );
  }

  if (!page) {
    return (
      <div className="py-12 text-center text-gray-500">
        Page not found.{' '}
        <button onClick={() => navigate('/dashboard/website/pages')} className="text-blue-600 underline">
          Go back
        </button>
      </div>
    );
  }

  return (
    <div>
      <Breadcrumb
        items={[
          { label: 'Pages', to: '/dashboard/website/pages' },
          { label: page.title || page.slug },
        ]}
      />
      <PageHeader
        title={page.title || page.slug}
        description={`Edit sections for the "${page.slug}" page.`}
      />

      <div className="mt-6 space-y-4">
        {page.sections.map((section) => (
          <SectionBlock
            key={section.id}
            section={section}
            onSaved={() => qc.invalidateQueries({ queryKey: ['page', slug] })}
          />
        ))}

        {page.sections.length === 0 && (
          <p className="py-8 text-center text-sm text-gray-400">
            This page has no editable sections yet.
          </p>
        )}
      </div>
    </div>
  );
}

// ── Section block ─────────────────────────────────────────

function SectionBlock({
  section,
  onSaved,
}: {
  section: PageSection;
  onSaved: () => void;
}) {
  const [content, setContent] = useState<Record<string, unknown>>(section.content);
  const [isVisible, setIsVisible] = useState(section.isVisible);
  const [saving, setSaving] = useState(false);

  const set = useCallback(
    (key: string, value: unknown) =>
      setContent((prev) => ({ ...prev, [key]: value })),
    [],
  );

  const save = useCallback(async () => {
    setSaving(true);
    try {
      await api(`/pages/sections/${section.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isVisible, content }),
      });
      toast.success(`${sectionTitle(section.sectionKey)} saved`);
      onSaved();
    } catch {
      toast.error('Failed to save section');
    } finally {
      setSaving(false);
    }
  }, [content, isVisible, section.id, section.sectionKey, onSaved]);

  const handleVisibility = useCallback(
    (v: boolean) => setIsVisible(v),
    [],
  );

  return (
    <SectionEditor
      title={sectionTitle(section.sectionKey)}
      visible={isVisible}
      onVisibilityChange={handleVisibility}
      onSave={save}
      saving={saving}
    >
      <ContentFields content={content} onChange={set} />
    </SectionEditor>
  );
}

// ── Generic content field renderer ────────────────────────

function ContentFields({
  content,
  onChange,
}: {
  content: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
}) {
  const entries = Object.entries(content);

  if (entries.length === 0) {
    return <p className="text-sm text-gray-400">No editable fields in this section.</p>;
  }

  return (
    <>
      {entries.map(([key, value]) => {
        const label = key
          .replace(/([A-Z])/g, ' $1')
          .replace(/_/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase())
          .trim();

        // Image URL fields
        if (
          typeof value === 'string' &&
          (key.toLowerCase().includes('image') ||
            key.toLowerCase().includes('logo') ||
            key.toLowerCase().includes('url') ||
            key.toLowerCase().includes('src'))
        ) {
          return (
            <ImageField
              key={key}
              label={label}
              value={value}
              onChange={(v) => onChange(key, v)}
            />
          );
        }

        // Long text
        if (typeof value === 'string' && value.length > 120) {
          return (
            <TextField
              key={key}
              label={label}
              value={value}
              onChange={(v) => onChange(key, v)}
              multiline
              rows={4}
            />
          );
        }

        // Regular string
        if (typeof value === 'string') {
          return (
            <TextField
              key={key}
              label={label}
              value={value}
              onChange={(v) => onChange(key, v)}
            />
          );
        }

        // Boolean toggle
        if (typeof value === 'boolean') {
          return (
            <div key={key} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={value}
                onChange={(e) => onChange(key, e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">{label}</span>
            </div>
          );
        }

        // Array of strings
        if (Array.isArray(value) && value.every((v) => typeof v === 'string')) {
          return (
            <TextField
              key={key}
              label={`${label} (one per line)`}
              value={(value as string[]).join('\n')}
              onChange={(v) => onChange(key, v.split('\n').filter(Boolean))}
              multiline
              rows={Math.max(3, (value as string[]).length + 1)}
            />
          );
        }

        // Nested object — render as JSON textarea
        if (typeof value === 'object' && value !== null) {
          return (
            <TextField
              key={key}
              label={`${label} (JSON)`}
              value={JSON.stringify(value, null, 2)}
              onChange={(v) => {
                try {
                  onChange(key, JSON.parse(v));
                } catch {
                  /* invalid json — don't update */
                }
              }}
              multiline
              rows={6}
            />
          );
        }

        // Number
        if (typeof value === 'number') {
          return (
            <div key={key}>
              <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
              <input
                type="number"
                value={value}
                onChange={(e) => onChange(key, Number(e.target.value))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          );
        }

        return null;
      })}
    </>
  );
}
