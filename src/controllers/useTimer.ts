// src/controllers/useTimer.ts
// Controller hook managing Focus Timer: countdown & count-up modes, custom durations, and chime audio.

import { useEffect, useRef, useState, useCallback } from 'react';
import type { TimerDirection, TimerMode } from '@/types';

export const TIMER_PRESET_DURATIONS: Record<Exclude<TimerMode, 'custom'>, number> = {
  work: 25 * 60,
  short_rest: 5 * 60,
  long_rest: 15 * 60,
};

export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

/**
 * Plays a pleasant meditation bell / singing bowl chime using Web Audio API.
 * Works offline with zero external audio assets.
 */
export function playTimerChime() {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // Harmonic bell chord: C5 (523Hz), E5 (659Hz), G5 (784Hz), C6 (1046Hz)
    const frequencies = [523.25, 659.25, 783.99, 1046.50];
    frequencies.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0.0001, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.22 / (idx + 1), now + idx * 0.08 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 1.8);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 2.0);
    });
  } catch (err) {
    console.warn('Audio chime playback failed:', err);
  }
}

export function useTimer({
  onSessionComplete,
}: {
  onSessionComplete?: (mode: TimerMode) => void;
}) {
  const [direction, setDirection] = useState<TimerDirection>('countdown');
  const [mode, setMode] = useState<TimerMode>('work');
  const [customMinutes, setCustomMinutes] = useState<number>(30);
  const [remaining, setRemaining] = useState<number>(TIMER_PRESET_DURATIONS.work);
  const [elapsed, setElapsed] = useState<number>(0);
  const [running, setRunning] = useState<boolean>(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const getTotalDuration = useCallback(() => {
    if (mode === 'custom') return customMinutes * 60;
    return TIMER_PRESET_DURATIONS[mode];
  }, [mode, customMinutes]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const switchMode = useCallback(
    (nextMode: TimerMode, nextMinutes?: number) => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setRunning(false);
      setMode(nextMode);

      if (nextMode === 'custom' && nextMinutes) {
        setCustomMinutes(nextMinutes);
        setRemaining(nextMinutes * 60);
      } else if (nextMode === 'custom') {
        setRemaining(customMinutes * 60);
      } else {
        setRemaining(TIMER_PRESET_DURATIONS[nextMode]);
      }
      setElapsed(0);
    },
    [customMinutes]
  );

  const switchDirection = useCallback(
    (nextDir: TimerDirection) => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setRunning(false);
      setDirection(nextDir);
      setElapsed(0);
      setRemaining(getTotalDuration());
    },
    [getTotalDuration]
  );

  const toggle = useCallback(() => {
    if (running) {
      // Pause / Stop
      if (intervalRef.current) clearInterval(intervalRef.current);
      setRunning(false);
      // Play chime when stopping in count-up mode
      if (direction === 'countup' && elapsed > 10) {
        playTimerChime();
      }
      return;
    }

    setRunning(true);
    intervalRef.current = setInterval(() => {
      if (direction === 'countdown') {
        setRemaining((prev) => {
          if (prev <= 1) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            setRunning(false);
            playTimerChime();
            onSessionComplete?.(mode);
            return 0;
          }
          return prev - 1;
        });
      } else {
        // Count-up mode
        setElapsed((prev) => prev + 1);
      }
    }, 1000);
  }, [running, direction, elapsed, mode, onSessionComplete]);

  const reset = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRunning(false);
    setElapsed(0);
    setRemaining(getTotalDuration());
  }, [getTotalDuration]);

  const setCustomDuration = useCallback(
    (mins: number) => {
      const valid = Math.max(1, Math.min(180, mins));
      setCustomMinutes(valid);
      if (mode === 'custom') {
        setRemaining(valid * 60);
      }
    },
    [mode]
  );

  return {
    direction,
    setDirection: switchDirection,
    mode,
    switchMode,
    customMinutes,
    setCustomDuration,
    remaining,
    elapsed,
    running,
    totalDuration: getTotalDuration(),
    toggle,
    reset,
  };
}
