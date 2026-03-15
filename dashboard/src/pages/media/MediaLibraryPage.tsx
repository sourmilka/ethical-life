import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { PageHeader, ConfirmDialog, FileUploader } from '@/components/ui';
import { Trash2, Pencil, Image as ImageIcon, FolderOpen, X, Check } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface MediaAsset {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  fileSize: string;
  url: string;
  altText?: string;
  width?: number;
  height?: number;
  folder: string;
  createdAt: string;
}

const FOLDERS = ['general', 'products', 'blog', 'team', 'brand'];

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function MediaLibraryPage() {
  const qc = useQueryClient();
  const [folder, setFolder] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAlt, setEditAlt] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<MediaAsset | null>(null);

  const queryParams = folder ? `?folder=${encodeURIComponent(folder)}` : '';
  const { data: assets = [] } = useQuery({
    queryKey: ['media', folder],
    queryFn: () => api<{ data: MediaAsset[] }>(`/media${queryParams}`).then((r) => r.data),
  });

  const uploadMut = useMutation({
    mutationFn: async (files: File[]) => {
      for (const file of files) {
        const fd = new FormData();
        fd.append('file', file);
        if (folder) fd.append('folder', folder);
        await api('/media', { method: 'POST', body: fd });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['media'] });
      toast.success('Upload complete');
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      api(`/media/${id}`, { method: 'PATCH', body }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['media'] });
      setEditingId(null);
      toast.success('Updated');
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api(`/media/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['media'] });
      setDeleteTarget(null);
      toast.success('Deleted');
    },
  });

  // Extract unique folders from existing assets
  const usedFolders = [...new Set([...FOLDERS, ...assets.map((a) => a.folder)])].sort();

  return (
    <div className="space-y-6">
      <PageHeader title="Media Library" description={`${assets.length} assets`} />

      {/* Upload zone */}
      <FileUploader accept="image/*,application/pdf,video/mp4,video/webm" multiple
        onUpload={(files) => uploadMut.mutate(files)}
        label="Drop files here or click to upload" />

      {/* Folder filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <FolderOpen className="w-4 h-4 text-gray-400" />
        <button onClick={() => setFolder('')}
          className={`px-3 py-1 rounded-full text-sm ${!folder ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          All
        </button>
        {usedFolders.map((f) => (
          <button key={f} onClick={() => setFolder(f)}
            className={`px-3 py-1 rounded-full text-sm capitalize ${folder === f ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {f}
          </button>
        ))}
      </div>

      {/* Grid */}
      {assets.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <ImageIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-lg font-medium">No media files</p>
          <p className="text-sm">Upload files to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {assets.map((asset) => (
            <div key={asset.id}
              className="bg-white border border-gray-200 rounded-lg overflow-hidden group relative">
              {/* Thumbnail */}
              <div className="aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
                {asset.mimeType.startsWith('image/') ? (
                  <img src={asset.url} alt={asset.altText ?? asset.originalName}
                    className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center">
                    <ImageIcon className="w-8 h-8 mx-auto text-gray-400" />
                    <span className="text-xs text-gray-500 mt-1 block">
                      {asset.mimeType.split('/')[1]?.toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              {/* Overlay actions */}
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                <button onClick={() => { setEditingId(asset.id); setEditAlt(asset.altText ?? ''); }}
                  className="p-1.5 bg-white rounded shadow text-gray-600 hover:text-blue-600">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setDeleteTarget(asset)}
                  className="p-1.5 bg-white rounded shadow text-gray-600 hover:text-red-600">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Info */}
              <div className="p-2">
                {editingId === asset.id ? (
                  <div className="flex items-center gap-1">
                    <input type="text" value={editAlt} onChange={(e) => setEditAlt(e.target.value)}
                      placeholder="Alt text…" className="flex-1 text-xs border border-gray-300 rounded px-1.5 py-0.5" />
                    <button onClick={() => updateMut.mutate({ id: asset.id, body: { altText: editAlt || null } })}
                      className="text-green-600 p-0.5"><Check className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setEditingId(null)}
                      className="text-gray-400 p-0.5"><X className="w-3.5 h-3.5" /></button>
                  </div>
                ) : (
                  <>
                    <p className="text-xs font-medium text-gray-900 truncate">{asset.originalName}</p>
                    <p className="text-xs text-gray-500">
                      {formatBytes(Number(asset.fileSize))} · {format(new Date(asset.createdAt), 'MMM d')}
                    </p>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog open={!!deleteTarget} onCancel={() => setDeleteTarget(null)}
        title="Delete File"
        message={`Delete "${deleteTarget?.originalName}"? This cannot be undone.`}
        onConfirm={() => { if (deleteTarget) deleteMut.mutate(deleteTarget.id); }}
        variant="danger" />
    </div>
  );
}
