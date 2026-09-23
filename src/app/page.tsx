'use client';

// src/app/page.tsx
// MVC Orchestrator: Assembles Controllers (useAuth, data subscriptions) and Views (Sidebar, Dashboards, Panels).
// Free of hardcoded colors and directly coordinates state with design tokens.

import { useEffect, useState } from 'react';
import { useAuth } from '@/controllers/useAuth';
import { subscribeTasks } from '@/models/task.model';
import { subscribeHabits } from '@/models/habit.model';
import type { ChatMessage, Habit, TabId, Task } from '@/types';
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
import { MusicProvider } from '@/context/MusicContext';

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

  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [activeTab, setActiveTab] = useState<TabId>('today');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Subscribe to Tasks and Habits when authUser is ready
  useEffect(() => {
    if (!authUser) {
      setTasks([]);
      setHabits([]);
      return;
    }
    const unsubTasks = subscribeTasks(authUser.uid, setTasks);
    const unsubHabits = subscribeHabits(authUser.uid, setHabits);
    return () => {
      unsubTasks();
      unsubHabits();
    };
  }, [authUser]);

  function handleSendMessage(userText: string, mascotReply: string) {
    const now = Date.now();
    setChatHistory((prev) => [
      ...prev,
      { id: `u-${now}`, role: 'user', text: userText, createdAt: now },
      { id: `m-${now + 1}`, role: 'mascot', text: mascotReply, createdAt: now + 1 },
    ]);
  }

  function handleTimerComplete() {
    const now = Date.now();
    const text =
      language === 'vi'
        ? 'Tập trung tốt lắm! Hãy nghỉ ngơi một chút nhé. 🔔'
        : 'Great focus session! Time for a short break. 🔔';
    setChatHistory((prev) => [
      ...prev,
      { id: `t-${now}`, role: 'mascot', text, createdAt: now },
    ]);
  }

  // 1. Auth loading state
  if (authUser === undefined) {
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

  // 3. Profile onboarding check
  if (profile === null || !profile.onboarded) {
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
    <MusicProvider>
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
            <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center p-0.5 border border-white/20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
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
            />
          )}

          {activeTab === 'planner' && (
            <div className="p-4 sm:p-6 max-w-7xl mx-auto">
              <CalendarView
                uid={authUser.uid}
                language={language}
                tasks={tasks}
                variant="full"
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
    </MusicProvider>
  );
}
