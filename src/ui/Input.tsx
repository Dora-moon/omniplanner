// src/ui/Input.tsx
// Standardized Omni UI Input component with token-aware styles, label, and error display.

import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string | null;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, rightIcon, className = '', id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold text-[var(--text-dim)] select-none"
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 text-[var(--text-dim)] pointer-events-none flex items-center">
              {leftIcon}
            </div>
          )}

          <input
            id={inputId}
            ref={ref}
            className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm bg-[var(--panel-2)] text-[var(--text)] placeholder:text-[var(--text-dim)]/60 outline-none transition-all duration-150 focus:bg-[var(--panel)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15 ${
              leftIcon ? 'pl-10' : ''
            } ${rightIcon ? 'pr-10' : ''} ${
              error
                ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/15'
                : 'border-[var(--line)]'
            } ${className}`}
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-3 text-[var(--text-dim)] flex items-center">
              {rightIcon}
            </div>
          )}
        </div>

        {error && <p className="text-[11px] text-rose-500 font-medium">{error}</p>}
        {!error && helperText && (
          <p className="text-[11px] text-[var(--text-dim)]">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
