// src/components/Sidebar.tsx
// Fixed left vertical sidebar matching Omni design tokens:
// Automatically reflects the active theme tokens (--sidebar-bg, --sidebar-active, --sidebar-border).

import React from 'react';
import {
  CalendarDays,
  LayoutDashboard,
  Bot,
  Timer,
  Music2,
  Settings,
  ChevronRight,
  LogOut,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { useTranslation } from '@/i18n/translations';
import type { Habit, Language, TabId, UserProfile } from '@/types';

interface SidebarProps {
  language: Language;
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  onLanguageChange: (lang: Language) => void;
  onLogout: () => void;
  saveStatus?: string;
  profile?: UserProfile | null;
  habits?: Habit[];
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

interface NavItem {
  id: TabId;
  labelKey:
    | 'tabToday'
    | 'tabPlanner'
    | 'tabCompanion'
    | 'tabFocus'
    | 'tabSounds'
    | 'tabSettings';
  icon: LucideIcon;
}

const PRIMARY_NAV_ITEMS: NavItem[] = [
  { id: 'today', labelKey: 'tabToday', icon: LayoutDashboard },
  { id: 'planner', labelKey: 'tabPlanner', icon: CalendarDays },
  { id: 'companion', labelKey: 'tabCompanion', icon: Bot },
  { id: 'focus', labelKey: 'tabFocus', icon: Timer },
  { id: 'sounds', labelKey: 'tabSounds', icon: Music2 },
];

export default function Sidebar({
  language,
  activeTab,
  onTabChange,
  onLanguageChange,
  onLogout,
  saveStatus,
  profile,
  habits = [],
  mobileOpen = false,
  onCloseMobile,
}: SidebarProps) {
  const { t } = useTranslation(language);

  // Best streak from habits
  const streak = habits.reduce((max, h) => Math.max(max, h.currentStreak), 0) || 7;
  const displayName = profile?.displayName || 'Alex';

  function handleTabClick(tab: TabId) {
    onTabChange(tab);
    onCloseMobile?.();
  }

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs md:hidden"
        />
      )}

      <aside
        className={`sidebar-container fixed inset-y-0 left-0 z-50 flex flex-col justify-between w-60 h-screen select-none transition-transform duration-200 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
        style={{
          backgroundColor: 'var(--sidebar-bg, #1C3225)',
          color: 'var(--sidebar-text, #D2DDD4)',
          borderRight: '1px solid var(--sidebar-border, rgba(255, 255, 255, 0.08))',
        }}
      >
        {/* Subtle decorative glow watermark */}
        <div
          className="pointer-events-none absolute bottom-0 left-0 right-0 h-64 opacity-10 overflow-hidden"
          style={{
            backgroundImage: `radial-gradient(circle at 10% 90%, var(--accent) 0%, transparent 60%), radial-gradient(circle at 80% 80%, var(--accent-2) 0%, transparent 50%)`,
          }}
        />

        {/* Top Header & Navigation */}
        <div className="flex flex-col px-4 pt-6 pb-2">
          {/* Brand Header */}
          <div className="flex items-center gap-2.5 px-2 mb-8">
            <div className="w-8 h-8 rounded-xl bg-white/10 p-1 flex items-center justify-center border border-white/15 shadow-inner flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="Omni Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-[19px] tracking-tight text-white font-sans">
                  Omni
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-white/15 text-white">
                  PRO
                </span>
              </div>
              <p
                className="text-[11px] font-normal leading-tight opacity-80"
                style={{ color: 'var(--sidebar-dim, #86A391)' }}
              >
                {t('omniTagline')}
              </p>
            </div>
          </div>

          {/* Navigation list */}
          <nav className="space-y-1.5">
            {PRIMARY_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleTabClick(item.id)}
                  style={{
                    backgroundColor: isActive
                      ? 'var(--sidebar-active, rgba(255, 255, 255, 0.12))'
                      : 'transparent',
                    color: isActive ? '#FFFFFF' : 'var(--sidebar-text, #D2DDD4)',
                  }}
                  className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-[13.5px] font-medium transition-all duration-150 text-left hover:bg-white/10 ${
                    isActive ? 'shadow-sm font-semibold' : ''
                  }`}
                >
                  <Icon
                    size={18}
                    style={{
                      color: isActive ? '#FFFFFF' : 'var(--sidebar-dim, #86A391)',
                    }}
                    className="transition-colors duration-150 flex-shrink-0"
                  />
                  <span className="flex-1">{t(item.labelKey)}</span>
                  {isActive && (
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Area: Settings, Lang Switcher & User Profile */}
        <div className="relative px-4 pb-5 pt-2">
          {/* Divider */}
          <div
            className="w-full h-px mb-3 opacity-30"
            style={{ backgroundColor: 'var(--sidebar-border, rgba(255, 255, 255, 0.1))' }}
          />

          {/* Settings button */}
          <button
            type="button"
            onClick={() => handleTabClick('settings')}
            style={{
              backgroundColor:
                activeTab === 'settings'
                  ? 'var(--sidebar-active, rgba(255, 255, 255, 0.12))'
                  : 'transparent',
              color: activeTab === 'settings' ? '#FFFFFF' : 'var(--sidebar-text, #D2DDD4)',
            }}
            className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-[13.5px] font-medium transition-all duration-150 text-left mb-3 hover:bg-white/10 ${
              activeTab === 'settings' ? 'shadow-sm font-semibold' : ''
            }`}
          >
            <Settings
              size={18}
              style={{
                color: activeTab === 'settings' ? '#FFFFFF' : 'var(--sidebar-dim, #86A391)',
              }}
              className="transition-colors flex-shrink-0"
            />
            <span className="flex-1">{t('tabSettings')}</span>
          </button>

          {/* Lang switcher & Save indicator */}
          <div
            className="flex items-center justify-between px-2 mb-3 text-[11px]"
            style={{ color: 'var(--sidebar-dim, #86A391)' }}
          >
            <div className="flex items-center bg-black/20 rounded-lg p-0.5 border border-white/10">
              <button
                type="button"
                onClick={() => onLanguageChange('en')}
                style={{
                  backgroundColor: language === 'en' ? 'var(--sidebar-active, #2A4B38)' : 'transparent',
                  color: language === 'en' ? '#FFFFFF' : 'inherit',
                }}
                className="px-2 py-0.5 rounded-md font-semibold text-[10px] transition-colors hover:text-white"
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => onLanguageChange('vi')}
                style={{
                  backgroundColor: language === 'vi' ? 'var(--sidebar-active, #2A4B38)' : 'transparent',
                  color: language === 'vi' ? '#FFFFFF' : 'inherit',
                }}
                className="px-2 py-0.5 rounded-md font-semibold text-[10px] transition-colors hover:text-white"
              >
                VI
              </button>
            </div>

            {saveStatus ? (
              <span className="text-[10px] text-emerald-400 font-medium">{saveStatus}</span>
            ) : (
              <div className="flex items-center gap-1 text-[10.5px]">
                <Sparkles size={11} className="text-amber-400" />
                <span>{streak}d streak</span>
              </div>
            )}

            <button
              type="button"
              onClick={onLogout}
              title={t('authLogout')}
              className="p-1 rounded-md text-white/60 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
            >
              <LogOut size={13} />
            </button>
          </div>

          {/* User Profile Card */}
          <div
            onClick={() => handleTabClick('settings')}
            className="flex items-center gap-3 p-2.5 rounded-xl bg-black/20 hover:bg-black/30 border border-white/10 cursor-pointer transition-all duration-150 group shadow-sm"
          >
            {/* Avatar */}
            <div className="relative w-9 h-9 rounded-full overflow-hidden bg-white/20 flex-shrink-0 flex items-center justify-center border border-white/20">
              {profile?.mascotUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.mascotUrl}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="font-semibold text-white text-sm">
                  {displayName.charAt(0).toUpperCase()}
                </span>
              )}
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#1C3225]" />
            </div>

            {/* User details */}
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-white truncate leading-tight">
                {displayName}
              </p>
              <p
                className="text-[11px] truncate flex items-center gap-1 mt-0.5"
                style={{ color: 'var(--sidebar-dim, #86A391)' }}
              >
                <span>Keep going!</span>
                <span>🌱</span>
              </p>
            </div>

            <ChevronRight
              size={15}
              className="text-white/40 group-hover:text-white transition-colors"
            />
          </div>
        </div>
      </aside>
    </>
  );
}
