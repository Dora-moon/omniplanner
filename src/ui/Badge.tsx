// src/ui/Badge.tsx
// Standardized Omni UI Badge & Pill component.

import React from 'react';
import type { TaskCategory } from '@/types';

export interface BadgeProps {
  children: React.ReactNode;
  category?: TaskCategory;
  variant?: 'neutral' | 'accent' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md';
  className?: string;
}

export const CATEGORY_BADGE_STYLES: Record<
  TaskCategory,
  { bg: string; text: string; border: string; labelEn: string; labelVi: string }
> = {
  work: { bg: '#EEECFD', text: '#4F46E5', border: '#E0DBFC', labelEn: 'Work', labelVi: 'Công việc' },
  study: { bg: '#E4F7ED', text: '#16A34A', border: '#D0F0DE', labelEn: 'Study', labelVi: 'Học tập' },
  fitness: { bg: '#FEF3E2', text: '#D97706', border: '#FCE7C8', labelEn: 'Health', labelVi: 'Sức khỏe' },
  habit: { bg: '#E3F8EE', text: '#059669', border: '#C6F2DC', labelEn: 'Habit', labelVi: 'Thói quen' },
  rest: { bg: '#E0F2FE', text: '#0284C7', border: '#BAE6FD', labelEn: 'Rest', labelVi: 'Nghỉ ngơi' },
  other: { bg: '#FCE8EF', text: '#E11D48', border: '#FAD1DE', labelEn: 'Personal', labelVi: 'Cá nhân' },
};

export function Badge({
  children,
  category,
  variant = 'neutral',
  size = 'md',
  className = '',
}: BadgeProps) {
  if (category) {
    const style = CATEGORY_BADGE_STYLES[category] || CATEGORY_BADGE_STYLES.other;
    return (
      <span
        style={{
          backgroundColor: style.bg,
          color: style.text,
          borderColor: style.border,
        }}
        className={`inline-flex items-center font-semibold rounded-full border leading-none ${
          size === 'sm' ? 'text-[9.5px] px-2 py-0.5' : 'text-[11px] px-2.5 py-1'
        } ${className}`}
      >
        {children}
      </span>
    );
  }

  const variantStyles = {
    neutral: 'bg-[var(--panel-2)] text-[var(--text-dim)] border-[var(--line)]',
    accent: 'bg-[var(--accent)]/12 text-[var(--accent)] border-[var(--accent)]/20',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
  };

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full border leading-none ${
        size === 'sm' ? 'text-[9.5px] px-2 py-0.5' : 'text-[11px] px-2.5 py-1'
      } ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
