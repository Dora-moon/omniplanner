// src/ui/FileUpload.tsx
// Standardized file upload component replacing browser default file picker.
// Styled to match Omni rounded-3xl design tokens and CSS theme variables.

import React, { useRef, useState } from 'react';
import { UploadCloud, Image as ImageIcon, CheckCircle2, AlertCircle } from 'lucide-react';

export interface FileUploadProps {
  label?: string;
  accept?: string;
  maxSizeMB?: number;
  previewUrl?: string | null;
  loading?: boolean;
  error?: string | null;
  helperText?: string;
  disabled?: boolean;
  onFileSelect: (file: File) => void;
}

export function FileUpload({
  label,
  accept = 'image/png,image/gif,image/jpeg,image/webp',
  maxSizeMB = 5,
  previewUrl,
  loading = false,
  error,
  helperText,
  disabled = false,
  onFileSelect,
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  function handleFileChange(file: File) {
    if (file.size > maxSizeMB * 1024 * 1024) {
      alert(`File size exceeds limit (${maxSizeMB}MB)`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setLocalPreview(reader.result as string);
    reader.readAsDataURL(file);
    onFileSelect(file);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFileChange(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled || loading) return;
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileChange(file);
  }

  const activePreview = localPreview || previewUrl;

  return (
    <div className="w-full space-y-2 text-left">
      {label && (
        <label className="block text-xs font-semibold text-[var(--text-dim)] select-none">
          {label}
        </label>
      )}

      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => {
          if (!disabled && !loading) fileInputRef.current?.click();
        }}
        className={`group relative flex flex-col items-center justify-center p-5 rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer ${
          isDragOver
            ? 'border-[var(--accent)] bg-[var(--accent)]/10 scale-[1.01]'
            : 'border-[var(--line)] bg-[var(--panel-2)] hover:border-[var(--accent)] hover:bg-[var(--panel)]'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          disabled={disabled || loading}
          onChange={handleInputChange}
          className="hidden"
        />

        {activePreview ? (
          <div className="flex items-center gap-4 w-full">
            <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-[var(--line)] bg-white flex-shrink-0 shadow-xs">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activePreview}
                alt="Upload preview"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--accent)]">
                <CheckCircle2 size={15} />
                <span>Image selected</span>
              </div>
              <p className="text-[11px] text-[var(--text-dim)] mt-0.5">
                Click or drag another image to replace
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="w-10 h-10 rounded-xl bg-[var(--panel)] border border-[var(--line)] flex items-center justify-center text-[var(--accent)] shadow-2xs group-hover:scale-105 transition-transform">
              {loading ? (
                <span className="w-5 h-5 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
              ) : (
                <UploadCloud size={20} />
              )}
            </div>
            <div>
              <p className="text-xs font-semibold text-[var(--text)]">
                {loading ? 'Uploading image...' : 'Click to upload or drag & drop'}
              </p>
              <p className="text-[10.5px] text-[var(--text-dim)] mt-0.5">
                PNG, JPG, WEBP, or GIF (max {maxSizeMB}MB)
              </p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-1.5 text-xs text-rose-500 font-medium">
          <AlertCircle size={14} className="flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!error && helperText && (
        <p className="text-[11px] text-[var(--text-dim)]">{helperText}</p>
      )}
    </div>
  );
}
