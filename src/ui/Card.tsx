// src/ui/Card.tsx
// Standardized Omni UI Card component using design tokens.

import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'panel' | 'subcard' | 'elevated';
  interactive?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ children, variant = 'panel', interactive = false, className = '', ...props }, ref) => {
    const variantStyles = {
      panel:
        'bg-[var(--panel)] border border-[var(--line)] rounded-3xl shadow-[var(--shadow)] text-[var(--text)]',
      subcard:
        'bg-[var(--panel-2)] border border-[var(--line)] rounded-2xl text-[var(--text)]',
      elevated:
        'bg-[var(--panel)] border border-[var(--line)] rounded-3xl shadow-lg text-[var(--text)]',
    };

    const interactiveStyle = interactive
      ? 'cursor-pointer hover:border-[var(--accent)] hover:shadow-md transition-all duration-150'
      : '';

    return (
      <div
        ref={ref}
        className={`${variantStyles[variant]} ${interactiveStyle} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
