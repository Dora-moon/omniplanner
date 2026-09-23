// src/ui/Button.tsx
// Standardized Omni UI Button supporting all design token variants.

import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  block?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'secondary',
      size = 'md',
      loading = false,
      block = false,
      leftIcon,
      rightIcon,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyle =
      'inline-flex items-center justify-center font-medium transition-all select-none active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100';

    const sizeStyles = {
      sm: 'text-xs px-3 py-1.5 rounded-full gap-1.5',
      md: 'text-xs sm:text-sm px-4 py-2 rounded-full gap-2',
      lg: 'text-sm sm:text-base px-6 py-3 rounded-full gap-2.5 font-semibold',
    };

    const variantStyles = {
      primary:
        'bg-[var(--accent)] hover:brightness-105 text-white border border-[var(--accent)] shadow-xs',
      secondary:
        'bg-[var(--panel-2)] hover:bg-[var(--panel)] text-[var(--text)] border border-[var(--line)] hover:border-[var(--accent)] shadow-2xs',
      outline:
        'bg-transparent hover:bg-[var(--panel-2)] text-[var(--text)] border border-[var(--line)] hover:border-[var(--accent)]',
      ghost:
        'bg-transparent hover:bg-[var(--panel-2)] text-[var(--text-dim)] hover:text-[var(--text)] border-transparent',
      danger:
        'bg-rose-500 hover:bg-rose-600 text-white border border-rose-500 shadow-xs',
    };

    const widthStyle = block ? 'w-full' : '';

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`${baseStyle} ${sizeStyles[size]} ${variantStyles[variant]} ${widthStyle} ${className}`}
        {...props}
      >
        {loading && (
          <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin flex-shrink-0" />
        )}
        {!loading && leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
        <span>{children}</span>
        {!loading && rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
