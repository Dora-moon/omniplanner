// src/components/PixelAssistant.tsx
// Pixel AI Companion view adhering to Requirement 6:
// Renders the pixel mascot and context & memory-aware chat interface.

import React, { useEffect, useRef } from 'react';
import { Send, Settings, Sparkles, Brain, Check } from 'lucide-react';
import { useTranslation } from '@/i18n/translations';
import { useCompanion } from '@/controllers/useCompanion';
import { Badge } from '@/ui';
import type { ChatMessage, Habit, Language, Task, UserProfile } from '@/types';

interface PixelAssistantProps {
  language: Language;
  profile: UserProfile;
  tasks: Task[];
  habits: Habit[];
  chatHistory: ChatMessage[];
  onSendMessage: (userText: string, mascotReply: string) => void;
  variant?: 'full' | 'compact';
  onOpenSettings?: () => void;
}

const SPRITES: Record<'sad' | 'normal' | 'happy', string[]> = {
  sad: ['..0000..', '.0AAAA0.', '0A0XX0A0', '0AXAAXA0', '0A0000A0', '0A0AA0A0', '..0..0..', '.00..00.'],
  normal: ['..0000..', '.0AAAA0.', '0A0XX0A0', '0AXAAXA0', '0AAAAAA0', '0A0BB0A0', '..0..0..', '.00..00.'],
  happy: ['..0000..', '.0AAAA0.', '0A0YY0A0', '0A0AA0A0', '0AYAAYA0', '0A0AA0A0', '..0..0..', '.00..00.'],
};

export default function PixelAssistant({
  language,
  profile,
  tasks,
  habits,
  chatHistory,
  onSendMessage,
  variant = 'full',
  onOpenSettings,
}: PixelAssistantProps) {
  const { t } = useTranslation(language);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const logRef = useRef<HTMLDivElement>(null);

  const {
    input,
    setInput,
    status,
    loading,
    mood,
    metrics,
    bestStreak,
    completionPct,
    completedCount,
    todaysTasks,
    memories,
    handleSend,
  } = useCompanion({
    uid: profile.uid,
    language,
    profile,
    tasks,
    habits,
    chatHistory,
    onSendMessage,
  });

  // Mascot Canvas Renderer
  useEffect(() => {
    if (profile.mascotUrl) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const grid = SPRITES[mood];
    const px = 12;
    canvas.width = grid[0].length * px;
    canvas.height = grid.length * px;
    const cs = getComputedStyle(document.documentElement);
    const colors: Record<string, string> = {
      '0': cs.getPropertyValue('--line').trim() || '#E4DFD0',
      A: cs.getPropertyValue('--accent').trim() || '#2F6B4F',
      X: '#141414',
      Y: '#FFFFFF',
      B: cs.getPropertyValue('--accent-2').trim() || '#C97B3D',
    };
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    grid.forEach((row, y) => {
      [...row].forEach((c, x) => {
        if (c === '.') return;
        ctx.fillStyle = colors[c] || '#000';
        ctx.fillRect(x * px, y * px, px, px);
      });
    });
  }, [mood, profile.mascotUrl]);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [chatHistory, loading]);

  const quickSuggestions = [
    { label: t('chipPlanMyDay'), icon: '📝' },
    { label: t('chipMotivation'), icon: '💡' },
    { label: t('chipStudy'), icon: '🎵' },
    { label: t('chipChat'), icon: '🤗' },
  ];

  /* ================= COMPACT VARIANT (Inside Today Dashboard) ================= */
  if (variant === 'compact') {
    return (
      <div className="bg-[var(--panel)] rounded-3xl border border-[var(--line)] shadow-[var(--shadow)] flex flex-col overflow-hidden text-[var(--text)] transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-[var(--line)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[var(--panel-2)] border border-[var(--line)] flex items-center justify-center text-sm shadow-xs overflow-hidden flex-shrink-0">
              {profile.mascotUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.mascotUrl} alt="Pixel" className="w-full h-full object-cover" />
              ) : (
                <span>👾</span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-[14px] font-bold text-[var(--text)] leading-tight">
                  {t('aiCompanionTitle')}
                </h3>
                {memories.length > 0 && (
                  <span
                    title={t('memorySub')}
                    className="flex items-center gap-0.5 text-[9.5px] font-bold px-1.5 py-0.2 rounded-full bg-[var(--accent)]/15 text-[var(--accent)]"
                  >
                    <Brain size={10} />
                    <span>{memories.length}</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[var(--text-dim)] leading-tight">
                {t('aiCompanionSub')}
              </p>
            </div>
          </div>

          {onOpenSettings && (
            <button
              type="button"
              onClick={onOpenSettings}
              title="Open Settings to view memories"
              className="text-[var(--text-dim)] hover:text-[var(--accent)] transition-colors p-1"
            >
              <Settings size={16} />
            </button>
          )}
        </div>

        {/* Chat message bubbles list */}
        <div
          ref={logRef}
          className="h-56 overflow-y-auto px-4 py-3 space-y-2.5 bg-[var(--panel-2)]/50 text-xs"
        >
          {chatHistory.length === 0 ? (
            <div className="flex flex-col gap-2.5 pt-2">
              <div className="self-end bg-[var(--accent)] text-white px-3.5 py-2 rounded-2xl rounded-tr-xs max-w-[85%] leading-relaxed shadow-xs">
                {language === 'vi' ? 'Hôm nay mình hơi mệt một chút...' : "I'm feeling a bit tired today..."}
              </div>
              <div className="self-start bg-[var(--panel)] border border-[var(--line)] text-[var(--text)] px-3.5 py-2 rounded-2xl rounded-tl-xs max-w-[85%] leading-relaxed shadow-xs flex items-start gap-2">
                <span className="text-sm">👾</span>
                <div>
                  {language === 'vi'
                    ? 'Không sao đâu! 💙 Bạn đã làm việc rất chăm chỉ rồi. Nghỉ ngơi một chút, nghe nhạc rồi tiếp tục nhé!'
                    : "That's okay! 💙 You've already done a lot. How about a short break, some music, and then we continue? I'm right here!"}
                </div>
              </div>
            </div>
          ) : (
            chatHistory.map((m) => (
              <div
                key={m.id}
                className={`max-w-[85%] px-3.5 py-2 rounded-2xl text-[12px] leading-relaxed shadow-xs ${
                  m.role === 'user'
                    ? 'self-end bg-[var(--accent)] text-white rounded-tr-xs'
                    : 'self-start bg-[var(--panel)] border border-[var(--line)] text-[var(--text)] rounded-tl-xs flex items-start gap-1.5'
                }`}
              >
                {m.role === 'mascot' && <span className="text-xs">👾</span>}
                <div className="flex-1 whitespace-pre-wrap">{m.text}</div>
              </div>
            ))
          )}

          {loading && (
            <div className="self-start bg-[var(--panel)] border border-[var(--line)] px-3 py-1.5 rounded-2xl text-[11px] text-[var(--text-dim)] flex items-center gap-1.5 shadow-xs">
              <span className="inline-block animate-spin">✦</span>
              <span>{t('thinking')}…</span>
            </div>
          )}

          {!loading && status && (
            <div className="self-start bg-red-500/10 border border-red-500/20 text-red-500 px-3 py-1.5 rounded-2xl text-[11px] flex items-center gap-1.5 shadow-xs max-w-[90%]">
              <span className="flex-shrink-0">⚠️</span>
              <span className="break-words">{status}</span>
            </div>
          )}
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-4 py-2 bg-[var(--panel)] border-t border-[var(--line)] flex flex-col gap-1.5">
          <div className="grid grid-cols-2 gap-1.5">
            {quickSuggestions.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSend(item.label)}
                disabled={loading}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-[var(--line)] hover:border-[var(--accent)] bg-[var(--panel-2)] hover:bg-[var(--panel)] text-[11px] font-medium text-[var(--text)] transition-all text-left truncate shadow-2xs"
              >
                <span>{item.icon}</span>
                <span className="truncate">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Message Input Field */}
        <div className="p-3 bg-[var(--panel)] border-t border-[var(--line)]">
          <div className="flex items-center gap-2 bg-[var(--panel-2)] rounded-full border border-[var(--line)] px-3 py-1.5 focus-within:border-[var(--accent)] focus-within:bg-[var(--panel)] transition-colors">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={t('chatPlaceholder')}
              className="flex-1 bg-transparent text-xs text-[var(--text)] outline-none placeholder:text-[var(--text-dim)]/60"
            />
            <button
              type="button"
              disabled={loading || !input.trim()}
              onClick={() => handleSend()}
              className="w-7 h-7 rounded-full bg-[var(--accent)] disabled:opacity-40 text-white flex items-center justify-center transition-colors flex-shrink-0 shadow-xs hover:brightness-105 active:scale-95"
            >
              <Send size={12} className="translate-x-[1px]" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ================= FULL PAGE VARIANT ================= */
  return (
    <div className="omni-card p-6 sm:p-8 space-y-6">
      <div className="flex items-center justify-between border-b border-[var(--line)] pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-[var(--text)]">
            {t('compTitle')}
          </h2>
          <p className="text-xs text-[var(--text-dim)] mt-1">{t('compSub')}</p>
        </div>

        {memories.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--panel-2)] border border-[var(--line)] text-xs font-semibold text-[var(--text)]">
            <Brain size={14} className="text-[var(--accent)]" />
            <span>
              {memories.length} {language === 'vi' ? 'ký ức được lưu' : 'memories stored'}
            </span>
          </div>
        )}
      </div>

      <div className="companion-wrap">
        <div className="companion-visual">
          {profile.mascotUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.mascotUrl}
              alt="Pixel mascot"
              width={96}
              height={96}
              style={{
                imageRendering: 'pixelated',
                borderRadius: 16,
                border: '1px solid var(--line)',
              }}
            />
          ) : (
            <canvas ref={canvasRef} width={96} height={96} />
          )}
          <div className="mascot-tag mt-3 font-pixel text-[9px] text-[var(--accent)] uppercase tracking-wider">
            PIXEL ·{' '}
            {t(mood === 'happy' ? 'moodHappy' : mood === 'sad' ? 'moodSad' : 'moodNormal')}
          </div>
        </div>

        <div className="companion-chat">
          <div className="chatlog max-h-80 overflow-y-auto pr-2 space-y-2.5" ref={logRef}>
            {chatHistory.length === 0 && (
              <div className="text-center py-10 text-xs text-[var(--text-dim)]">
                {language === 'vi' ? 'Bắt đầu trò chuyện với Pixel!' : 'Say hi to Pixel!'}
              </div>
            )}
            {chatHistory.map((m) => (
              <div
                key={m.id}
                className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${
                  m.role === 'user'
                    ? 'self-end bg-[var(--accent)] text-white rounded-tr-xs'
                    : 'self-start bg-[var(--panel-2)] border border-[var(--line)] text-[var(--text)] rounded-tl-xs'
                }`}
              >
                {m.text}
              </div>
            ))}
          </div>

          <div className="flex gap-2 mt-4">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={t('chatPlaceholder')}
              className="omni-input flex-1"
            />
            <button
              type="button"
              disabled={loading || !input.trim()}
              onClick={() => handleSend()}
              className="omni-btn primary"
            >
              {t('chatSend')}
            </button>
          </div>
          <div className={`ai-status text-xs text-[var(--text-dim)] mt-2 ${loading ? 'loading' : ''}`}>
            {status}
          </div>
        </div>
      </div>

      <div className="companion-stats grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-[var(--line)]">
        <div className="stat-card p-3 rounded-2xl bg-[var(--panel-2)] border border-[var(--line)]">
          <div className="text-[10.5px] uppercase font-bold text-[var(--text-dim)] tracking-wider">
            {t('statBmi')}
          </div>
          <div className="font-serif text-xl font-bold text-[var(--text)] mt-1">
            {metrics ? metrics.bmi : '—'}
          </div>
        </div>
        <div className="stat-card p-3 rounded-2xl bg-[var(--panel-2)] border border-[var(--line)]">
          <div className="text-[10.5px] uppercase font-bold text-[var(--text-dim)] tracking-wider">
            {t('statTdee')}
          </div>
          <div className="font-serif text-xl font-bold text-[var(--text)] mt-1">
            {metrics ? `${metrics.targetCalories} kcal` : '—'}
          </div>
        </div>
        <div className="stat-card p-3 rounded-2xl bg-[var(--panel-2)] border border-[var(--line)]">
          <div className="text-[10.5px] uppercase font-bold text-[var(--text-dim)] tracking-wider">
            {t('statTasks')}
          </div>
          <div className="font-serif text-xl font-bold text-[var(--text)] mt-1">
            {completedCount}/{todaysTasks.length}
          </div>
        </div>
        <div className="stat-card p-3 rounded-2xl bg-[var(--panel-2)] border border-[var(--line)]">
          <div className="text-[10.5px] uppercase font-bold text-[var(--text-dim)] tracking-wider">
            {t('statStreak')}
          </div>
          <div className="font-serif text-xl font-bold text-amber-500 mt-1">
            {bestStreak} days
          </div>
        </div>
      </div>
    </div>
  );
}
