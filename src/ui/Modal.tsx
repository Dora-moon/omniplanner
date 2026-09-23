// src/ui/Modal.tsx
// Standardized Omni UI Modal dialog with backdrop blur, animations, and token-aware styling.

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'md',
}: ModalProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthStyles = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-fade-in">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        className={`relative z-10 w-full ${maxWidthStyles[maxWidth]} bg-[var(--panel)] border border-[var(--line)] rounded-3xl p-6 sm:p-7 shadow-2xl text-[var(--text)] transition-all`}
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            {title && (
              <h3 className="text-lg font-bold font-sans tracking-tight text-[var(--text)]">
                {title}
              </h3>
            )}
            {description && (
              <p className="text-xs text-[var(--text-dim)] mt-0.5">{description}</p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 rounded-full text-[var(--text-dim)] hover:text-[var(--text)] hover:bg-[var(--panel-2)] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div>{children}</div>
      </div>
    </div>
  );
}
