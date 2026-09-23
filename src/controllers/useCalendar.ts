// src/controllers/useCalendar.ts
// Controller hook managing Calendar views, date matrix calculations, and AI schedule parsing.

import { useState, useMemo, useRef } from 'react';
import { parseScheduleWithAI } from '@/services/aiService';
import { addParsedTasks, addTask, deleteTask, toggleTaskCompleted } from '@/models/task.model';
import type { CalendarViewMode, Language, Task } from '@/types';

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function startOfWeek(d: Date): Date {
  const date = new Date(d);
  const day = (date.getDay() + 6) % 7; // Monday = 0
  date.setDate(date.getDate() - day);
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(d: Date, n: number): Date {
  const date = new Date(d);
  date.setDate(date.getDate() + n);
  return date;
}

function daysInMonthMatrix(reference: Date): Date[] {
  const firstOfMonth = new Date(reference.getFullYear(), reference.getMonth(), 1);
  const gridStart = startOfWeek(firstOfMonth);
  return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
}

interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((ev: any) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
}

export function useCalendar({
  uid,
  language,
  tasks,
}: {
  uid: string;
  language: Language;
  tasks: Task[];
}) {
  const [viewMode, setViewMode] = useState<CalendarViewMode>('week');
  const [reference, setReference] = useState(() => new Date());
  const [scheduleText, setScheduleText] = useState('');
  const [aiStatus, setAiStatus] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const weekDays = useMemo(() => {
    const start = startOfWeek(reference);
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [reference]);

  const monthDays = useMemo(() => daysInMonthMatrix(reference), [reference]);

  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const task of tasks) {
      const list = map.get(task.date) ?? [];
      list.push(task);
      map.set(task.date, list);
    }
    return map;
  }, [tasks]);

  async function handleToggle(task: Task) {
    await toggleTaskCompleted(uid, task.id, !task.completed);
  }

  async function handleDelete(taskId: string) {
    await deleteTask(uid, taskId);
  }

  function nextPeriod() {
    setReference((d) => addDays(d, viewMode === 'week' ? 7 : 30));
  }

  function prevPeriod() {
    setReference((d) => addDays(d, viewMode === 'week' ? -7 : -30));
  }

  function resetToday() {
    setReference(new Date());
  }

  function toggleVoiceInput() {
    const SpeechRecognitionCtor =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      setAiStatus('Voice input is not supported in this browser.');
      return;
    }
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    const recognition: SpeechRecognitionLike = new SpeechRecognitionCtor();
    recognition.lang = language === 'vi' ? 'vi-VN' : 'en-US';
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onresult = (ev) => {
      const transcript = ev.results[0][0].transcript;
      setScheduleText((prev) => (prev ? `${prev} ${transcript}` : transcript));
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }

  async function handleParseSchedule() {
    if (!scheduleText.trim()) return;
    setAiLoading(true);
    setAiStatus('Parsing schedule with AI...');
    try {
      const drafts = await parseScheduleWithAI(
        scheduleText.trim(),
        language,
        toISODate(new Date())
      );
      await addParsedTasks(uid, drafts, 'ai_parsed');
      setScheduleText('');
      setAiStatus('');
    } catch (err) {
      setAiStatus('Could not parse schedule right now.');
      console.error(err);
    } finally {
      setAiLoading(false);
    }
  }

  return {
    viewMode,
    setViewMode,
    reference,
    setReference,
    weekDays,
    monthDays,
    tasksByDate,
    nextPeriod,
    prevPeriod,
    resetToday,
    handleToggle,
    handleDelete,
    scheduleText,
    setScheduleText,
    aiStatus,
    aiLoading,
    listening,
    toggleVoiceInput,
    handleParseSchedule,
  };
}
