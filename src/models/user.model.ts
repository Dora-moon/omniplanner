// src/models/user.model.ts
// Data access layer (Model) for user profiles and storage assets in Firestore & Firebase Storage.

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/config/firebase';
import type { ThemeConfig, UserProfile } from '@/types';

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? (snap.data() as UserProfile) : null;
}

export async function createUserProfile(profile: UserProfile): Promise<void> {
  await setDoc(doc(db, 'users', profile.uid), profile);
}

export async function updateUserProfile(uid: string, patch: Partial<UserProfile>): Promise<void> {
  await updateDoc(doc(db, 'users', uid), { ...patch, updatedAt: Date.now() });
}

export function subscribeUserProfile(
  uid: string,
  onChange: (profile: UserProfile | null) => void
): Unsubscribe {
  return onSnapshot(doc(db, 'users', uid), (snap) => {
    onChange(snap.exists() ? (snap.data() as UserProfile) : null);
  });
}

export async function saveThemeConfig(uid: string, theme: ThemeConfig): Promise<void> {
  await updateUserProfile(uid, { themeConfig: theme });
}

/* ----------------------------- Storage ----------------------------- */

const ALLOWED_IMAGE_TYPES = ['image/png', 'image/gif', 'image/jpeg', 'image/webp'];
const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8 MB

/** Uploads a PNG/GIF sprite to Firebase Storage and returns its public download URL. */
export async function uploadMascotSprite(uid: string, file: File): Promise<string> {
  if (!['image/png', 'image/gif'].includes(file.type)) {
    throw new Error('Only PNG or GIF files are supported for the mascot sprite.');
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Mascot sprite must be smaller than 5MB.');
  }
  const ext = file.type === 'image/gif' ? 'gif' : 'png';
  const path = `mascots/${uid}/sprite-${Date.now()}.${ext}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file, { contentType: file.type });
  return getDownloadURL(storageRef);
}

/** Uploads a background wallpaper image to Firebase Storage and returns its download URL. */
export async function uploadBackgroundImage(uid: string, file: File): Promise<string> {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error('Supported image formats: PNG, JPG, JPEG, WEBP, GIF.');
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error('Background image must be smaller than 8MB.');
  }
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `backgrounds/${uid}/bg-${Date.now()}.${ext}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file, { contentType: file.type });
  return getDownloadURL(storageRef);
}

export { serverTimestamp };
