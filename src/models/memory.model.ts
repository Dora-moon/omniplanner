// src/models/memory.model.ts
// Data access layer (Model) for AI Companion (Pixel AI) long-term memories in Firestore.

import {
  collection,
  doc,
  addDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { AIMemory } from '@/types';

function memoriesCollection(uid: string) {
  return collection(db, 'users', uid, 'memories');
}

export function subscribeUserMemories(
  uid: string,
  onChange: (memories: AIMemory[]) => void
): Unsubscribe {
  const q = query(memoriesCollection(uid), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    const list: AIMemory[] = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<AIMemory, 'id'>),
    }));
    onChange(list);
  });
}

export async function getUserMemories(uid: string): Promise<AIMemory[]> {
  const q = query(memoriesCollection(uid), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<AIMemory, 'id'>),
  }));
}

export async function addUserMemory(
  uid: string,
  content: string,
  category: AIMemory['category'] = 'fact'
): Promise<string> {
  const clean = content.trim();
  if (!clean) throw new Error('Memory content cannot be empty.');

  // Prevent duplicate exact memory
  const existing = await getUserMemories(uid);
  const duplicate = existing.find((m) => m.content.toLowerCase() === clean.toLowerCase());
  if (duplicate) return duplicate.id;

  const now = Date.now();
  const docRef = await addDoc(memoriesCollection(uid), {
    content: clean,
    category,
    createdAt: now,
    updatedAt: now,
  });
  return docRef.id;
}

export async function deleteUserMemory(uid: string, memoryId: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid, 'memories', memoryId));
}

export async function clearUserMemories(uid: string): Promise<void> {
  const snap = await getDocs(memoriesCollection(uid));
  const batch = writeBatch(db);
  snap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
}
