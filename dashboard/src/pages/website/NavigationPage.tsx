import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, GripVertical, Trash2, ExternalLink } from 'lucide-react';
import { api } from '@/lib/api';
import { PageHeader, ConfirmDialog } from '@/components/ui';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const LOCATIONS = ['navbar', 'sidebar', 'footer_col1', 'footer_col2'] as const;
type Location = (typeof LOCATIONS)[number];

const LOCATION_LABELS: Record<Location, string> = {
  navbar: 'Navbar',
  sidebar: 'Sidebar',
  footer_col1: 'Footer Col 1',
  footer_col2: 'Footer Col 2',
};

interface NavItem {
  id: string;
  label: string;
  url: string;
  location: string;
  sortOrder: number;
  isVisible: boolean;
  openInNewTab: boolean;
}

export function NavigationPage() {
  const [tab, setTab] = useState<Location>('navbar');
  const qc = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['navigation'],
    queryFn: () => api<{ data: NavItem[] }>('/navigation').then((r) => r.data),
  });

  const filtered = items
    .filter((i) => i.location === tab)
    .sort((a, b) => a.sortOrder - b.sortOrder);

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
        title="Navigation"
        description="Manage navigation links for each section of your site."
      />

      {/* Tabs */}
      <div className="mt-4 flex gap-1 border-b border-gray-200">
        {LOCATIONS.map((loc) => (
          <button
            key={loc}
            onClick={() => setTab(loc)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              tab === loc
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {LOCATION_LABELS[loc]}
            <span className="ml-1.5 text-xs text-gray-400">
              ({items.filter((i) => i.location === loc).length})
            </span>
          </button>
        ))}
      </div>

      {/* List */}
      <div className="mt-4">
        <NavList
          items={filtered}
          location={tab}
          onMutated={() => qc.invalidateQueries({ queryKey: ['navigation'] })}
        />
      </div>
    </div>
  );
}

// ── Sortable list ─────────────────────────────────────────

function NavList({
  items,
  location,
  onMutated,
}: {
  items: NavItem[];
  location: Location;
  onMutated: () => void;
}) {
  const [adding, setAdding] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<NavItem | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);
      const reordered = arrayMove(items, oldIndex, newIndex);

      try {
        await api('/navigation/reorder', {
          method: 'POST',
          body: JSON.stringify({ ids: reordered.map((i) => i.id) }),
        });
        onMutated();
      } catch {
        toast.error('Failed to reorder');
      }
    },
    [items, onMutated],
  );

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api(`/navigation/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.success('Link deleted');
      setDeleteTarget(null);
      onMutated();
    },
    onError: () => toast.error('Failed to delete'),
  });

  return (
    <>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {items.map((item) => (
              <SortableNavItem
                key={item.id}
                item={item}
                onDelete={() => setDeleteTarget(item)}
                onMutated={onMutated}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {items.length === 0 && !adding && (
        <p className="py-8 text-center text-sm text-gray-400">
          No links in {LOCATION_LABELS[location]} yet.
        </p>
      )}

      {adding ? (
        <AddLinkForm
          location={location}
          onSaved={() => {
            setAdding(false);
            onMutated();
          }}
          onCancel={() => setAdding(false)}
        />
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="mt-3 flex items-center gap-1.5 rounded-md border border-dashed border-gray-300 px-4 py-2 text-sm text-gray-500 hover:border-gray-400 hover:text-gray-700"
        >
          <Plus className="h-4 w-4" />
          Add Link
        </button>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Link"
        message={`Delete "${deleteTarget?.label}"? This cannot be undone.`}
        variant="danger"
        onConfirm={() => { if (deleteTarget) deleteMutation.mutate(deleteTarget.id); }}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}

// ── Sortable item ─────────────────────────────────────────

function SortableNavItem({
  item,
  onDelete,
  onMutated,
}: {
  item: NavItem;
  onDelete: () => void;
  onMutated: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(item.label);
  const [url, setUrl] = useState(item.url);
  const [openInNewTab, setOpenInNewTab] = useState(item.openInNewTab);
  const [isVisible, setIsVisible] = useState(item.isVisible);
  const [saving, setSaving] = useState(false);

  const save = useCallback(async () => {
    setSaving(true);
    try {
      await api(`/navigation/${item.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ label, url, openInNewTab, isVisible }),
      });
      toast.success('Link updated');
      setEditing(false);
      onMutated();
    } catch {
      toast.error('Failed to update');
    } finally {
      setSaving(false);
    }
  }, [item.id, label, url, openInNewTab, isVisible, onMutated]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-lg border border-gray-200 bg-white"
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <button {...attributes} {...listeners} className="cursor-grab text-gray-400 hover:text-gray-600">
          <GripVertical className="h-4 w-4" />
        </button>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{item.label}</p>
          <p className="text-xs text-gray-400 truncate">{item.url}</p>
        </div>

        <div className="flex items-center gap-2">
          {item.openInNewTab && <ExternalLink className="h-3.5 w-3.5 text-gray-400" />}
          {!item.isVisible && (
            <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">Hidden</span>
          )}
          <button
            onClick={() => setEditing(!editing)}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            {editing ? 'Close' : 'Edit'}
          </button>
          <button onClick={onDelete} className="text-gray-400 hover:text-red-600">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {editing && (
        <div className="border-t border-gray-100 px-4 py-3 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Label</label>
              <input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">URL</label>
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={openInNewTab}
                onChange={(e) => setOpenInNewTab(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              Open in new tab
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={isVisible}
                onChange={(e) => setIsVisible(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              Visible
            </label>
          </div>
          <div className="flex justify-end">
            <button
              onClick={save}
              disabled={saving}
              className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Add link form ─────────────────────────────────────────

function AddLinkForm({
  location,
  onSaved,
  onCancel,
}: {
  location: Location;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [label, setLabel] = useState('');
  const [url, setUrl] = useState('');
  const [openInNewTab, setOpenInNewTab] = useState(false);
  const [saving, setSaving] = useState(false);

  const save = useCallback(async () => {
    if (!label.trim() || !url.trim()) {
      toast.error('Label and URL are required');
      return;
    }
    setSaving(true);
    try {
      await api('/navigation', {
        method: 'POST',
        body: JSON.stringify({ label, url, location, openInNewTab }),
      });
      toast.success('Link added');
      onSaved();
    } catch {
      toast.error('Failed to add link');
    } finally {
      setSaving(false);
    }
  }, [label, url, location, openInNewTab, onSaved]);

  return (
    <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Label</label>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Link text"
            className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">URL</label>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="/about or https://…"
            className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={openInNewTab}
          onChange={(e) => setOpenInNewTab(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300"
        />
        Open in new tab
      </label>
      <div className="flex justify-end gap-2">
        <button
          onClick={onCancel}
          className="rounded-md border border-gray-300 px-4 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={save}
          disabled={saving}
          className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Adding…' : 'Add Link'}
        </button>
      </div>
    </div>
  );
}
