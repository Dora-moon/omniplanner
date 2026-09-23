// src/ui/Select.tsx
// Standardized Omni UI Select dropdown component.

import React from 'react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string | null;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, children, className = '', id, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-xs font-semibold text-[var(--text-dim)] select-none"
          >
            {label}
          </label>
        )}

        <select
          id={selectId}
          ref={ref}
          className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm bg-[var(--panel-2)] text-[var(--text)] outline-none transition-all duration-150 focus:bg-[var(--panel)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15 border-[var(--line)] ${className}`}
          {...props}
        >
          {children}
        </select>

        {error && <p className="text-[11px] text-rose-500 font-medium">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
