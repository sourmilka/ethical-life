import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { PageHeader, Breadcrumb, StatusBadge, ConfirmDialog } from '@/components/ui';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical, Plus, Pencil, Trash2, Copy, Eye, Settings, Layers, Save, ChevronDown, ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';

// ── Types ──────────────────────────────────────────────
interface FormField {
  id: string;
  fieldKey: string;
  fieldType: string;
  label: string;
  placeholder?: string;
  helpText?: string;
  stepNumber: number;
  stepTitle?: string;
  sortOrder: number;
  isRequired: boolean;
  validationRules: Record<string, unknown>;
  options: string[];
  conditionalOn: Record<string, unknown> | null;
  defaultValue?: string;
}

interface FormDef {
  id: string;
  name: string;
  slug: string;
  description?: string;
  type: string;
  isMultiStep: boolean;
  submitButtonText: string;
  successMessage: string;
  redirectUrl?: string;
  requiresPayment: boolean;
  paymentAmount?: number;
  notificationEmails: string[];
  status: string;
  fields: FormField[];
}

type TabId = 'fields' | 'settings' | 'preview';

const FIELD_TYPES = [
  'text', 'email', 'phone', 'number', 'textarea', 'select', 'radio',
  'checkbox', 'date', 'time', 'file', 'url', 'hidden',
];

// ── Main Page ──────────────────────────────────────────
export function FormBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const isNew = id === 'new';

  const [tab, setTab] = useState<TabId>('fields');
  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [showFieldDialog, setShowFieldDialog] = useState(false);
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set([0]));
  const [deleteFieldTarget, setDeleteFieldTarget] = useState<FormField | null>(null);

  // Form settings state (for new + edits)
  const [settings, setSettings] = useState<Partial<FormDef>>({
    name: '', slug: '', description: '', type: 'intake', isMultiStep: true,
    submitButtonText: 'Submit', successMessage: 'Thank you for your submission.',
    redirectUrl: '', requiresPayment: false, paymentAmount: 0,
    notificationEmails: [], status: 'active',
  });

  const { data: form, isLoading } = useQuery({
    queryKey: ['form', id],
    queryFn: () => api<{ data: FormDef }>(`/forms/${id}`).then((r) => r.data),
    enabled: !isNew,
  });

  // Sync fetched form into settings state
  const isSettingsLoaded = useMemo(() => {
    if (form && settings.name === '' && !isNew) {
      setSettings({
        name: form.name, slug: form.slug, description: form.description ?? '',
        type: form.type, isMultiStep: form.isMultiStep,
        submitButtonText: form.submitButtonText, successMessage: form.successMessage,
        redirectUrl: form.redirectUrl ?? '', requiresPayment: form.requiresPayment,
        paymentAmount: form.paymentAmount ?? 0, notificationEmails: form.notificationEmails,
        status: form.status,
      });
      // expand all steps that have fields
      const steps = new Set(form.fields.map((f) => f.stepNumber));
      setExpandedSteps(steps.size > 0 ? steps : new Set([0]));
      return true;
    }
    return isNew || !!form;
  }, [form, isNew, settings.name]);

  const fields = form?.fields ?? [];

  // ── Mutations ──
  const saveMut = useMutation({
    mutationFn: async () => {
      const body = {
        name: settings.name, slug: settings.slug, description: settings.description,
        type: settings.type, isMultiStep: settings.isMultiStep,
        submitButtonText: settings.submitButtonText, successMessage: settings.successMessage,
        redirectUrl: settings.redirectUrl || null, requiresPayment: settings.requiresPayment,
        paymentAmount: settings.requiresPayment ? Number(settings.paymentAmount) : null,
        notificationEmails: settings.notificationEmails,
        status: settings.status,
      };
      if (isNew) {
        return api<{ data: FormDef }>('/forms', { method: 'POST', body });
      }
      return api<{ data: FormDef }>(`/forms/${id}`, { method: 'PATCH', body });
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['forms'] });
      qc.invalidateQueries({ queryKey: ['form', id] });
      toast.success(isNew ? 'Form created' : 'Form saved');
      if (isNew && res.data) navigate(`/dashboard/forms/builder/${res.data.id}`, { replace: true });
    },
  });

  const addFieldMut = useMutation({
    mutationFn: (body: Record<string, unknown>) => api('/forms/fields', { method: 'POST', body }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['form', id] });
      toast.success('Field added');
    },
  });

  const updateFieldMut = useMutation({
    mutationFn: ({ fid, body }: { fid: string; body: Record<string, unknown> }) =>
      api(`/forms/fields/${fid}`, { method: 'PATCH', body }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['form', id] });
      toast.success('Field updated');
    },
  });

  const deleteFieldMut = useMutation({
    mutationFn: (fid: string) => api(`/forms/fields/${fid}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['form', id] });
      toast.success('Field deleted');
      setDeleteFieldTarget(null);
    },
  });

  const reorderMut = useMutation({
    mutationFn: (ids: string[]) => api('/forms/fields/reorder', { method: 'POST', body: { ids } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['form', id] }),
  });

  const duplicateMut = useMutation({
    mutationFn: () => api(`/forms/${id}/duplicate`, { method: 'POST' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['forms'] });
      toast.success('Form duplicated');
      navigate('/dashboard/forms');
    },
  });

  // ── DnD ──
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // ── Grouped by step ──
  const steps = useMemo(() => {
    const map = new Map<number, FormField[]>();
    for (const f of fields) {
      const arr = map.get(f.stepNumber) ?? [];
      arr.push(f);
      map.set(f.stepNumber, arr);
    }
    // sort each step's fields by sortOrder
    for (const arr of map.values()) arr.sort((a, b) => a.sortOrder - b.sortOrder);
    return Array.from(map.entries()).sort(([a], [b]) => a - b);
  }, [fields]);

  function handleDragEnd(stepNumber: number) {
    return (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const stepFields = steps.find(([s]) => s === stepNumber)?.[1];
      if (!stepFields) return;
      const oldIdx = stepFields.findIndex((f) => f.id === active.id);
      const newIdx = stepFields.findIndex((f) => f.id === over.id);
      if (oldIdx === -1 || newIdx === -1) return;
      const reordered = arrayMove(stepFields, oldIdx, newIdx);
      reorderMut.mutate(reordered.map((f) => f.id));
    };
  }

  function toggleStep(n: number) {
    setExpandedSteps((prev) => {
      const next = new Set(prev);
      next.has(n) ? next.delete(n) : next.add(n);
      return next;
    });
  }

  function openAddField(stepNumber: number) {
    setEditingField({
      id: '', fieldKey: '', fieldType: 'text', label: '', placeholder: '', helpText: '',
      stepNumber, stepTitle: '', sortOrder: 0, isRequired: false,
      validationRules: {}, options: [], conditionalOn: null, defaultValue: '',
    });
    setShowFieldDialog(true);
  }

  function openEditField(f: FormField) {
    setEditingField({ ...f });
    setShowFieldDialog(true);
  }

  function handleFieldSave(data: FormField) {
    const body: Record<string, unknown> = {
      fieldKey: data.fieldKey, fieldType: data.fieldType, label: data.label,
      placeholder: data.placeholder || null, helpText: data.helpText || null,
      stepNumber: data.stepNumber, stepTitle: data.stepTitle || null,
      isRequired: data.isRequired, validationRules: data.validationRules,
      options: data.options, conditionalOn: data.conditionalOn,
      defaultValue: data.defaultValue || null,
    };
    if (data.id) {
      updateFieldMut.mutate({ fid: data.id, body }, { onSuccess: () => setShowFieldDialog(false) });
    } else {
      addFieldMut.mutate({ ...body, formDefinitionId: id }, { onSuccess: () => setShowFieldDialog(false) });
    }
  }

  if (!isNew && isLoading) return <div className="p-8 text-center text-gray-500">Loading…</div>;
  if (!isSettingsLoaded) return null;

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: 'Forms', to: '/dashboard/forms' },
        { label: isNew ? 'New Form' : (form?.name ?? '') },
      ]} />

      <PageHeader title={isNew ? 'New Form' : `Edit: ${form?.name ?? ''}`}
        description={isNew ? 'Create a new form definition' : `/${form?.slug ?? ''}`}
        actions={
          <div className="flex gap-2">
            {!isNew && (
              <button onClick={() => duplicateMut.mutate()}
                className="btn btn-secondary inline-flex items-center gap-2">
                <Copy className="w-4 h-4" /> Duplicate
              </button>
            )}
            <button onClick={() => saveMut.mutate()}
              className="btn btn-primary inline-flex items-center gap-2">
              <Save className="w-4 h-4" /> {isNew ? 'Create' : 'Save'}
            </button>
          </div>
        } />

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6">
          {([
            { id: 'fields' as TabId, label: 'Fields', icon: Layers },
            { id: 'settings' as TabId, label: 'Settings', icon: Settings },
            { id: 'preview' as TabId, label: 'Preview', icon: Eye },
          ]).map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 py-3 border-b-2 text-sm font-medium transition
                ${tab === t.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      {tab === 'fields' && (
        <FieldsTab
          isNew={isNew} steps={steps} expandedSteps={expandedSteps}
          toggleStep={toggleStep} openAddField={openAddField} openEditField={openEditField}
          setDeleteFieldTarget={setDeleteFieldTarget} handleDragEnd={handleDragEnd}
          sensors={sensors} isMultiStep={settings.isMultiStep ?? true}
        />
      )}
      {tab === 'settings' && (
        <SettingsTab settings={settings} setSettings={setSettings} />
      )}
      {tab === 'preview' && (
        <PreviewTab settings={settings} fields={fields} />
      )}

      {/* Field editor dialog */}
      {showFieldDialog && editingField && (
        <FieldEditorDialog field={editingField}
          onSave={handleFieldSave} onClose={() => setShowFieldDialog(false)} />
      )}

      {/* Delete confirm */}
      <ConfirmDialog open={!!deleteFieldTarget} onCancel={() => setDeleteFieldTarget(null)}
        title="Delete Field"
        message={`Delete field "${deleteFieldTarget?.label}"?`}
        onConfirm={() => { if (deleteFieldTarget) deleteFieldMut.mutate(deleteFieldTarget.id); }}
        variant="danger" />
    </div>
  );
}

// ── Fields Tab ─────────────────────────────────────────
function FieldsTab({
  isNew, steps, expandedSteps, toggleStep, openAddField, openEditField,
  setDeleteFieldTarget, handleDragEnd, sensors, isMultiStep,
}: {
  isNew: boolean;
  steps: [number, FormField[]][];
  expandedSteps: Set<number>;
  toggleStep: (n: number) => void;
  openAddField: (step: number) => void;
  openEditField: (f: FormField) => void;
  setDeleteFieldTarget: (f: FormField) => void;
  handleDragEnd: (step: number) => (e: DragEndEvent) => void;
  sensors: ReturnType<typeof useSensors>;
  isMultiStep: boolean;
}) {
  if (isNew) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Layers className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p className="text-lg font-medium">Save the form first</p>
        <p className="text-sm">Create the form to start adding fields.</p>
      </div>
    );
  }

  if (steps.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Layers className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p className="text-lg font-medium">No fields yet</p>
        <p className="text-sm mb-4">Add fields to build your form.</p>
        <button onClick={() => openAddField(0)}
          className="btn btn-primary inline-flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Field
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {steps.map(([stepNumber, stepFields]) => (
        <div key={stepNumber} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {/* Step header */}
          {isMultiStep && (
            <button onClick={() => toggleStep(stepNumber)}
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                {expandedSteps.has(stepNumber) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                Step {stepNumber + 1}
                {stepFields[0]?.stepTitle && <span className="text-gray-500">— {stepFields[0].stepTitle}</span>}
                <span className="text-xs text-gray-400 ml-2">({stepFields.length} fields)</span>
              </div>
            </button>
          )}

          {/* Fields list */}
          {(!isMultiStep || expandedSteps.has(stepNumber)) && (
            <div className="p-4 space-y-2">
              <DndContext sensors={sensors} collisionDetection={closestCenter}
                onDragEnd={handleDragEnd(stepNumber)}>
                <SortableContext items={stepFields.map((f) => f.id)}
                  strategy={verticalListSortingStrategy}>
                  {stepFields.map((f) => (
                    <SortableFieldItem key={f.id} field={f}
                      onEdit={() => openEditField(f)}
                      onDelete={() => setDeleteFieldTarget(f)} />
                  ))}
                </SortableContext>
              </DndContext>

              <button onClick={() => openAddField(stepNumber)}
                className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition flex items-center justify-center gap-1">
                <Plus className="w-4 h-4" /> Add Field
              </button>
            </div>
          )}
        </div>
      ))}

      {/* Add new step */}
      {isMultiStep && (
        <button onClick={() => openAddField(steps.length > 0 ? (steps[steps.length - 1]?.[0] ?? 0) + 1 : 0)}
          className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition flex items-center justify-center gap-1">
          <Plus className="w-4 h-4" /> Add New Step
        </button>
      )}
    </div>
  );
}

// ── Sortable Field Item ────────────────────────────────
function SortableFieldItem({ field, onEdit, onDelete }: {
  field: FormField; onEdit: () => void; onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: field.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style}
      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 group">
      <button {...attributes} {...listeners} className="cursor-grab text-gray-400 hover:text-gray-600">
        <GripVertical className="w-4 h-4" />
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm text-gray-900">{field.label}</span>
          {field.isRequired && <span className="text-red-500 text-xs">*</span>}
          <StatusBadge variant="info" label={field.fieldType} />
        </div>
        <div className="text-xs text-gray-500 truncate">
          key: {field.fieldKey}
          {field.placeholder && ` · "${field.placeholder}"`}
        </div>
      </div>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
        <button onClick={onEdit} className="p-1 text-gray-400 hover:text-blue-600">
          <Pencil className="w-4 h-4" />
        </button>
        <button onClick={onDelete} className="p-1 text-gray-400 hover:text-red-600">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ── Settings Tab ───────────────────────────────────────
function SettingsTab({ settings, setSettings }: {
  settings: Partial<FormDef>;
  setSettings: React.Dispatch<React.SetStateAction<Partial<FormDef>>>;
}) {
  const upd = (patch: Partial<FormDef>) => setSettings((s) => ({ ...s, ...patch }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* General */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <h3 className="font-semibold text-gray-900">General</h3>
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Name</span>
          <input type="text" value={settings.name ?? ''} onChange={(e) => upd({ name: e.target.value })}
            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500" />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Slug</span>
          <input type="text" value={settings.slug ?? ''} onChange={(e) => upd({ slug: e.target.value })}
            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500" />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Description</span>
          <textarea value={settings.description ?? ''} onChange={(e) => upd({ description: e.target.value })}
            rows={3} className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500" />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Type</span>
          <select value={settings.type ?? 'intake'} onChange={(e) => upd({ type: e.target.value })}
            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500">
            <option value="intake">Intake</option>
            <option value="contact">Contact</option>
            <option value="survey">Survey</option>
            <option value="order">Order</option>
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Status</span>
          <select value={settings.status ?? 'active'} onChange={(e) => upd({ status: e.target.value })}
            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500">
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={settings.isMultiStep ?? true}
            onChange={(e) => upd({ isMultiStep: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
          <span className="text-sm text-gray-700">Multi-step form</span>
        </label>
      </div>

      {/* Submission */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <h3 className="font-semibold text-gray-900">Submission</h3>
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Submit Button Text</span>
          <input type="text" value={settings.submitButtonText ?? 'Submit'}
            onChange={(e) => upd({ submitButtonText: e.target.value })}
            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500" />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Success Message</span>
          <textarea value={settings.successMessage ?? ''} onChange={(e) => upd({ successMessage: e.target.value })}
            rows={3} className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500" />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Redirect URL (optional)</span>
          <input type="url" value={settings.redirectUrl ?? ''} onChange={(e) => upd({ redirectUrl: e.target.value })}
            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500" />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Notification Emails (one per line)</span>
          <textarea value={(settings.notificationEmails ?? []).join('\n')}
            onChange={(e) => upd({ notificationEmails: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean) })}
            rows={3} className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500" />
        </label>
      </div>

      {/* Payment */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <h3 className="font-semibold text-gray-900">Payment</h3>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={settings.requiresPayment ?? false}
            onChange={(e) => upd({ requiresPayment: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
          <span className="text-sm text-gray-700">Requires payment</span>
        </label>
        {settings.requiresPayment && (
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Payment Amount</span>
            <input type="number" step="0.01" min="0" value={settings.paymentAmount ?? 0}
              onChange={(e) => upd({ paymentAmount: parseFloat(e.target.value) || 0 })}
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500" />
          </label>
        )}
      </div>
    </div>
  );
}

// ── Preview Tab ────────────────────────────────────────
function PreviewTab({ settings, fields }: { settings: Partial<FormDef>; fields: FormField[] }) {
  // Group by step
  const steps = useMemo(() => {
    const map = new Map<number, FormField[]>();
    for (const f of fields) {
      const arr = map.get(f.stepNumber) ?? [];
      arr.push(f);
      map.set(f.stepNumber, arr);
    }
    for (const arr of map.values()) arr.sort((a, b) => a.sortOrder - b.sortOrder);
    return Array.from(map.entries()).sort(([a], [b]) => a - b);
  }, [fields]);

  if (fields.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Eye className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p>No fields to preview yet.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-white border border-gray-200 rounded-lg p-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-1">{settings.name || 'Untitled Form'}</h2>
      {settings.description && <p className="text-gray-600 text-sm mb-6">{settings.description}</p>}

      {steps.map(([stepNum, stepFields]) => (
        <div key={stepNum} className="mb-6">
          {settings.isMultiStep && (
            <h3 className="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b border-gray-100">
              Step {stepNum + 1}{stepFields[0]?.stepTitle && `: ${stepFields[0].stepTitle}`}
            </h3>
          )}
          <div className="space-y-4">
            {stepFields.map((f) => (
              <PreviewField key={f.id} field={f} />
            ))}
          </div>
        </div>
      ))}

      <button className="mt-4 w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium">
        {settings.submitButtonText || 'Submit'}
      </button>
    </div>
  );
}

function PreviewField({ field }: { field: FormField }) {
  const label = (
    <span className="block text-sm font-medium text-gray-700 mb-1">
      {field.label} {field.isRequired && <span className="text-red-500">*</span>}
    </span>
  );
  const cls = "block w-full rounded-lg border-gray-300 shadow-sm text-sm";

  switch (field.fieldType) {
    case 'textarea':
      return <label>{label}<textarea rows={3} placeholder={field.placeholder} className={cls} readOnly /></label>;
    case 'select':
      return (
        <label>{label}
          <select className={cls} disabled>
            <option>{field.placeholder || 'Select…'}</option>
            {(field.options as string[]).map((o) => <option key={o}>{o}</option>)}
          </select>
        </label>
      );
    case 'radio':
      return (
        <div>{label}
          <div className="space-y-1">
            {(field.options as string[]).map((o) => (
              <label key={o} className="flex items-center gap-2 text-sm text-gray-700">
                <input type="radio" name={field.fieldKey} disabled /> {o}
              </label>
            ))}
          </div>
        </div>
      );
    case 'checkbox':
      return (
        <label className="flex items-center gap-2">
          <input type="checkbox" disabled className="h-4 w-4 rounded border-gray-300" />
          <span className="text-sm text-gray-700">{field.label}</span>
        </label>
      );
    case 'file':
      return <label>{label}<input type="file" className="text-sm" disabled /></label>;
    default:
      return (
        <label>{label}
          <input type={field.fieldType === 'email' ? 'email' : field.fieldType === 'number' ? 'number' : field.fieldType === 'date' ? 'date' : field.fieldType === 'time' ? 'time' : field.fieldType === 'url' ? 'url' : field.fieldType === 'phone' ? 'tel' : 'text'}
            placeholder={field.placeholder} className={cls} readOnly />
        </label>
      );
  }
}

// ── Field Editor Dialog ────────────────────────────────
function FieldEditorDialog({ field, onSave, onClose }: {
  field: FormField; onSave: (f: FormField) => void; onClose: () => void;
}) {
  const [data, setData] = useState<FormField>({ ...field });
  const upd = (patch: Partial<FormField>) => setData((d) => ({ ...d, ...patch }));
  const isEdit = !!field.id;
  const needsOptions = ['select', 'radio'].includes(data.fieldType);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {isEdit ? 'Edit Field' : 'Add Field'}
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Label</span>
            <input type="text" value={data.label} onChange={(e) => upd({ label: e.target.value })}
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Field Key</span>
            <input type="text" value={data.fieldKey} onChange={(e) => upd({ fieldKey: e.target.value })}
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500" />
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-medium text-gray-700">Field Type</span>
          <select value={data.fieldType} onChange={(e) => upd({ fieldType: e.target.value })}
            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500">
            {FIELD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Placeholder</span>
            <input type="text" value={data.placeholder ?? ''} onChange={(e) => upd({ placeholder: e.target.value })}
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Default Value</span>
            <input type="text" value={data.defaultValue ?? ''} onChange={(e) => upd({ defaultValue: e.target.value })}
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500" />
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-medium text-gray-700">Help Text</span>
          <input type="text" value={data.helpText ?? ''} onChange={(e) => upd({ helpText: e.target.value })}
            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500" />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Step Number</span>
            <input type="number" min="0" value={data.stepNumber}
              onChange={(e) => upd({ stepNumber: parseInt(e.target.value) || 0 })}
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Step Title</span>
            <input type="text" value={data.stepTitle ?? ''} onChange={(e) => upd({ stepTitle: e.target.value })}
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500" />
          </label>
        </div>

        {needsOptions && (
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Options (one per line)</span>
            <textarea value={(data.options as string[]).join('\n')}
              onChange={(e) => upd({ options: e.target.value.split('\n') })}
              rows={4} className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500" />
          </label>
        )}

        <label className="flex items-center gap-2">
          <input type="checkbox" checked={data.isRequired}
            onChange={(e) => upd({ isRequired: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
          <span className="text-sm text-gray-700">Required</span>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-gray-700">Validation Rules (JSON)</span>
          <textarea value={JSON.stringify(data.validationRules, null, 2)}
            onChange={(e) => { try { upd({ validationRules: JSON.parse(e.target.value) }); } catch {} }}
            rows={3} className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm font-mono text-xs focus:ring-blue-500 focus:border-blue-500" />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-gray-700">Conditional On (JSON, optional)</span>
          <textarea value={data.conditionalOn ? JSON.stringify(data.conditionalOn, null, 2) : ''}
            onChange={(e) => {
              if (!e.target.value.trim()) { upd({ conditionalOn: null }); return; }
              try { upd({ conditionalOn: JSON.parse(e.target.value) }); } catch {}
            }}
            rows={3} className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm font-mono text-xs focus:ring-blue-500 focus:border-blue-500" />
        </label>

        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="btn btn-secondary">Cancel</button>
          <button onClick={() => onSave(data)} className="btn btn-primary">
            {isEdit ? 'Update' : 'Add'} Field
          </button>
        </div>
      </div>
    </div>
  );
}
