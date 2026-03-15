import { type ReactNode } from 'react';
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
import { GripVertical, Plus, Trash2 } from 'lucide-react';

interface RepeaterProps<T> {
  items: T[];
  onChange: (items: T[]) => void;
  keyExtractor: (item: T, index: number) => string;
  renderItem: (item: T, index: number, update: (data: Partial<T>) => void) => ReactNode;
  createItem: () => T;
  addLabel?: string;
  minItems?: number;
}

export function Repeater<T>({
  items,
  onChange,
  keyExtractor,
  renderItem,
  createItem,
  addLabel = 'Add Item',
  minItems = 0,
}: RepeaterProps<T>) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const ids = items.map((item, i) => keyExtractor(item, i));
    const oldIndex = ids.indexOf(active.id as string);
    const newIndex = ids.indexOf(over.id as string);
    onChange(arrayMove(items, oldIndex, newIndex));
  };

  const addItem = () => onChange([...items, createItem()]);

  const removeItem = (index: number) => {
    if (items.length <= minItems) return;
    onChange(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, data: Partial<T>) => {
    onChange(items.map((item, i) => (i === index ? { ...item, ...data } : item)));
  };

  const ids = items.map((item, i) => keyExtractor(item, i));

  return (
    <div className="space-y-2">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          {items.map((item, index) => (
            <SortableItem key={ids[index]} id={ids[index]!}>
              <div className="flex items-start gap-2 rounded-md border border-gray-200 bg-gray-50 p-3">
                <GripVertical className="mt-1 h-4 w-4 shrink-0 cursor-grab text-gray-400" />
                <div className="flex-1">{renderItem(item, index, (data) => updateItem(index, data))}</div>
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  disabled={items.length <= minItems}
                  className="mt-1 shrink-0 rounded p-1 text-gray-400 hover:text-red-500 disabled:opacity-30"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </SortableItem>
          ))}
        </SortableContext>
      </DndContext>

      <button
        type="button"
        onClick={addItem}
        className="flex items-center gap-1.5 rounded-md border border-dashed border-gray-300 px-3 py-2 text-sm text-gray-500 hover:border-gray-400 hover:text-gray-700"
      >
        <Plus className="h-4 w-4" />
        {addLabel}
      </button>
    </div>
  );
}

function SortableItem({ id, children }: { id: string; children: ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
}
