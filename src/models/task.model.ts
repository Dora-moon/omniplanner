// src/models/task.model.ts
// Data access layer (Model) for user tasks in Firestore.

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
import type { ParsedTaskDraft, Task } from '@/types';

function tasksCollection(uid: string) {
  return collection(db, 'users', uid, 'tasks');
}

export function subscribeTasks(uid: string, onChange: (tasks: Task[]) => void): Unsubscribe {
  const q = query(tasksCollection(uid), orderBy('date', 'asc'));
  return onSnapshot(q, (snap) => {
    const tasks: Task[] = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<Task, 'id'>),
    }));
    onChange(tasks);
  });
}

export async function addTask(
  uid: string,
  task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const now = Date.now();
  const docRef = await addDoc(tasksCollection(uid), {
    ...task,
    createdAt: now,
    updatedAt: now,
  });
  return docRef.id;
}

export async function addParsedTasks(
  uid: string,
  drafts: ParsedTaskDraft[],
  source: Task['source'] = 'ai_parsed'
): Promise<string[]> {
  const now = Date.now();
  const results = await Promise.all(
    drafts.map((d) =>
      addDoc(tasksCollection(uid), {
        title: d.title,
        date: d.date,
        time: d.time ?? null,
        category: d.category,
        completed: false,
        source,
        createdAt: now,
        updatedAt: now,
      })
    )
  );
  return results.map((r) => r.id);
}

export async function updateTask(uid: string, taskId: string, patch: Partial<Task>): Promise<void> {
  await updateDoc(doc(db, 'users', uid, 'tasks', taskId), {
    ...patch,
    updatedAt: Date.now(),
  });
}

export async function toggleTaskCompleted(uid: string, taskId: string, completed: boolean): Promise<void> {
  await updateTask(uid, taskId, { completed });
}

export async function deleteTask(uid: string, taskId: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid, 'tasks', taskId));
}
