// src/models/profile.model.ts
// Data access layer (Model) for the expanded personal profile (Requirement 6).
// Profile data lives on the user document as `profileData` but is split into
// helper functions so the Controller layer can update individual fields
// (display name, phone, avatar, habits, goals, interests, journal) without
// clobbering unrelated parts of the profile.

import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { JournalEntry, ProfileData } from '@/types';

const EMPTY_PROFILE_DATA: ProfileData = {
  displayName: '',
  phone: null,
  avatarUrl: null,
  bio: '',
  habits: [],
  goals: [],
  interests: [],
  journalEntries: [],
  updatedAt: 0,
};

export async function getProfileData(uid: string): Promise<ProfileData> {
  const snap = await getDoc(doc(db, 'users', uid));
  if (snap.exists()) {
    const data = snap.data();
    if (data && typeof data.profileData === 'object' && data.profileData) {
      return { ...EMPTY_PROFILE_DATA, ...(data.profileData as Partial<ProfileData>) };
    }
  }
  return { ...EMPTY_PROFILE_DATA };
}

export async function saveProfileData(
  uid: string,
  patch: Partial<ProfileData>
): Promise<void> {
  const now = Date.now();
  await updateDoc(doc(db, 'users', uid), {
    profileData: { ...patch, updatedAt: now },
    updatedAt: now,
  });
}

export async function updateProfileField(
  uid: string,
  field: 'displayName' | 'phone' | 'avatarUrl' | 'bio',
  value: string | null
): Promise<void> {
  const now = Date.now();
  await updateDoc(doc(db, 'users', uid), {
    [`profileData.${field}`]: value,
    'profileData.updatedAt': now,
    updatedAt: now,
  });
}

export async function addJournalEntry(uid: string, text: string): Promise<void> {
  const entry: JournalEntry = {
    id: `j-${Date.now()}`,
    text: text.trim(),
    createdAt: Date.now(),
  };
  const current = await getProfileData(uid);
  const nextEntries = [entry, ...current.journalEntries];
  await saveProfileData(uid, { journalEntries: nextEntries });
}

export async function deleteJournalEntry(uid: string, entryId: string): Promise<void> {
  const current = await getProfileData(uid);
  const nextEntries = current.journalEntries.filter((e) => e.id !== entryId);
  await saveProfileData(uid, { journalEntries: nextEntries });
}

export async function toggleProfileList(
  uid: string,
  list: 'habits' | 'goals' | 'interests',
  value: string
): Promise<void> {
  const current = await getProfileData(uid);
  const arr = current[list] ?? [];
  const exists = arr.includes(value);
  const next = exists ? arr.filter((v) => v !== value) : [...arr, value];
  await saveProfileData(uid, { [list]: next });
}