import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        panel: 'var(--panel)',
        'panel-2': 'var(--panel-2)',
        line: 'var(--line)',
        text: 'var(--text)',
        'text-dim': 'var(--text-dim)',
        accent: 'var(--accent)',
        'accent-2': 'var(--accent-2)',
        'sidebar-bg': 'var(--sidebar-bg)',
        'sidebar-text': 'var(--sidebar-text)',
        'sidebar-dim': 'var(--sidebar-dim)',
        'sidebar-active': 'var(--sidebar-active)',
        'sidebar-border': 'var(--sidebar-border)',
      },
      fontFamily: {
        display: ['Fraunces', 'serif'],
        body: ['Inter', 'sans-serif'],
        pixel: ["'Press Start 2P'", 'monospace'],
      },
      borderRadius: {
        xl: 'var(--radius-sm, 8px)',
        '2xl': '12px',
        '3xl': 'var(--radius, 14px)',
      },
    },
  },
  plugins: [],
};

export default config;
