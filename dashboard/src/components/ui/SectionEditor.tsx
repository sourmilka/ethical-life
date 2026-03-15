import { useState, useCallback, type ReactNode } from 'react';
import { ChevronDown, Eye, EyeOff, Save } from 'lucide-react';
import { clsx } from 'clsx';
import { assetUrl } from '@/lib/api';

interface SectionEditorProps {
  title: string;
  visible?: boolean;
  onVisibilityChange?: (visible: boolean) => void;
  onSave?: (data: Record<string, unknown>) => void | Promise<void>;
  saving?: boolean;
  children: ReactNode;
  defaultExpanded?: boolean;
}

export function SectionEditor({
  title,
  visible = true,
  onVisibilityChange,
  onSave,
  saving,
  children,
  defaultExpanded = false,
}: SectionEditorProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="flex items-center gap-2 text-sm font-medium text-gray-900"
        >
          <ChevronDown
            className={clsx('h-4 w-4 transition-transform', expanded && 'rotate-180')}
          />
          {title}
        </button>

        <div className="flex items-center gap-2">
          {onVisibilityChange && (
            <button
              type="button"
              onClick={() => onVisibilityChange(!visible)}
              className="rounded p-1 text-gray-400 hover:text-gray-600"
              title={visible ? 'Hide section' : 'Show section'}
            >
              {visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </button>
          )}
        </div>
      </div>

      {expanded && (
        <div className="p-4 space-y-4">
          {children}
          {onSave && (
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => onSave({})}
                disabled={saving}
                className="flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Saving\u2026' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Field helpers for use inside SectionEditor ──

interface FieldProps {
  label: string;
  children: ReactNode;
  className?: string;
}

export function Field({ label, children, className }: FieldProps) {
  return (
    <div className={className}>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      {children}
    </div>
  );
}

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  multiline,
  rows = 3,
}: TextFieldProps) {
  const inputClass =
    'w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';

  return (
    <Field label={label}>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className={inputClass}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={inputClass}
        />
      )}
    </Field>
  );
}

interface ImageFieldProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  onPickImage?: () => void;
}

export function ImageField({ label, value, onChange, onPickImage }: ImageFieldProps) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value),
    [onChange],
  );

  return (
    <Field label={label}>
      <div className="flex items-center gap-2">
        {value && (
          <img src={assetUrl(value)} alt="" className="h-10 w-10 rounded border border-gray-200 object-cover" />
        )}
        <input
          type="text"
          value={value}
          onChange={handleChange}
          placeholder="Image URL"
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        {onPickImage && (
          <button
            type="button"
            onClick={onPickImage}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            Browse
          </button>
        )}
      </div>
    </Field>
  );
}
