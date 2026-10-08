'use client';

// src/app/social/page.tsx
// Dedicated Social Feed route (Requirement 6)

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/controllers/useAuth';
import SocialView from '@/components/SocialView';
import Sidebar from '@/components/Sidebar';
import AuthModal from '@/components/AuthModal';
import OnboardingModal from '@/components/OnboardingModal';
import type { TabId } from '@/types';
import { Menu } from 'lucide-react';

export default function SocialPage() {
  const router = useRouter();
  const {
    authUser,
    profile,
    language,
    setLanguage,
    onLogout,
    onOnboardingComplete,
  } = useAuth();

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // 1. Loading
  if (authUser === undefined || (authUser && profile === undefined)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] text-[var(--text)]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-[var(--text-dim)]">Loading Feed...</p>
        </div>
      </div>
    );
  }

  // 2. Auth gate
  if (!authUser) {
    return <AuthModal language={language} onLanguageChange={setLanguage} />;
  }

  // 3. Onboarding gate
  if (!profile || profile.onboarded === false) {
    return (
      <OnboardingModal
        language={language}
        onComplete={onOnboardingComplete}
      />
    );
  }

  function handleTabChange(tab: TabId) {
    if (tab === 'social') return;
    if (tab === 'profile') {
      router.push('/profile');
      return;
    }
    if (tab === 'settings') {
      router.push('/settings');
      return;
    }
    router.push(`/?tab=${tab}`);
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen text-[var(--text)] bg-[var(--bg)] transition-colors">
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
          <div className="w-7 h-7 rounded-lg overflow-hidden flex items-center justify-center border border-white/20">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <span className="font-bold text-base tracking-tight font-sans">Omni</span>
            <span className="text-[10px] ml-2 font-normal opacity-75">
              Social Feed
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

      {/* Sidebar */}
      <Sidebar
        language={language}
        activeTab="social"
        onTabChange={handleTabChange}
        onLanguageChange={setLanguage}
        onLogout={onLogout}
        profile={profile}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content */}
      <main className="flex-1 min-w-0 md:ml-60 max-w-full p-4 sm:p-6 lg:p-8">
        <SocialView
          uid={authUser.uid}
          profile={profile}
          language={language}
        />
      </main>
    </div>
  );
}
