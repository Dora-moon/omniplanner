// src/controllers/useDashboardData.ts
// Controller hook managing dashboard data streams (Tasks, Habits, and AI chat history).
// Encapsulates Firestore real-time subscriptions, keeping the View layer purely declarative (MVC).

import { useEffect, useState } from 'react';
import { subscribeTasks } from '@/models/task.model';
import { subscribeHabits } from '@/models/habit.model';
import type { ChatMessage, Habit, Language, Task } from '@/types';

export function useDashboardData({
  uid,
  language,
}: {
  uid: string | null | undefined;
  language: Language;
}) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

  // Subscribe to Tasks and Habits when uid is available
  useEffect(() => {
    if (!uid) {
      setTasks([]);
      setHabits([]);
      return;
    }
    const unsubTasks = subscribeTasks(uid, setTasks);
    const unsubHabits = subscribeHabits(uid, setHabits);
    return () => {
      unsubTasks();
      unsubHabits();
    };
  }, [uid]);

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

  return {
    tasks,
    habits,
    chatHistory,
    setTasks,
    setHabits,
    setChatHistory,
    handleSendMessage,
    handleTimerComplete,
  };
}
