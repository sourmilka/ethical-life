import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, assetUrl } from '@/lib/api';
import { PageHeader, ConfirmDialog, TextField, ImageField } from '@/components/ui';
import { Plus, Trash2, Pencil, Eye, EyeOff } from 'lucide-react';

interface TeamMember {
  id: string;
  fullName: string;
  jobTitle: string | null;
  bio: string | null;
  photoUrl: string | null;
  isVisible: boolean;
  sortOrder: number;
}

export function TeamPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<TeamMember | null>(null);
  const [adding, setAdding] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TeamMember | null>(null);

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['team'],
    queryFn: () => api<{ data: TeamMember[] }>('/content/team').then((r) => r.data),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api(`/content/team/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.success('Member deleted');
      setDeleteTarget(null);
      qc.invalidateQueries({ queryKey: ['team'] });
    },
    onError: () => toast.error('Failed to delete'),
  });

  const mutated = useCallback(() => {
    qc.invalidateQueries({ queryKey: ['team'] });
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
        title="Team"
        description="Manage team members."
        actions={
          <button
            onClick={() => { setAdding(true); setEditing(null); }}
            className="flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" /> Add Member
          </button>
        }
      />

      {(adding || editing) && (
        <div className="mt-4">
          <TeamForm
            member={editing}
            onDone={mutated}
            onCancel={() => { setEditing(null); setAdding(false); }}
          />
        </div>
      )}

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {members.map((m) => (
          <div key={m.id} className="rounded-lg border border-gray-200 bg-white p-4 text-center">
            {m.photoUrl ? (
              <img src={assetUrl(m.photoUrl)} alt="" className="mx-auto h-20 w-20 rounded-full object-cover" />
            ) : (
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 text-xl font-medium text-gray-400">
                {m.fullName.charAt(0)}
              </div>
            )}
            <p className="mt-3 text-sm font-medium text-gray-900">{m.fullName}</p>
            {m.jobTitle && <p className="text-xs text-gray-500">{m.jobTitle}</p>}
            <div className="mt-3 flex items-center justify-center gap-2">
              {m.isVisible ? <Eye className="h-3.5 w-3.5 text-gray-400" /> : <EyeOff className="h-3.5 w-3.5 text-gray-400" />}
              <button onClick={() => { setEditing(m); setAdding(false); }} className="text-gray-400 hover:text-blue-600">
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => setDeleteTarget(m)} className="text-gray-400 hover:text-red-600">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {members.length === 0 && !adding && (
        <p className="py-12 text-center text-sm text-gray-400">No team members yet.</p>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Member"
        message={`Delete "${deleteTarget?.fullName}"?`}
        variant="danger"
        onConfirm={() => { if (deleteTarget) deleteMut.mutate(deleteTarget.id); }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

// ── Form ──────────────────────────────────────────────────

function TeamForm({
  member,
  onDone,
  onCancel,
}: {
  member: TeamMember | null;
  onDone: () => void;
  onCancel: () => void;
}) {
  const isNew = !member;
  const [fullName, setFullName] = useState(member?.fullName ?? '');
  const [jobTitle, setJobTitle] = useState(member?.jobTitle ?? '');
  const [bio, setBio] = useState(member?.bio ?? '');
  const [photoUrl, setPhotoUrl] = useState(member?.photoUrl ?? '');
  const [isVisible, setIsVisible] = useState(member?.isVisible ?? true);
  const [saving, setSaving] = useState(false);

  const save = useCallback(async () => {
    if (!fullName.trim()) {
      toast.error('Name is required');
      return;
    }
    setSaving(true);
    try {
      const body = {
        fullName,
        jobTitle: jobTitle || null,
        bio: bio || null,
        photoUrl: photoUrl || null,
        isVisible,
      };
      if (isNew) {
        await api('/content/team', { method: 'POST', body: JSON.stringify(body) });
        toast.success('Member added');
      } else {
        await api(`/content/team/${member.id}`, { method: 'PATCH', body: JSON.stringify(body) });
        toast.success('Member updated');
      }
      onDone();
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  }, [fullName, jobTitle, bio, photoUrl, isVisible, isNew, member, onDone]);

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-5 space-y-4">
      <h3 className="text-sm font-semibold text-gray-900">{isNew ? 'Add Member' : 'Edit Member'}</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Full Name" value={fullName} onChange={setFullName} />
        <TextField label="Job Title" value={jobTitle} onChange={setJobTitle} />
      </div>
      <TextField label="Bio" value={bio} onChange={setBio} multiline rows={3} />
      <ImageField label="Photo" value={photoUrl} onChange={setPhotoUrl} />
      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input type="checkbox" checked={isVisible} onChange={(e) => setIsVisible(e.target.checked)} className="h-4 w-4 rounded border-gray-300" />
        Visible
      </label>
      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
        <button onClick={save} disabled={saving} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
          {saving ? 'Saving…' : isNew ? 'Add' : 'Update'}
        </button>
      </div>
    </div>
  );
}
