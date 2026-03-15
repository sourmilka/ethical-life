import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, assetUrl } from '@/lib/api';
import { PageHeader, ConfirmDialog, TextField, ImageField } from '@/components/ui';
import { Plus, Trash2, Pencil, Eye, EyeOff, Play } from 'lucide-react';

interface Video {
  id: string;
  title: string | null;
  speakerName: string | null;
  speakerRole: string | null;
  speakerAvatar: string | null;
  videoUrl: string;
  thumbnailUrl: string | null;
  isVisible: boolean;
  sortOrder: number;
}

export function VideosPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Video | null>(null);
  const [adding, setAdding] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Video | null>(null);

  const { data: videos = [], isLoading } = useQuery({
    queryKey: ['videos'],
    queryFn: () => api<{ data: Video[] }>('/content/videos').then((r) => r.data),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api(`/content/videos/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.success('Video deleted');
      setDeleteTarget(null);
      qc.invalidateQueries({ queryKey: ['videos'] });
    },
    onError: () => toast.error('Failed to delete'),
  });

  const mutated = useCallback(() => {
    qc.invalidateQueries({ queryKey: ['videos'] });
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
        title="Videos"
        description="Manage video content."
        actions={
          <button
            onClick={() => { setAdding(true); setEditing(null); }}
            className="flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" /> Add Video
          </button>
        }
      />

      {(adding || editing) && (
        <div className="mt-4">
          <VideoForm
            video={editing}
            onDone={mutated}
            onCancel={() => { setEditing(null); setAdding(false); }}
          />
        </div>
      )}

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {videos.map((v) => (
          <div key={v.id} className="group rounded-lg border border-gray-200 bg-white overflow-hidden">
            {/* Thumbnail */}
            <div className="relative aspect-video bg-gray-100">
              {v.thumbnailUrl ? (
                <img src={assetUrl(v.thumbnailUrl)} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <Play className="h-10 w-10 text-gray-300" />
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/20">
                <Play className="h-8 w-8 text-white opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
            </div>

            <div className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{v.title || 'Untitled'}</p>
                  {v.speakerName && (
                    <div className="mt-1 flex items-center gap-1.5">
                      {v.speakerAvatar && (
                        <img src={assetUrl(v.speakerAvatar)} alt="" className="h-5 w-5 rounded-full object-cover" />
                      )}
                      <span className="text-xs text-gray-500">{v.speakerName}</span>
                      {v.speakerRole && <span className="text-xs text-gray-400">· {v.speakerRole}</span>}
                    </div>
                  )}
                </div>
                <div className="ml-2 flex items-center gap-1">
                  {v.isVisible ? <Eye className="h-3.5 w-3.5 text-gray-400" /> : <EyeOff className="h-3.5 w-3.5 text-gray-400" />}
                  <button onClick={() => { setEditing(v); setAdding(false); }} className="text-gray-400 hover:text-blue-600">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => setDeleteTarget(v)} className="text-gray-400 hover:text-red-600">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {videos.length === 0 && !adding && (
        <p className="py-12 text-center text-sm text-gray-400">No videos yet.</p>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Video"
        message={`Delete "${deleteTarget?.title || 'this video'}"?`}
        variant="danger"
        onConfirm={() => { if (deleteTarget) deleteMut.mutate(deleteTarget.id); }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

// ── Form ──────────────────────────────────────────────────

function VideoForm({
  video,
  onDone,
  onCancel,
}: {
  video: Video | null;
  onDone: () => void;
  onCancel: () => void;
}) {
  const isNew = !video;
  const [title, setTitle] = useState(video?.title ?? '');
  const [speakerName, setSpeakerName] = useState(video?.speakerName ?? '');
  const [speakerRole, setSpeakerRole] = useState(video?.speakerRole ?? '');
  const [speakerAvatar, setSpeakerAvatar] = useState(video?.speakerAvatar ?? '');
  const [videoUrl, setVideoUrl] = useState(video?.videoUrl ?? '');
  const [thumbnailUrl, setThumbnailUrl] = useState(video?.thumbnailUrl ?? '');
  const [isVisible, setIsVisible] = useState(video?.isVisible ?? true);
  const [saving, setSaving] = useState(false);

  const save = useCallback(async () => {
    if (!videoUrl.trim()) {
      toast.error('Video URL is required');
      return;
    }
    setSaving(true);
    try {
      const body = {
        title: title || null,
        speakerName: speakerName || null,
        speakerRole: speakerRole || null,
        speakerAvatar: speakerAvatar || null,
        videoUrl,
        thumbnailUrl: thumbnailUrl || null,
        isVisible,
      };
      if (isNew) {
        await api('/content/videos', { method: 'POST', body: JSON.stringify(body) });
        toast.success('Video added');
      } else {
        await api(`/content/videos/${video.id}`, { method: 'PATCH', body: JSON.stringify(body) });
        toast.success('Video updated');
      }
      onDone();
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  }, [title, speakerName, speakerRole, speakerAvatar, videoUrl, thumbnailUrl, isVisible, isNew, video, onDone]);

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-5 space-y-4">
      <h3 className="text-sm font-semibold text-gray-900">{isNew ? 'Add Video' : 'Edit Video'}</h3>
      <TextField label="Title" value={title} onChange={setTitle} />
      <TextField label="Video URL" value={videoUrl} onChange={setVideoUrl} placeholder="https://…" />
      <ImageField label="Thumbnail" value={thumbnailUrl} onChange={setThumbnailUrl} />
      <div className="grid gap-4 sm:grid-cols-3">
        <TextField label="Speaker Name" value={speakerName} onChange={setSpeakerName} />
        <TextField label="Speaker Role" value={speakerRole} onChange={setSpeakerRole} />
        <ImageField label="Speaker Avatar" value={speakerAvatar} onChange={setSpeakerAvatar} />
      </div>
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
