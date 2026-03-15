import { useState, useRef, useCallback } from 'react';
import { Upload } from 'lucide-react';
import { clsx } from 'clsx';

interface FileUploaderProps {
  accept?: string;
  multiple?: boolean;
  onUpload: (files: File[]) => void | Promise<void>;
  label?: string;
  maxSizeMB?: number;
}

export function FileUploader({
  accept = 'image/*',
  multiple = false,
  onUpload,
  label = 'Drop files here or click to browse',
  maxSizeMB = 10,
}: FileUploaderProps) {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;
      setError('');

      const maxBytes = maxSizeMB * 1024 * 1024;
      const validFiles: File[] = [];

      for (const file of Array.from(files)) {
        if (file.size > maxBytes) {
          setError(`${file.name} exceeds ${maxSizeMB}MB limit`);
          return;
        }
        validFiles.push(file);
      }

      onUpload(validFiles);
    },
    [onUpload, maxSizeMB],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      processFiles(e.dataTransfer.files);
    },
    [processFiles],
  );

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={clsx(
          'flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors',
          dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400',
        )}
      >
        <Upload className="mb-2 h-8 w-8 text-gray-400" />
        <p className="text-sm text-gray-500">{label}</p>
        <p className="mt-1 text-xs text-gray-400">Max {maxSizeMB}MB</p>
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={(e) => processFiles(e.target.files)}
        className="hidden"
      />
    </div>
  );
}
