// src/controllers/useCompanion.ts
// Controller hook managing Pixel AI Companion: mascot mood, fitness metrics,
// and long-term memory retrieval/injection/automatic extraction.

import { useEffect, useMemo, useRef, useState } from 'react';
import { chatWithMascot, extractKeyMemories } from '@/services/aiService';
import {
  addUserMemory,
  clearUserMemories,
  deleteUserMemory,
  subscribeUserMemories,
} from '@/models/memory.model';
import type {
  AIMemory,
  ChatMessage,
  FitnessMetrics,
  Habit,
  Language,
  Task,
  UserProfile,
} from '@/types';

export function computeFitness(profile: UserProfile): FitnessMetrics | null {
  const { heightCm, weightKg, age, gender } = profile;
  if (!heightCm || !weightKg || !age) return null;
  const bmi = weightKg / Math.pow(heightCm / 100, 2);
  const bmr =
    gender === 'female'
      ? 10 * weightKg + 6.25 * heightCm - 5 * age - 161
      : gender === 'other'
        ? 10 * weightKg + 6.25 * heightCm - 5 * age - 78
        : 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  const tdee = bmr * 1.5;
  const targetCalories = profile.goal === 'fitness' ? tdee + 200 : tdee;
  return {
    bmi: Math.round(bmi * 10) / 10,
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    targetCalories: Math.round(targetCalories),
  };
}

export function moodFromCompletion(pct: number): 'sad' | 'normal' | 'happy' {
  if (pct >= 70) return 'happy';
  if (pct >= 30) return 'normal';
  return 'sad';
}

export function useCompanion({
  uid,
  language,
  profile,
  tasks,
  habits,
  chatHistory,
  onSendMessage,
}: {
  uid: string;
  language: Language;
  profile: UserProfile;
  tasks: Task[];
  habits: Habit[];
  chatHistory: ChatMessage[];
  onSendMessage: (userText: string, mascotReply: string) => void;
}) {
  const [input, setInput] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [memories, setMemories] = useState<AIMemory[]>([]);

  // Subscribe to user memories in Firestore
  useEffect(() => {
    if (!uid) return;
    const unsub = subscribeUserMemories(uid, setMemories);
    return () => unsub();
  }, [uid]);

  const todayISO = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const todaysTasks = useMemo(() => tasks.filter((tsk) => tsk.date === todayISO), [tasks, todayISO]);
  const completedCount = todaysTasks.filter((tsk) => tsk.completed).length;
  const completionPct = todaysTasks.length ? Math.round((completedCount / todaysTasks.length) * 100) : 0;
  const mood = moodFromCompletion(completionPct);
  const metrics = useMemo(() => computeFitness(profile), [profile]);
  const bestStreak = useMemo(
    () => habits.reduce((max, h) => Math.max(max, h.currentStreak), 0),
    [habits]
  );

  async function handleSend(customText?: string) {
    const text = (typeof customText === 'string' ? customText : input).trim();
    if (!text || loading) return;
    if (!customText) setInput('');
    setLoading(true);
    setStatus(language === 'vi' ? 'Đang suy nghĩ...' : 'Thinking...');

    try {
      // 1. Chat with mascot injecting stored memories and profile data
      const reply = await chatWithMascot(
        text,
        {
          goal: profile.goal,
          tasksDone: completedCount,
          tasksTotal: todaysTasks.length,
          metrics,
          habitStreak: bestStreak,
          memories,
          profileData: profile.profileData,
        },
        language,
        profile
      );
      onSendMessage(text, reply);
      setStatus('');

      // 2. Asynchronously extract and store any lasting memory about user
      extractKeyMemories(text, language, profile)
        .then((newMemories) => {
          newMemories.forEach((mem) => {
            addUserMemory(uid, mem, 'preference');
          });
        })
        .catch(() => {});
    } catch (err: any) {
      const message = err?.message || (language === 'vi' ? 'Pixel chưa trả lời được lúc này.' : 'AI is temporarily unavailable.');
      setStatus(message);
      console.error('useCompanion chat error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddMemory(content: string, category: AIMemory['category'] = 'fact') {
    await addUserMemory(uid, content, category);
  }

  async function handleDeleteMemory(memoryId: string) {
    await deleteUserMemory(uid, memoryId);
  }

  async function handleClearMemories() {
    await clearUserMemories(uid);
  }

  return {
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
    handleAddMemory,
    handleDeleteMemory,
    handleClearMemories,
  };
}
