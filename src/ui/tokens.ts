// src/ui/tokens.ts
// Single source of truth for Omni design tokens and dynamic theme engine.

import { DEFAULT_THEME, THEME_PRESET_COLORS } from '@/types';
import type { CssThemeVariables, ThemeConfig, UserProfile } from '@/types';

export const DESIGN_TOKENS = {
  radius: {
    sm: 'var(--radius-sm, 12px)',
    md: 'var(--radius, 20px)',
    full: '9999px',
  },
  shadows: {
    subtle: 'var(--shadow)',
    elevated: '0 8px 30px rgba(0, 0, 0, 0.08)',
  },
  typography: {
    display: "var(--font-display, 'Fraunces', serif)",
    body: "var(--font-body, 'Inter', sans-serif)",
    pixel: "var(--font-pixel, 'Press Start 2P', monospace)",
  },
};

/**
 * Injects CSS custom properties dynamically into document.documentElement.
 * When the user changes theme preset, custom background, or overrides,
 * all cards, borders, sidebar, text, and buttons update immediately.
 */
export function applyThemeToDocument(profile: UserProfile | null) {
  if (typeof document === 'undefined') return;

  const theme: ThemeConfig = profile?.themeConfig ?? DEFAULT_THEME;
  const basePreset = theme.preset === 'custom' ? 'clean_light' : theme.preset;
  document.documentElement.setAttribute('data-theme', basePreset);

  const baseColors = THEME_PRESET_COLORS[basePreset];
  const mergedColors: Record<string, string> = {
    ...baseColors,
    ...(theme.overrides as Record<string, string>),
  };

  // If user has a custom background color or image, apply it
  if (profile?.customBackground) {
    if (profile.backgroundType === 'image') {
      document.documentElement.style.setProperty(
        '--app-bg-image',
        `url("${profile.customBackground}")`
      );
    } else if (profile.backgroundType === 'color') {
      mergedColors['--bg'] = profile.customBackground;
      document.documentElement.style.removeProperty('--app-bg-image');
    }
  } else {
    document.documentElement.style.removeProperty('--app-bg-image');
  }

  Object.entries(mergedColors).forEach(([key, value]) => {
    if (value) {
      document.documentElement.style.setProperty(key, value);
    }
  });
}
