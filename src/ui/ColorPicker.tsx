// src/ui/ColorPicker.tsx
// Standardized ColorPicker component with quick swatches and custom HEX selector.

import React from 'react';
import { Pipette } from 'lucide-react';

export interface ColorPickerProps {
  label?: string;
  value: string;
  presets?: string[];
  onChange: (hex: string) => void;
  disabled?: boolean;
}

const DEFAULT_PRESET_COLORS = [
  '#F7F5EF', // Warm Cream (Omni default)
  '#F2EFE6', // Muted Oat
  '#FAF8F3', // Soft Paper
  '#EFECE3', // Linen
  '#14181A', // Dark Obsidian
  '#1F2733', // Deep Slate
  '#0B0E1A', // Cyber Navy
  '#1F3A2E', // Pine Forest
  '#2C223B', // Twilight Purple
  '#FAF5FF', // Lavender Cream
];

export function ColorPicker({
  label,
  value,
  presets = DEFAULT_PRESET_COLORS,
  onChange,
  disabled = false,
}: ColorPickerProps) {
  return (
    <div className="w-full space-y-2 text-left">
      {label && (
        <label className="block text-xs font-semibold text-[var(--text-dim)] select-none">
          {label}
        </label>
      )}

      {/* Preset Swatches + Native HTML5 Color Trigger */}
      <div className="flex items-center gap-2 flex-wrap">
        {presets.map((color) => {
          const isSelected = value.toLowerCase() === color.toLowerCase();
          return (
            <button
              key={color}
              type="button"
              disabled={disabled}
              onClick={() => onChange(color)}
              title={color}
              style={{ backgroundColor: color }}
              className={`w-7 h-7 rounded-xl border transition-all duration-150 relative ${
                isSelected
                  ? 'border-[var(--accent)] scale-110 shadow-sm ring-2 ring-[var(--accent)]/30'
                  : 'border-[var(--line)] hover:scale-105'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {isSelected && (
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-[var(--text)]">
                  ✓
                </span>
              )}
            </button>
          );
        })}

        {/* Custom Color Input Trigger */}
        <label
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--line)] bg-[var(--panel-2)] hover:border-[var(--accent)] text-xs font-semibold text-[var(--text)] transition-all cursor-pointer ${
            disabled ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <Pipette size={13} className="text-[var(--text-dim)]" />
          <span className="font-mono text-[11px]">{value.toUpperCase()}</span>
          <input
            type="color"
            value={value}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value)}
            className="w-0 h-0 opacity-0 absolute"
          />
        </label>
      </div>
    </div>
  );
}
