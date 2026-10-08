// src/types/index.ts
// Core TypeScript interfaces shared across OmniPlanner & Pixel AI Companion.

export type Language = 'en' | 'vi';

export type Gender = 'male' | 'female' | 'other';

export type Goal = 'productivity' | 'fitness' | 'habit' | 'life';

export type TaskCategory = 'work' | 'study' | 'fitness' | 'habit' | 'rest' | 'other';

export type ThemePreset = 'clean_light' | 'dark_minimal' | 'cyber_neon' | 'executive_slate' | 'custom';

export type AppMode = 'view' | 'edit';

export type CalendarViewMode = 'week' | 'month';

export type TabId =
  | 'today'
  | 'planner'
  | 'companion'
  | 'focus'
  | 'sounds'
  | 'settings'
  | 'profile'
  | 'social';

export type MascotMood = 'sad' | 'normal' | 'happy';

export type DashboardBlockId =
  | 'banner'
  | 'tasks'
  | 'companion_mini'
  | 'calendar'
  | 'timer'
  | 'stats'
  | 'music'
  | 'quote';

export interface DashboardBlockConfig {
  id: DashboardBlockId;
  visible: boolean;
  order: number;
}

/** react-grid-layout item: position + size, persisted per user (Requirement 4). */
export interface DashboardLayoutItem {
  i: DashboardBlockId;
  x: number;
  y: number;
  w: number;
  h: number;
}

export const DEFAULT_DASHBOARD_BLOCKS: DashboardBlockConfig[] = [
  { id: 'banner', visible: true, order: 0 },
  { id: 'tasks', visible: true, order: 1 },
  { id: 'companion_mini', visible: true, order: 2 },
  { id: 'calendar', visible: true, order: 3 },
  { id: 'timer', visible: true, order: 4 },
  { id: 'stats', visible: true, order: 5 },
  { id: 'music', visible: true, order: 6 },
  { id: 'quote', visible: true, order: 7 },
];

/** Default react-grid-layout configuration for the 12-column dashboard grid. */
export const DEFAULT_DASHBOARD_GRID: DashboardLayoutItem[] = [
  { i: 'banner', x: 0, y: 0, w: 12, h: 2 },
  { i: 'tasks', x: 0, y: 2, w: 7, h: 4 },
  { i: 'companion_mini', x: 7, y: 2, w: 5, h: 4 },
  { i: 'calendar', x: 0, y: 6, w: 12, h: 3 },
  { i: 'timer', x: 0, y: 9, w: 7, h: 4 },
  { i: 'stats', x: 7, y: 9, w: 5, h: 4 },
  { i: 'music', x: 0, y: 13, w: 5, h: 5 },
  { i: 'quote', x: 5, y: 13, w: 7, h: 5 },
];

/** Firestore doc: users/{uid}/memories/{memoryId} */
export interface AIMemory {
  id: string;
  content: string;
  category?: 'preference' | 'habit' | 'goal' | 'work' | 'personal' | 'fact';
  createdAt: number;
  updatedAt: number;
}

/** Firestore doc: users/{uid} */
export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  heightCm: number | null;
  weightKg: number | null;
  age: number | null;
  gender: Gender;
  goal: Goal;
  mascotUrl: string | null;
  customBackground?: string | null;
  backgroundType?: 'color' | 'image' | 'default';
  dashboardLayout?: DashboardBlockConfig[];
  themeConfig: ThemeConfig;
  language: Language;
  mode: AppMode;
  onboarded: boolean;
  // AI Companion Settings (Requirement 5)
  aiApiSource?: 'system' | 'personal';
  aiPersonalApiKey?: string | null;
  // Expanded personal profile (Requirement 6)
  profileData?: ProfileData;
  createdAt: number; // epoch ms
  updatedAt: number; // epoch ms
}

/** Personal profile data stored on the user doc (Requirement 6). */
export interface ProfileData {
  displayName: string;
  phone?: string | null;
  avatarUrl?: string | null;
  bio?: string;
  habits: string[];
  goals: string[];
  interests: string[];
  journalEntries: JournalEntry[];
  updatedAt: number;
}

export interface JournalEntry {
  id: string;
  text: string;
  createdAt: number;
}

/** Firestore doc: users/{uid}/posts/{postId} (Requirement 7). */
export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string | null;
  content: string;
  imageUrl?: string | null;
  createdAt: number;
  updatedAt: number;
  visibility: 'private' | 'friends' | 'public';
}

export interface ThemeConfig {
  preset: ThemePreset;
  overrides: Partial<CssThemeVariables>;
}

/** CSS custom properties the theme engine can override. */
export interface CssThemeVariables {
  '--bg': string;
  '--panel': string;
  '--panel-2': string;
  '--line': string;
  '--text': string;
  '--text-dim': string;
  '--accent': string;
  '--accent-2': string;
  '--sidebar-bg'?: string;
  '--sidebar-text'?: string;
  '--sidebar-dim'?: string;
  '--sidebar-active'?: string;
  '--sidebar-border'?: string;
}

/** Firestore doc: users/{uid}/tasks/{taskId} */
export interface Task {
  id: string;
  title: string;
  date: string; // 'YYYY-MM-DD'
  time: string | null; // 'HH:mm' or null
  category: TaskCategory;
  completed: boolean;
  source: 'manual' | 'ai_parsed' | 'ai_voice';
  createdAt: number;
  updatedAt: number;
}

/** Firestore doc: users/{uid}/habits/{habitId} */
export interface Habit {
  id: string;
  name: string;
  frequency: 'daily' | 'weekly' | 'weekdays';
  currentStreak: number;
  bestStreak: number;
  lastCompletedDate: string | null; // 'YYYY-MM-DD'
  createdAt: number;
  updatedAt: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'mascot';
  text: string;
  createdAt: number;
}

export interface FitnessMetrics {
  bmi: number;
  bmr: number;
  tdee: number;
  targetCalories: number;
}

export interface AuthFormState {
  email: string;
  password: string;
  displayName: string;
  mode: 'login' | 'register';
  error: string | null;
  loading: boolean;
}

/** Structured result the AI schedule parser returns before it's saved to Firestore. */
export interface ParsedTaskDraft {
  title: string;
  date: string; // 'YYYY-MM-DD'
  time: string | null;
  category: TaskCategory;
}

export type TimerMode = 'work' | 'short_rest' | 'long_rest' | 'custom';
export type TimerDirection = 'countdown' | 'countup';

export interface TimerState {
  mode: TimerMode;
  direction: TimerDirection;
  remainingSeconds: number;
  elapsedSeconds: number;
  customMinutes: number;
  running: boolean;
}

export const DEFAULT_THEME: ThemeConfig = {
  preset: 'clean_light',
  overrides: {},
};

export const THEME_PRESET_COLORS: Record<Exclude<ThemePreset, 'custom'>, CssThemeVariables> = {
  clean_light: {
    '--bg': '#F7F5EF',
    '--panel': '#FFFFFF',
    '--panel-2': '#F2EFE6',
    '--line': '#E4DFD0',
    '--text': '#1E231C',
    '--text-dim': '#6B7063',
    '--accent': '#2F6B4F',
    '--accent-2': '#C97B3D',
    '--sidebar-bg': '#1C3225',
    '--sidebar-text': '#D2DDD4',
    '--sidebar-dim': '#86A391',
    '--sidebar-active': '#2A4B38',
    '--sidebar-border': 'rgba(255,255,255,0.08)',
  },
  dark_minimal: {
    '--bg': '#14181A',
    '--panel': '#1C2124',
    '--panel-2': '#181C1E',
    '--line': '#2A3033',
    '--text': '#EDEFEE',
    '--text-dim': '#8B9296',
    '--accent': '#5FA98F',
    '--accent-2': '#E0A458',
    '--sidebar-bg': '#101416',
    '--sidebar-text': '#EDEFEE',
    '--sidebar-dim': '#8B9296',
    '--sidebar-active': '#1C2124',
    '--sidebar-border': '#2A3033',
  },
  cyber_neon: {
    '--bg': '#0B0E1A',
    '--panel': '#131A2E',
    '--panel-2': '#0E1322',
    '--line': '#232C48',
    '--text': '#E8ECFF',
    '--text-dim': '#8A93C4',
    '--accent': '#00E5C7',
    '--accent-2': '#FF3D9A',
    '--sidebar-bg': '#070913',
    '--sidebar-text': '#E8ECFF',
    '--sidebar-dim': '#8A93C4',
    '--sidebar-active': '#131A2E',
    '--sidebar-border': '#232C48',
  },
  executive_slate: {
    '--bg': '#1F2733',
    '--panel': '#28323F',
    '--panel-2': '#232C38',
    '--line': '#39434F',
    '--text': '#E7ECF1',
    '--text-dim': '#9AA6B2',
    '--accent': '#7C93B8',
    '--accent-2': '#C9A15A',
    '--sidebar-bg': '#181F29',
    '--sidebar-text': '#E7ECF1',
    '--sidebar-dim': '#9AA6B2',
    '--sidebar-active': '#28323F',
    '--sidebar-border': '#39434F',
  },
};
