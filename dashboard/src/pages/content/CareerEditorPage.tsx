import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { PageHeader, Breadcrumb, TextField, Field } from '@/components/ui';

interface Job {
  id: string;
  title: string;
  department: string | null;
  location: string | null;
  type: string | null;
  description: string | null;
  responsibilities: string[];
  requirements: string[];
  salaryRange: string | null;
  applyUrl: string | null;
  status: string;
}

export function CareerEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === 'new';

  const { data: job, isLoading } = useQuery({
    queryKey: ['job', id],
    queryFn: () => api<{ data: Job }>(`/content/jobs/${id}`).then((r) => r.data),
    enabled: !isNew,
  });

  const [form, setForm] = useState<Partial<Job>>({
    title: '',
    department: '',
    location: '',
    type: 'Full-Time',
    description: '',
    responsibilities: [],
    requirements: [],
    salaryRange: '',
    applyUrl: '',
    status: 'draft',
  });

  useEffect(() => {
    if (job) {
      setForm({
        title: job.title,
        department: job.department ?? '',
        location: job.location ?? '',
        type: job.type ?? 'Full-Time',
        description: job.description ?? '',
        responsibilities: job.responsibilities ?? [],
        requirements: job.requirements ?? [],
        salaryRange: job.salaryRange ?? '',
        applyUrl: job.applyUrl ?? '',
        status: job.status,
      });
    }
  }, [job]);

  const set = useCallback(
    (key: string, value: unknown) => setForm((prev) => ({ ...prev, [key]: value })),
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
        department: form.department || null,
        location: form.location || null,
        description: form.description || null,
        salaryRange: form.salaryRange || null,
        applyUrl: form.applyUrl || null,
      };

      if (isNew) {
        const created = await api<{ data: { id: string } }>('/content/jobs', {
          method: 'POST',
          body: JSON.stringify(body),
        });
        toast.success('Job created');
        navigate(`/dashboard/content/careers/${created.data.id}`, { replace: true });
      } else {
        await api(`/content/jobs/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(body),
        });
        toast.success('Job saved');
      }
    } catch {
      toast.error('Failed to save');
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
          { label: 'Careers', to: '/dashboard/content/careers' },
          { label: isNew ? 'New Job' : form.title || 'Edit' },
        ]}
      />
      <PageHeader title={isNew ? 'New Job Listing' : 'Edit Job Listing'} />

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4 rounded-lg border border-gray-200 bg-white p-5">
          <TextField label="Title" value={form.title ?? ''} onChange={(v) => set('title', v)} />
          <TextField label="Description" value={(form.description as string) ?? ''} onChange={(v) => set('description', v)} multiline rows={5} />
          <TextField
            label="Responsibilities (one per line)"
            value={((form.responsibilities as string[]) ?? []).join('\n')}
            onChange={(v) => set('responsibilities', v.split('\n').filter(Boolean))}
            multiline
            rows={4}
          />
          <TextField
            label="Requirements (one per line)"
            value={((form.requirements as string[]) ?? []).join('\n')}
            onChange={(v) => set('requirements', v.split('\n').filter(Boolean))}
            multiline
            rows={4}
          />
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-gray-200 bg-white p-5 space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">Details</h3>
            <TextField label="Department" value={(form.department as string) ?? ''} onChange={(v) => set('department', v)} />
            <TextField label="Location" value={(form.location as string) ?? ''} onChange={(v) => set('location', v)} />
            <Field label="Type">
              <select
                value={form.type ?? 'Full-Time'}
                onChange={(e) => set('type', e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="Full-Time">Full-Time</option>
                <option value="Part-Time">Part-Time</option>
                <option value="Contract">Contract</option>
              </select>
            </Field>
            <TextField label="Salary Range" value={(form.salaryRange as string) ?? ''} onChange={(v) => set('salaryRange', v)} placeholder="e.g. £30k - £40k" />
            <TextField label="Apply URL" value={(form.applyUrl as string) ?? ''} onChange={(v) => set('applyUrl', v)} placeholder="https://…" />
            <Field label="Status">
              <select
                value={form.status ?? 'draft'}
                onChange={(e) => set('status', e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="closed">Closed</option>
              </select>
            </Field>
          </div>

          <button
            onClick={save}
            disabled={saving}
            className="w-full rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving…' : isNew ? 'Create Job' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
