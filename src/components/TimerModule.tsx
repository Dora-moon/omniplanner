// src/components/TimerModule.tsx
// Smart Focus Timer adhering to Requirement 4:
// - 2 modes: Countdown (customizable target, counts to 0) & Count-up (unlimited stopwatch for tracked work).
// - Web Audio harmonic bell chime upon session finish or stop.
// - Custom duration input (not just defaults).
// - Responsive compact and full variants using Omni design tokens.

import React, { useState } from 'react';
import { useTranslation } from '@/i18n/translations';
import { useTimer, formatTime } from '@/controllers/useTimer';
import { Button, Input } from '@/ui';
import type { Language, TimerDirection, TimerMode } from '@/types';
import { Play, Pause, RotateCcw, Clock, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';

interface TimerModuleProps {
  language: Language;
  onSessionComplete?: (mode: TimerMode) => void;
  variant?: 'full' | 'compact';
}

export default function TimerModule({
  language,
  onSessionComplete,
  variant = 'full',
}: TimerModuleProps) {
  const { t } = useTranslation(language);
  const {
    direction,
    setDirection,
    mode,
    switchMode,
    customMinutes,
    setCustomDuration,
    remaining,
    elapsed,
    running,
    totalDuration,
    toggle,
    reset,
  } = useTimer({ onSessionComplete });

  const [customInput, setCustomInput] = useState(customMinutes.toString());
  const [showCustomModal, setShowCustomModal] = useState(false);

  // Time to display
  const displaySeconds = direction === 'countdown' ? remaining : elapsed;

  function handleCustomSubmit(e: React.FormEvent) {
    e.preventDefault();
    const val = parseInt(customInput, 10);
    if (!isNaN(val) && val > 0) {
      setCustomDuration(val);
      switchMode('custom', val);
      setShowCustomModal(false);
    }
  }

  /* ================= COMPACT VARIANT (Inside Today Dashboard) ================= */
  if (variant === 'compact') {
    const progress =
      direction === 'countdown'
        ? Math.max(0, Math.min(1, 1 - remaining / (totalDuration || 1)))
        : Math.min(1, (elapsed % 3600) / 3600);

    const radius = 48;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference * (1 - progress);

    return (
      <div className="bg-[var(--panel)] rounded-3xl p-5 border border-[var(--line)] shadow-[var(--shadow)] text-[var(--text)] transition-colors flex flex-col md:flex-row items-center gap-5">
        {/* Cozy aesthetic illustration on left */}
        <div className="w-full md:w-44 h-44 rounded-2xl overflow-hidden flex-shrink-0 relative bg-[var(--panel-2)] flex items-center justify-center border border-[var(--line)]">
          <svg viewBox="0 0 200 200" className="w-full h-full object-cover">
            <defs>
              <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#F9DFB8" />
                <stop offset="60%" stopColor="#FCEFD8" />
                <stop offset="100%" stopColor="#E9F1E2" />
              </linearGradient>
              <linearGradient id="sunGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FAD477" />
                <stop offset="100%" stopColor="#F39C42" />
              </linearGradient>
            </defs>
            <rect width="200" height="200" fill="url(#skyGrad)" />
            <path d="M-20,160 Q40,110 110,140 T220,150 L220,200 L-20,200 Z" fill="#C4D6B5" opacity="0.6" />
            <path d="M-10,175 Q60,135 150,165 T230,170 L230,200 L-10,200 Z" fill="#9FB88D" opacity="0.8" />
            <circle cx="150" cy="70" r="32" fill="url(#sunGrad)" opacity="0.85" />
            <line x1="100" y1="0" x2="100" y2="160" stroke="#FFFFFF" strokeWidth="4" opacity="0.7" />
            <line x1="0" y1="80" x2="200" y2="80" stroke="#FFFFFF" strokeWidth="4" opacity="0.7" />
            <rect x="0" y="155" width="200" height="45" fill="#C9986A" />
            <rect x="0" y="155" width="200" height="6" fill="#DEC2A2" />
            {/* Potted plants on sill */}
            <path d="M22,155 L28,185 L52,185 L58,155 Z" fill="#B35D38" />
            <path d="M40,155 C35,130 18,125 15,115 C10,128 30,138 38,155" fill="#3D6E4A" />
            <path d="M40,155 C45,120 70,115 75,105 C70,125 50,135 42,155" fill="#4B865B" />
            <path d="M40,155 C40,110 50,100 52,90 C45,110 38,125 40,155" fill="#2E5A3A" />
            {/* Sleeping orange cat */}
            <ellipse cx="140" cy="168" rx="26" ry="14" fill="#E68A36" />
            <circle cx="120" cy="166" r="11" fill="#E68A36" />
            <polygon points="113,158 116,150 122,157" fill="#BF681E" />
            <polygon points="121,157 125,149 129,158" fill="#BF681E" />
            <path d="M116,166 Q119,169 122,166" stroke="#522405" strokeWidth="1.5" fill="none" />
            <path d="M165,166 C175,164 178,155 174,150 C170,146 167,155 163,164" fill="#E68A36" />
          </svg>
        </div>

        {/* Focus timer details & ring */}
        <div className="flex-1 w-full min-w-0">
          {/* Header & Direction Switcher */}
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div>
              <h3 className="text-base font-bold font-sans text-[var(--text)]">
                {t('focusSession')}
              </h3>
              <p className="text-xs text-[var(--text-dim)]">
                {direction === 'countdown' ? t('timerCountdown') : t('timerCountup')}
              </p>
            </div>

            {/* Direction Toggle Pills */}
            <div className="flex items-center bg-[var(--panel-2)] p-0.5 rounded-full border border-[var(--line)] text-[10.5px] font-semibold">
              <button
                type="button"
                onClick={() => setDirection('countdown')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full transition-all ${
                  direction === 'countdown'
                    ? 'bg-[var(--accent)] text-white shadow-2xs'
                    : 'text-[var(--text-dim)] hover:text-[var(--text)]'
                }`}
              >
                <ArrowDownCircle size={12} />
                <span>{t('timerCountdown')}</span>
              </button>
              <button
                type="button"
                onClick={() => setDirection('countup')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full transition-all ${
                  direction === 'countup'
                    ? 'bg-[var(--accent)] text-white shadow-2xs'
                    : 'text-[var(--text-dim)] hover:text-[var(--text)]'
                }`}
              >
                <ArrowUpCircle size={12} />
                <span>{t('timerCountup')}</span>
              </button>
            </div>
          </div>

          {/* Mode presets if in countdown */}
          {direction === 'countdown' && (
            <div className="flex items-center gap-1.5 mb-3 overflow-x-auto pb-1 text-[11px]">
              <button
                type="button"
                onClick={() => switchMode('work')}
                className={`px-2.5 py-1 rounded-full font-medium transition-all ${
                  mode === 'work'
                    ? 'bg-[var(--accent)] text-white'
                    : 'bg-[var(--panel-2)] text-[var(--text-dim)] hover:text-[var(--text)] border border-[var(--line)]'
                }`}
              >
                {t('timerWork')}
              </button>
              <button
                type="button"
                onClick={() => switchMode('short_rest')}
                className={`px-2.5 py-1 rounded-full font-medium transition-all ${
                  mode === 'short_rest'
                    ? 'bg-[var(--accent)] text-white'
                    : 'bg-[var(--panel-2)] text-[var(--text-dim)] hover:text-[var(--text)] border border-[var(--line)]'
                }`}
              >
                {t('timerShort')}
              </button>
              <button
                type="button"
                onClick={() => switchMode('long_rest')}
                className={`px-2.5 py-1 rounded-full font-medium transition-all ${
                  mode === 'long_rest'
                    ? 'bg-[var(--accent)] text-white'
                    : 'bg-[var(--panel-2)] text-[var(--text-dim)] hover:text-[var(--text)] border border-[var(--line)]'
                }`}
              >
                {t('timerLong')}
              </button>
              <button
                type="button"
                onClick={() => setShowCustomModal(true)}
                className={`px-2.5 py-1 rounded-full font-medium transition-all ${
                  mode === 'custom'
                    ? 'bg-[var(--accent)] text-white'
                    : 'bg-[var(--panel-2)] text-[var(--text-dim)] hover:text-[var(--text)] border border-[var(--line)]'
                }`}
              >
                {mode === 'custom' ? `${customMinutes}m` : t('timerCustom')}
              </button>
            </div>
          )}

          <div className="flex items-center gap-6">
            {/* Circular Ring */}
            <div className="relative w-28 h-28 flex-shrink-0 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 110 110">
                <circle
                  cx="55"
                  cy="55"
                  r={radius}
                  stroke="var(--line)"
                  strokeWidth="7"
                  fill="transparent"
                />
                <circle
                  cx="55"
                  cy="55"
                  r={radius}
                  stroke="var(--accent)"
                  strokeWidth="7"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-500 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[20px] font-bold text-[var(--text)] tracking-tight font-mono">
                  {formatTime(displaySeconds)}
                </span>
                {direction === 'countdown' && (
                  <span className="text-[10px] text-[var(--text-dim)] font-medium mt-0.5">
                    / {formatTime(totalDuration)}
                  </span>
                )}
              </div>
            </div>

            {/* Bullets */}
            <div className="space-y-1.5 text-xs text-[var(--text-dim)] font-medium">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
                <span>{t('focusBullet1')}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
                <span>{t('focusBullet2')}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
                <span>{t('focusBullet3')}</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2.5 mt-4">
            <button
              type="button"
              onClick={toggle}
              className="flex-1 py-2 px-4 rounded-xl bg-[var(--accent)] hover:brightness-105 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95"
            >
              {running ? (
                <>
                  <Pause size={14} className="fill-white" />
                  <span>{t('timerPause')}</span>
                </>
              ) : (
                <>
                  <Play size={14} className="fill-white" />
                  <span>{t('timerStart')}</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={reset}
              className="py-2 px-3.5 rounded-xl border border-[var(--line)] bg-[var(--panel-2)] hover:bg-[var(--panel)] text-[var(--text-dim)] hover:text-[var(--text)] text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw size={13} />
              <span>{t('timerReset')}</span>
            </button>
          </div>
        </div>

        {/* Custom duration dialog */}
        {showCustomModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <div className="w-full max-w-xs bg-[var(--panel)] rounded-2xl p-5 border border-[var(--line)] shadow-2xl">
              <h4 className="font-bold text-sm text-[var(--text)] mb-3">
                {t('timerCustom')} Duration
              </h4>
              <form onSubmit={handleCustomSubmit} className="space-y-3">
                <Input
                  label={`Duration (${t('timerMinutes')})`}
                  type="number"
                  min={1}
                  max={180}
                  autoFocus
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                />
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCustomModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" size="sm">
                    Set Time
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ================= FULL PAGE VARIANT (Full Focus Tab) ================= */
  return (
    <div className="omni-card max-w-xl mx-auto p-6 sm:p-10 text-center space-y-6">
      <div className="flex items-center justify-between border-b border-[var(--line)] pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-[var(--text)]">
            {t('timerTitle')}
          </h2>
          <p className="text-xs text-[var(--text-dim)] mt-1">
            Harmonic chime alerts when your session finishes or stops.
          </p>
        </div>

        {/* Direction Switcher */}
        <div className="flex items-center bg-[var(--panel-2)] p-1 rounded-full border border-[var(--line)] text-xs font-semibold">
          <button
            type="button"
            onClick={() => setDirection('countdown')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all ${
              direction === 'countdown'
                ? 'bg-[var(--accent)] text-white shadow-xs'
                : 'text-[var(--text-dim)] hover:text-[var(--text)]'
            }`}
          >
            <ArrowDownCircle size={14} />
            <span>{t('timerCountdown')}</span>
          </button>
          <button
            type="button"
            onClick={() => setDirection('countup')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all ${
              direction === 'countup'
                ? 'bg-[var(--accent)] text-white shadow-xs'
                : 'text-[var(--text-dim)] hover:text-[var(--text)]'
            }`}
          >
            <ArrowUpCircle size={14} />
            <span>{t('timerCountup')}</span>
          </button>
        </div>
      </div>

      {/* Preset Buttons if Countdown */}
      {direction === 'countdown' && (
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <button
            type="button"
            className={`omni-btn ${mode === 'work' ? 'primary' : ''}`}
            onClick={() => switchMode('work')}
          >
            {t('timerWork')}
          </button>
          <button
            type="button"
            className={`omni-btn ${mode === 'short_rest' ? 'primary' : ''}`}
            onClick={() => switchMode('short_rest')}
          >
            {t('timerShort')}
          </button>
          <button
            type="button"
            className={`omni-btn ${mode === 'long_rest' ? 'primary' : ''}`}
            onClick={() => switchMode('long_rest')}
          >
            {t('timerLong')}
          </button>
          <button
            type="button"
            className={`omni-btn ${mode === 'custom' ? 'primary' : ''}`}
            onClick={() => setShowCustomModal(true)}
          >
            {mode === 'custom' ? `${customMinutes}m` : t('timerCustom')}
          </button>
        </div>
      )}

      {/* Big Display */}
      <div className="py-6 sm:py-8">
        <div className="text-6xl sm:text-7xl font-mono font-bold tracking-tight text-[var(--accent)] transition-all">
          {formatTime(displaySeconds)}
        </div>
        <p className="text-xs text-[var(--text-dim)] mt-3">
          {direction === 'countdown'
            ? `Target: ${formatTime(totalDuration)}`
            : 'Measuring elapsed deep work time'}
        </p>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={toggle}
          className="px-8 py-3.5 rounded-full bg-[var(--accent)] hover:brightness-105 text-white font-semibold text-sm sm:text-base flex items-center gap-2 shadow-md transition-all active:scale-95"
        >
          {running ? (
            <>
              <Pause size={18} className="fill-white" />
              <span>{t('timerPause')}</span>
            </>
          ) : (
            <>
              <Play size={18} className="fill-white" />
              <span>{t('timerStart')}</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={reset}
          className="px-6 py-3.5 rounded-full border border-[var(--line)] bg-[var(--panel-2)] hover:bg-[var(--panel)] text-[var(--text)] font-semibold text-sm sm:text-base flex items-center gap-2 transition-all"
        >
          <RotateCcw size={16} />
          <span>{t('timerReset')}</span>
        </button>
      </div>

      {/* Custom modal */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-[var(--panel)] rounded-3xl p-6 border border-[var(--line)] shadow-2xl text-left">
            <h4 className="font-bold text-base text-[var(--text)] mb-2">
              Set Custom Duration
            </h4>
            <p className="text-xs text-[var(--text-dim)] mb-4">
              Enter the duration in minutes for your focus session.
            </p>
            <form onSubmit={handleCustomSubmit} className="space-y-4">
              <Input
                label={`Focus minutes (1 - 180)`}
                type="number"
                min={1}
                max={180}
                autoFocus
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
              />
              <div className="flex justify-end gap-2.5 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowCustomModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  Set Duration
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
