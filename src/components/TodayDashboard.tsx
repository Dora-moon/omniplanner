// src/components/TodayDashboard.tsx
// Main Omni dashboard adhering to Requirements 2, 3, 5, and 8:
// - Dynamic Edit Mode with Drag & Drop / Up-Down ordering, block visibility toggle, and Firestore persistence.
// - Fully synchronized global Lo-Fi music player using useMusic().
// - All UI components and cards refer to design tokens (--bg, --panel, --panel-2, --line, --accent).

import React, { useMemo, useState } from 'react';
import {
  Check,
  CheckCircle2,
  Flame,
  Plus,
  MoreHorizontal,
  BarChart2,
  TrendingUp,
  Sparkles,
  Music2,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Heart,
  Trash2,
  Sliders,
  Eye,
  EyeOff,
  GripVertical,
  RotateCcw,
} from 'lucide-react';
import { ResponsiveGridLayout, useContainerWidth } from 'react-grid-layout';
import { useTranslation } from '@/i18n/translations';
import { useTodayDashboard } from '@/controllers/useTodayDashboard';
import { useDashboardLayout } from '@/controllers/useDashboardLayout';
import { useMusic } from '@/context/MusicContext';
import { Modal, Input, Select, Button, Badge } from '@/ui';
import type {
  AppMode,
  ChatMessage,
  DashboardBlockId,
  Habit,
  Language,
  TabId,
  Task,
  TaskCategory,
  UserProfile,
} from '@/types';

import CalendarView from './CalendarView';
import PixelAssistant from './PixelAssistant';
import TimerModule from './TimerModule';

interface TodayDashboardProps {
  uid: string;
  language: Language;
  profile: UserProfile;
  tasks: Task[];
  habits: Habit[];
  chatHistory: ChatMessage[];
  onSendMessage: (userText: string, mascotReply: string) => void;
  onNavigateTab: (tab: TabId) => void;
  onTimerComplete?: (mode: string) => void;
  onModeChange?: (mode: AppMode) => void;
}

export default function TodayDashboard({
  uid,
  language,
  profile,
  tasks,
  habits,
  chatHistory,
  onSendMessage,
  onNavigateTab,
  onTimerComplete,
  onModeChange,
}: TodayDashboardProps) {
  const { t } = useTranslation(language);

  // Controller hook for Today's tasks
  const {
    todayISO,
    todaysTasks,
    completedCount,
    tasksLeftCount,
    streak,
    showAddModal,
    setShowAddModal,
    newTaskTitle,
    setNewTaskTitle,
    newTaskTime,
    setNewTaskTime,
    newTaskCategory,
    setNewTaskCategory,
    activeTaskMenu,
    setActiveTaskMenu,
    handleToggleTask,
    handleDeleteTask,
    handleCreateTask,
  } = useTodayDashboard({ uid, profile, tasks, habits });

  // Controller hook for react-grid-layout and debounced Firestore persistence
  const {
    grid,
    toggleBlockVisibility,
    isBlockVisible,
    isSaving: isLayoutSaving,
    handleLayoutChange,
    handleReset: handleResetLayout,
  } = useDashboardLayout({ uid });

  const [optimisticMode, setOptimisticMode] = useState<AppMode | null>(null);
  const currentMode = optimisticMode ?? profile.mode ?? 'view';
  const isEditMode = currentMode === 'edit';

  React.useEffect(() => {
    setOptimisticMode(null);
  }, [profile.mode]);

  function handleToggleEditMode() {
    const nextMode = isEditMode ? 'view' : 'edit';
    setOptimisticMode(nextMode);
    if (onModeChange) {
      onModeChange(nextMode);
    }
  }

  const { width, containerRef, mounted } = useContainerWidth({ initialWidth: 1200 });

  // Global Music Player hook (Requirement 5)
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    isLiked,
    isShuffle,
    togglePlay,
    nextTrack,
    prevTrack,
    seekTo,
    toggleLike,
    toggleShuffle,
  } = useMusic();

  // Time-based greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return t('greetingMorning');
    if (hour < 18) return t('greetingAfternoon');
    return t('greetingEvening');
  }, [t]);

  // Formatted date string for banner & card
  const formattedToday = useMemo(() => {
    const d = new Date();
    return d.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }, [language]);

  function handlePixelCTA() {
    onSendMessage(
      language === 'vi'
        ? 'Giúp tôi sắp xếp các công việc hôm nay!'
        : 'Help me organize my tasks for today!',
      language === 'vi'
        ? `Tuyệt vời! Bạn có ${todaysTasks.length} công việc hôm nay. Mình đề xuất bạn ưu tiên việc quan trọng nhất trước, kết hợp các phiên Pomodoro 25 phút nhé! 🎯`
        : `Awesome! You have ${todaysTasks.length} tasks today. I recommend starting with your most important task first and taking 5-minute stretch breaks after each focus block! 🎯`
    );
  }

  function formatAudioTime(seconds: number): string {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  const musicProgress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Map block IDs to labels
  const BLOCK_LABELS: Record<DashboardBlockId, string> = {
    banner: language === 'vi' ? 'Biểu ngữ' : 'Greeting Banner',
    tasks: t('blockTasks'),
    companion_mini: t('blockCompanion'),
    calendar: t('blockCalendar'),
    timer: t('blockTimer'),
    stats: t('blockStats'),
    music: t('blockMusic'),
    quote: t('blockQuote'),
  };

  const ALL_BLOCKS: DashboardBlockId[] = [
    'banner',
    'tasks',
    'companion_mini',
    'calendar',
    'timer',
    'stats',
    'music',
    'quote',
  ];

  const isVisible = (id: DashboardBlockId) => isBlockVisible(id);

  const visibleItems = useMemo(
    () => grid.filter((item) => isBlockVisible(item.i)),
    [grid, isBlockVisible]
  );

  /* ================= SUB-RENDERERS FOR EACH BLOCK ================= */

  // Block 1: Banner
  const renderBanner = () => (
    <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-[#F4E9DC] via-[#E8EFE3] to-[#DFEDE4] border border-[var(--line)] shadow-[var(--shadow)]">
      <div className="absolute inset-0 pointer-events-none opacity-40 overflow-hidden">
        <svg viewBox="0 0 900 240" preserveAspectRatio="none" className="w-full h-full object-cover">
          <path d="M0,180 Q200,80 450,150 T900,120 L900,240 L0,240 Z" fill="#9AB89D" />
          <path d="M0,200 Q280,120 600,180 T900,160 L900,240 L0,240 Z" fill="#749B7A" />
          <circle cx="700" cy="90" r="45" fill="#FCE5B8" opacity="0.6" />
        </svg>
      </div>

      <div className="hidden sm:block absolute top-6 right-8 text-right">
        <span className="font-serif italic text-[#4D6353] text-[15px] font-medium tracking-wide">
          &lsquo;{t('smallStepsQuote')}&rsquo;
        </span>
      </div>

      <div className="relative z-10">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#16271D] font-sans flex items-center gap-2">
          <span>
            {greeting}, {profile.displayName || 'Alex'}
          </span>
          <span className="inline-block animate-bounce">👋</span>
        </h1>
        <p className="text-sm sm:text-base text-[#57685A] mt-1 font-normal">
          {t('productiveSubtitle')}
        </p>

        <div className="flex items-center gap-3 mt-5 flex-wrap">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/85 backdrop-blur-sm border border-[#D8DFD5] shadow-xs text-xs font-semibold text-[#254633]">
            <CheckCircle2 size={15} className="text-emerald-600" />
            <span>
              {tasksLeftCount} {t('tasksLeft')}
            </span>
          </div>

          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/85 backdrop-blur-sm border border-[#D8DFD5] shadow-xs text-xs font-semibold text-[#8B4810]">
            <Flame size={15} className="text-amber-500 fill-amber-500" />
            <span>
              {streak} {t('dayStreak')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  // Block 2: Tasks
  const renderTasks = () => (
    <div className="bg-[var(--panel)] rounded-3xl p-6 border border-[var(--line)] shadow-[var(--shadow)] flex flex-col justify-between text-[var(--text)] transition-colors">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-bold text-[var(--text)] font-sans">
              {t('todaysTasks')}
            </h2>
            <span className="text-xs font-medium text-[var(--text-dim)] bg-[var(--panel-2)] px-2.5 py-0.5 rounded-full border border-[var(--line)]">
              {formattedToday}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full bg-[var(--panel-2)] hover:bg-[var(--panel)] text-[var(--accent)] border border-[var(--line)] transition-colors shadow-2xs"
          >
            <Plus size={13} />
            <span>{t('addTaskBtn')}</span>
          </button>
        </div>

        <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
          {todaysTasks.length === 0 ? (
            <div className="py-8 text-center text-xs text-[var(--text-dim)]">
              <p>{t('calNoTasks')}</p>
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="mt-2 text-[var(--accent)] font-semibold underline underline-offset-2"
              >
                {t('calAddTask')}
              </button>
            </div>
          ) : (
            todaysTasks.map((task) => (
              <div
                key={task.id}
                className="group relative flex items-center justify-between p-3 rounded-2xl border border-[var(--line)] bg-[var(--panel-2)]/60 hover:bg-[var(--panel-2)] transition-all shadow-2xs"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => handleToggleTask(task)}
                    className={`w-5 h-5 rounded-lg flex items-center justify-center border transition-all flex-shrink-0 ${
                      task.completed
                        ? 'bg-[var(--accent)] border-[var(--accent)] text-white shadow-xs'
                        : 'border-[var(--line)] hover:border-[var(--accent)] bg-[var(--panel)]'
                    }`}
                  >
                    {task.completed && <Check size={12} strokeWidth={3} />}
                  </button>

                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-[13px] font-medium leading-tight truncate ${
                        task.completed
                          ? 'line-through text-[var(--text-dim)]'
                          : 'text-[var(--text)]'
                      }`}
                    >
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge category={task.category} size="sm">
                        {task.category}
                      </Badge>
                      {task.time && (
                        <span className="text-[11px] text-[var(--text-dim)] font-medium">
                          {task.time}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() =>
                      setActiveTaskMenu(activeTaskMenu === task.id ? null : task.id)
                    }
                    className="text-[var(--text-dim)] hover:text-[var(--text)] p-1 rounded-md transition-colors"
                  >
                    <MoreHorizontal size={15} />
                  </button>

                  {activeTaskMenu === task.id && (
                    <div className="absolute right-0 top-7 z-20 bg-[var(--panel)] border border-[var(--line)] rounded-xl shadow-lg p-1 min-w-[100px]">
                      <button
                        type="button"
                        onClick={() => handleDeleteTask(task.id)}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg transition-colors text-left"
                      >
                        <Trash2 size={13} />
                        <span>Delete</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  // Block 3: Pixel Companion
  const renderCompanionMini = () => (
    <div className="h-full w-full flex flex-col">
      <PixelAssistant
        language={language}
        profile={profile}
        tasks={tasks}
        habits={habits}
        chatHistory={chatHistory}
        onSendMessage={onSendMessage}
        variant="compact"
        onOpenSettings={() => onNavigateTab('settings')}
      />
    </div>
  );

  // Block 4: Calendar Grid
  const renderCalendar = () => (
    <CalendarView uid={uid} language={language} tasks={tasks} variant="compact" profile={profile} />
  );

  // Block 5: Timer
  const renderTimer = () => (
    <TimerModule
      language={language}
      onSessionComplete={onTimerComplete}
      variant="compact"
    />
  );

  // Block 6: Stats
  const renderStats = () => (
    <div className="bg-[var(--panel)] rounded-3xl p-6 border border-[var(--line)] shadow-[var(--shadow)] flex flex-col justify-between text-[var(--text)]">
      <div>
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-6 h-6 rounded-lg bg-[var(--panel-2)] flex items-center justify-center text-[var(--accent)]">
            <BarChart2 size={15} />
          </div>
          <h3 className="text-base font-bold text-[var(--text)] font-sans">
            {t('thisWeek')}
          </h3>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs py-1 border-b border-[var(--line)]">
            <span className="text-[var(--text-dim)]">{t('focusTime')}</span>
            <div className="flex items-center gap-2 font-bold text-[var(--text)]">
              <span>6h 20m</span>
              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-semibold flex items-center">
                <TrendingUp size={11} className="mr-0.5" /> 20%
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs py-1 border-b border-[var(--line)]">
            <span className="text-[var(--text-dim)]">{t('tasksCompleted')}</span>
            <div className="flex items-center gap-2 font-bold text-[var(--text)]">
              <span>{completedCount + 8}</span>
              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-semibold flex items-center">
                <TrendingUp size={11} className="mr-0.5" /> 71%
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs py-1 border-b border-[var(--line)]">
            <span className="text-[var(--text-dim)]">{t('studyTime')}</span>
            <div className="flex items-center gap-2 font-bold text-[var(--text)]">
              <span>8h 15m</span>
              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-semibold flex items-center">
                <TrendingUp size={11} className="mr-0.5" /> 35%
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs py-1">
            <span className="text-[var(--text-dim)]">{t('activeStreak')}</span>
            <div className="flex items-center gap-1.5 font-bold text-[#D97706]">
              <Flame size={14} className="fill-amber-500 text-amber-500" />
              <span>{streak} days</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 p-3 rounded-2xl bg-[var(--panel-2)] border border-[var(--line)] text-xs font-semibold text-[var(--text)] flex items-center justify-center gap-2">
        <span>{t('cheerMessage')}</span>
      </div>
    </div>
  );

  // Block 7: Lo-Fi Music Player (Synchronized to Global Player - Requirement 5)
  const renderMusic = () => (
    <div className="bg-[var(--panel)] rounded-3xl p-5 border border-[var(--line)] shadow-[var(--shadow)] text-[var(--text)]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-[var(--panel-2)] flex items-center justify-center text-[var(--accent)]">
            <Music2 size={16} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[var(--text)]">{t('lofiBeats')}</h4>
            <p className="text-[10.5px] text-[var(--text-dim)]">{t('lofiSub')}</p>
          </div>
        </div>
      </div>

      {/* Album / landscape cover */}
      <div className="w-full h-32 rounded-2xl overflow-hidden bg-gradient-to-t from-[#36274D] via-[#7B4666] to-[#E88F6D] relative shadow-inner mb-3 flex items-end p-3">
        {currentTrack?.coverUrl && (
          <img
            src={currentTrack.coverUrl}
            alt={currentTrack.title}
            className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay"
          />
        )}
        <div className="relative z-10 flex items-center justify-between w-full">
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-black/40 text-amber-200 backdrop-blur-xs">
            {currentTrack?.type === 'youtube' ? 'YouTube Feed' : 'SoundCloud'}
          </span>
          {isPlaying && (
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
          )}
        </div>
      </div>

      {/* Title & Artist */}
      <div className="flex items-center justify-between mb-2">
        <div className="min-w-0 flex-1 mr-2">
          <h5 className="text-[13px] font-bold text-[var(--text)] leading-tight truncate">
            {currentTrack?.title || t('lofiTrack')}
          </h5>
          <p className="text-[11px] text-[var(--text-dim)] truncate">
            {currentTrack?.artist || t('lofiArtist')}
          </p>
        </div>
        <button
          type="button"
          onClick={toggleLike}
          className={`p-1.5 rounded-full transition-colors ${
            isLiked ? 'text-rose-500 fill-rose-500' : 'text-[var(--text-dim)] hover:text-rose-500'
          }`}
        >
          <Heart size={16} fill={isLiked ? 'currentColor' : 'none'} />
        </button>
      </div>

      {/* Interactive Progress Bar */}
      <div className="space-y-1 mb-3">
        <input
          type="range"
          min={0}
          max={duration || 100}
          value={currentTime}
          disabled={currentTrack?.isLive}
          onChange={(e) => seekTo(Number(e.target.value))}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-[var(--line)] accent-[var(--accent)] outline-none"
        />
        <div className="flex justify-between text-[10px] text-[var(--text-dim)] font-mono">
          <span>{currentTrack?.isLive ? 'LIVE' : formatAudioTime(currentTime)}</span>
          <span>{currentTrack?.isLive ? 'LIVE' : formatAudioTime(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between px-2">
        <button
          type="button"
          onClick={toggleShuffle}
          className={`transition-colors p-1 ${
            isShuffle ? 'text-[var(--accent)] font-bold' : 'text-[var(--text-dim)] hover:text-[var(--text)]'
          }`}
        >
          <Shuffle size={14} />
        </button>
        <button
          type="button"
          onClick={prevTrack}
          className="text-[var(--text-dim)] hover:text-[var(--text)] transition-colors p-1"
        >
          <SkipBack size={16} />
        </button>
        <button
          type="button"
          onClick={togglePlay}
          className="w-10 h-10 rounded-full bg-[var(--accent)] hover:brightness-105 text-white flex items-center justify-center shadow-sm transition-transform active:scale-95"
        >
          {isPlaying ? (
            <Pause size={16} className="fill-white" />
          ) : (
            <Play size={16} className="fill-white translate-x-[1px]" />
          )}
        </button>
        <button
          type="button"
          onClick={nextTrack}
          className="text-[var(--text-dim)] hover:text-[var(--text)] transition-colors p-1"
        >
          <SkipForward size={16} />
        </button>
        <button
          type="button"
          onClick={() => onNavigateTab('sounds')}
          className="text-[var(--text-dim)] hover:text-[var(--accent)] transition-colors text-[11px] font-semibold"
        >
          Full
        </button>
      </div>
    </div>
  );

  // Block 8: Quote
  const renderQuote = () => (
    <div className="rounded-3xl p-5 bg-[var(--panel-2)] border border-[var(--line)] shadow-[var(--shadow)] flex items-center justify-between gap-4 text-[var(--text)]">
      <div className="space-y-1">
        <span className="text-sm">🌱</span>
        <p className="font-serif italic text-xs leading-relaxed text-[var(--text)] font-medium">
          &ldquo;{t('quoteCardText')}&rdquo;
        </p>
      </div>
      <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center text-2xl relative">
        <Sparkles size={12} className="absolute -top-1 -left-1 text-amber-400" />
        <span>👾</span>
        <Sparkles size={10} className="absolute bottom-0 right-0 text-emerald-500" />
      </div>
    </div>
  );

  const RENDER_MAP: Record<DashboardBlockId, () => React.ReactNode> = {
    banner: renderBanner,
    tasks: renderTasks,
    companion_mini: renderCompanionMini,
    calendar: renderCalendar,
    timer: renderTimer,
    stats: renderStats,
    music: renderMusic,
    quote: renderQuote,
  };

  return (
    <div className="w-full min-h-screen bg-[var(--bg)] text-[var(--text)] p-4 lg:p-7 transition-colors">
      <div className="max-w-[1360px] mx-auto space-y-6">
        {/* ================= EDIT MODE / LAYOUT TOOLBAR ================= */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--panel)] border border-[var(--line)] shadow-xs flex-wrap gap-3">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleToggleEditMode}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                isEditMode
                  ? 'bg-[var(--accent)] text-white shadow-xs'
                  : 'bg-[var(--panel-2)] text-[var(--text)] border border-[var(--line)] hover:border-[var(--accent)]'
              }`}
            >
              <Sliders size={13} />
              <span>{isEditMode ? t('editModeDone') : t('editMode')}</span>
            </button>

            {isEditMode ? (
              <span className="text-xs text-[var(--accent)] font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-ping" />
                {t('editModeActive') || 'Edit Mode Active'} — {language === 'vi' ? 'Kéo để di chuyển, kéo góc dưới phải để đổi kích thước' : 'Drag to move, pull bottom-right corner to resize'}
              </span>
            ) : (
              <span className="text-xs text-[var(--text-dim)] hidden sm:inline">
                {language === 'vi' ? 'Bố cục tự do (Drag & Resize) đã được khóa' : 'Dashboard layout is locked'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isLayoutSaving && (
              <span className="text-xs text-[var(--accent)] animate-pulse font-medium">
                {language === 'vi' ? 'Đang lưu...' : 'Saving...'}
              </span>
            )}

            {isEditMode && (
              <button
                type="button"
                onClick={handleResetLayout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-[var(--text-dim)] hover:text-[var(--text)] bg-[var(--panel-2)] border border-[var(--line)] transition-colors hover:border-[var(--accent)]"
              >
                <RotateCcw size={12} />
                <span>{t('resetLayout')}</span>
              </button>
            )}
          </div>
        </div>

        {/* ================= EDIT MODE VISIBILITY PILLS (when Edit mode is ON) ================= */}
        {isEditMode && (
          <div className="p-4 rounded-3xl bg-[var(--panel-2)] border-2 border-dashed border-[var(--accent)]/60 space-y-2.5 animate-fade-in">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-[var(--text)] uppercase tracking-wider">
                {language === 'vi' ? 'Bật / Ẩn các khối hiển thị' : 'Toggle Block Visibility'}
              </span>
              <span className="text-[11px] text-[var(--text-dim)]">
                {language === 'vi' ? 'Nhấn để ẩn hoặc hiện khối trên Dashboard' : 'Click to hide or show cards on Dashboard'}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {ALL_BLOCKS.map((blockId) => {
                const visible = isBlockVisible(blockId);
                return (
                  <button
                    key={blockId}
                    type="button"
                    onClick={() => toggleBlockVisibility(blockId)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      visible
                        ? 'bg-[var(--panel)] border border-[var(--accent)] text-[var(--accent)] font-semibold shadow-xs'
                        : 'bg-[var(--panel)]/40 border border-[var(--line)] text-[var(--text-dim)] line-through opacity-60'
                    }`}
                  >
                    {visible ? <Eye size={13} /> : <EyeOff size={13} />}
                    <span>{BLOCK_LABELS[blockId] || blockId}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ================= REACT-GRID-LAYOUT DASHBOARD ================= */}
        <div ref={containerRef as any} className="w-full min-h-[400px]">
          {!mounted ? (
            <div className="w-full py-16 flex items-center justify-center text-xs text-[var(--text-dim)]">
              <span className="animate-spin inline-block mr-2">✦</span>
              <span>{language === 'vi' ? 'Đang tải bố cục...' : 'Loading layout...'}</span>
            </div>
          ) : (
            <ResponsiveGridLayout
              className="layout"
              width={width}
              layouts={{
                lg: visibleItems,
                md: visibleItems,
                sm: visibleItems.map((i) => ({
                  ...i,
                  w: Math.min(i.w, 6),
                  x: i.x >= 6 ? 0 : i.x,
                })),
                xs: visibleItems.map((i) => ({ ...i, w: 4, x: 0 })),
                xxs: visibleItems.map((i) => ({ ...i, w: 2, x: 0 })),
              }}
              breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
              cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
              rowHeight={85}
              margin={[16, 16]}
              dragConfig={{
                enabled: isEditMode,
                handle: '.drag-handle',
              }}
              resizeConfig={{
                enabled: isEditMode,
              }}
              onLayoutChange={(currentLayout) => {
                if (isEditMode) {
                  handleLayoutChange(currentLayout);
                }
              }}
            >
              {visibleItems.map((item) => (
                <div key={item.i} className="h-full">
                  <div
                    className={`h-full relative flex flex-col transition-shadow ${
                      isEditMode
                        ? 'ring-2 ring-dashed ring-[var(--accent)]/50 rounded-3xl p-1 bg-[var(--panel-2)]/20 shadow-md'
                        : ''
                    }`}
                  >
                    {isEditMode && (
                      <div className="absolute top-2 right-2 z-20 flex items-center gap-1.5 bg-[var(--panel)]/95 backdrop-blur-xs border border-[var(--line)] rounded-full px-2.5 py-1 shadow-sm">
                        <span className="text-[11px] font-bold text-[var(--text)] uppercase tracking-wider drag-handle cursor-grab active:cursor-grabbing flex items-center gap-1 select-none">
                          <GripVertical size={13} className="text-[var(--accent)]" />
                          {BLOCK_LABELS[item.i] || item.i}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleBlockVisibility(item.i)}
                          title={language === 'vi' ? 'Ẩn khối này' : 'Hide this block'}
                          className="text-[var(--text-dim)] hover:text-red-500 p-0.5 ml-1 transition-colors"
                        >
                          <EyeOff size={13} />
                        </button>
                      </div>
                    )}
                    <div className="h-full w-full overflow-hidden rounded-3xl">
                      {RENDER_MAP[item.i] ? RENDER_MAP[item.i]() : null}
                    </div>
                  </div>
                </div>
              ))}
            </ResponsiveGridLayout>
          )}
        </div>
      </div>

      {/* Quick Add Task Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={t('calAddTask')}
      >
        <form onSubmit={handleCreateTask} className="space-y-4">
          <Input
            label={t('calNewTaskTitle')}
            type="text"
            required
            autoFocus
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="e.g. Finish UI design for the project"
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label={t('calNewTaskTime')}
              type="text"
              value={newTaskTime}
              onChange={(e) => setNewTaskTime(e.target.value)}
              placeholder="09:00 - 11:00"
            />

            <Select
              label={t('calNewTaskCategory')}
              value={newTaskCategory}
              onChange={(e) => setNewTaskCategory(e.target.value as TaskCategory)}
            >
              <option value="work">Work</option>
              <option value="study">Study</option>
              <option value="fitness">Health / Fitness</option>
              <option value="habit">Habit</option>
              <option value="rest">Rest</option>
              <option value="other">Personal</option>
            </Select>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowAddModal(false)}
            >
              {t('calCancel')}
            </Button>
            <Button type="submit" variant="primary">
              {t('calSave')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
