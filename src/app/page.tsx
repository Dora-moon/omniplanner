'use client';

// src/app/page.tsx
// MVC Orchestrator: Assembles Controllers (useAuth, data subscriptions) and Views (Sidebar, Dashboards, Panels).
// Free of hardcoded colors and directly coordinates state with design tokens.

import { useEffect, useState } from 'react';
import { useAuth } from '@/controllers/useAuth';
import { useDashboardData } from '@/controllers/useDashboardData';
import type { TabId } from '@/types';
import { Menu } from 'lucide-react';

import AuthModal from '@/components/AuthModal';
import OnboardingModal from '@/components/OnboardingModal';
import Sidebar from '@/components/Sidebar';
import TodayDashboard from '@/components/TodayDashboard';
import CalendarView from '@/components/CalendarView';
import PixelAssistant from '@/components/PixelAssistant';
import TimerModule from '@/components/TimerModule';
import MusicPlayer from '@/components/MusicPlayer';
import SettingsPanel from '@/components/SettingsPanel';
import ProfileView from '@/components/ProfileView';
import SocialView from '@/components/SocialView';

export default function Page() {
  const {
    authUser,
    profile,
    language,
    setLanguage,
    onModeChange,
    onLogout,
    onOnboardingComplete,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<TabId>('today');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Sync tab with URL search parameter if present
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab') as TabId;
      if (
        tab &&
        ['today', 'planner', 'companion', 'focus', 'sounds', 'profile', 'social', 'settings'].includes(tab)
      ) {
        setActiveTab(tab);
      }
    }
  }, []);

  const {
    tasks,
    habits,
    chatHistory,
    handleSendMessage,
    handleTimerComplete,
  } = useDashboardData({ uid: authUser?.uid, language });

  // 1. Auth & Profile loading state
  if (authUser === undefined || (authUser && profile === undefined)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] text-[var(--text)]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-[var(--text-dim)]">Loading Omni...</p>
        </div>
      </div>
    );
  }

  // 2. Auth gate
  if (!authUser) {
    return <AuthModal language={language} onLanguageChange={setLanguage} />;
  }

  // 3. Profile onboarding check (only if profile is null/undefined or onboarded === false)
  if (!profile || profile.onboarded === false) {
    return (
      <OnboardingModal
        language={language}
        onComplete={onOnboardingComplete}
      />
    );
  }

  const hasCustomBgImage =
    profile.backgroundType === 'image' && Boolean(profile.customBackground);

  return (
    <div
      id="app"
      data-has-image={hasCustomBgImage ? 'true' : 'false'}
      className="app-bg-wrapper flex flex-col md:flex-row min-h-screen text-[var(--text)] transition-colors"
    >
      {/* Mobile Top Header */}
      <div
        className="md:hidden flex items-center justify-between px-4 py-3 sticky top-0 z-30 border-b shadow-xs transition-colors"
        style={{
          backgroundColor: 'var(--sidebar-bg, #1C3225)',
          borderColor: 'var(--sidebar-border, rgba(255, 255, 255, 0.1))',
          color: 'var(--sidebar-text, #FFFFFF)',
        }}
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl overflow-hidden flex items-center justify-center border border-white/20 flex-shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <span className="font-bold text-base tracking-tight font-sans">Omni</span>
            <span className="text-[10px] ml-2 font-normal opacity-75">
              Better You, Every Day
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setMobileSidebarOpen(true)}
          className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Left Vertical Sidebar View */}
      <Sidebar
        language={language}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLanguageChange={setLanguage}
        onLogout={onLogout}
        profile={profile}
        habits={habits}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <main className="app-content-layer flex-1 min-w-0 md:ml-60 max-w-full">
        {activeTab === 'today' && (
          <TodayDashboard
            uid={authUser.uid}
            language={language}
            profile={profile}
            tasks={tasks}
            habits={habits}
            chatHistory={chatHistory}
            onSendMessage={handleSendMessage}
            onNavigateTab={setActiveTab}
            onTimerComplete={handleTimerComplete}
            onModeChange={onModeChange}
          />
        )}

        {activeTab === 'planner' && (
          <div className="p-4 sm:p-6 max-w-7xl mx-auto">
            <CalendarView
              uid={authUser.uid}
              language={language}
              tasks={tasks}
              variant="full"
              profile={profile}
            />
          </div>
        )}

        {activeTab === 'companion' && (
          <div className="p-4 sm:p-6 max-w-7xl mx-auto">
            <PixelAssistant
              language={language}
              profile={profile}
              tasks={tasks}
              habits={habits}
              chatHistory={chatHistory}
              onSendMessage={handleSendMessage}
              variant="full"
            />
          </div>
        )}

        {activeTab === 'focus' && (
          <div className="p-4 sm:p-6 max-w-7xl mx-auto">
            <TimerModule
              language={language}
              onSessionComplete={handleTimerComplete}
              variant="full"
            />
          </div>
        )}

        {activeTab === 'sounds' && (
          <div className="p-4 sm:p-6 max-w-7xl mx-auto">
            <MusicPlayer language={language} />
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            <ProfileView
              uid={authUser.uid}
              profile={profile}
              language={language}
            />
          </div>
        )}

        {activeTab === 'social' && (
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            <SocialView
              uid={authUser.uid}
              profile={profile}
              language={language}
            />
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="p-4 sm:p-6 max-w-7xl mx-auto">
            <SettingsPanel
              uid={authUser.uid}
              language={language}
              profile={profile}
              onModeChange={onModeChange}
            />
          </div>
        )}
      </main>
    </div>
  );
}
