// src/models/habit.model.ts
// Data access layer (Model) for user habits in Firestore.

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { Habit } from '@/types';

function habitsCollection(uid: string) {
  return collection(db, 'users', uid, 'habits');
}

export function subscribeHabits(uid: string, onChange: (habits: Habit[]) => void): Unsubscribe {
  const q = query(habitsCollection(uid), orderBy('createdAt', 'asc'));
  return onSnapshot(q, (snap) => {
    const habits: Habit[] = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<Habit, 'id'>),
    }));
    onChange(habits);
  });
}

export async function addHabit(
  uid: string,
  habit: Omit<Habit, 'id' | 'createdAt' | 'updatedAt' | 'currentStreak' | 'bestStreak' | 'lastCompletedDate'>
): Promise<string> {
  const now = Date.now();
  const docRef = await addDoc(habitsCollection(uid), {
    ...habit,
    currentStreak: 0,
    bestStreak: 0,
    lastCompletedDate: null,
    createdAt: now,
    updatedAt: now,
  });
  return docRef.id;
}

/** Marks a habit done for `todayISO`, bumping the streak if it's a consecutive day. */
export async function markHabitDone(uid: string, habit: Habit, todayISO: string): Promise<void> {
  if (habit.lastCompletedDate === todayISO) return; // already logged today

  const yesterday = new Date(todayISO);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayISO = yesterday.toISOString().slice(0, 10);

  const isConsecutive = habit.lastCompletedDate === yesterdayISO;
  const nextStreak = isConsecutive ? habit.currentStreak + 1 : 1;

  await updateDoc(doc(db, 'users', uid, 'habits', habit.id), {
    currentStreak: nextStreak,
    bestStreak: Math.max(habit.bestStreak, nextStreak),
    lastCompletedDate: todayISO,
    updatedAt: Date.now(),
  });
}

export async function deleteHabit(uid: string, habitId: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid, 'habits', habitId));
}
