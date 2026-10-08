// src/models/user.model.ts
// Data access layer (Model) for user profiles and images in Firestore.
//
// Images are no longer uploaded to Firebase Storage (the project has no
// Blaze plan / CORS preflight error). Instead they are compressed in the
// browser and stored as base64 data URLs directly on the user document.
// See src/lib/imageCompress.ts.

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { ThemeConfig, UserProfile } from '@/types';

import { assertValidUid, normalizeFirebaseError } from './helpers';
import { compressImage, formatBytes } from '@/lib/imageCompress';

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  if (!uid || typeof uid !== 'string') return null;
  const snap = await getDoc(doc(db, 'users', uid.trim()));
  return snap.exists() ? (snap.data() as UserProfile) : null;
}

export async function createUserProfile(profile: UserProfile): Promise<void> {
  const validUid = assertValidUid(profile.uid);
  try {
    await setDoc(doc(db, 'users', validUid), { ...profile, uid: validUid }, { merge: true });
  } catch (err: any) {
    throw normalizeFirebaseError(err);
  }
}

export async function updateUserProfile(uid: string, patch: Partial<UserProfile>): Promise<void> {
  const validUid = assertValidUid(uid);
  try {
    await setDoc(doc(db, 'users', validUid), { ...patch, updatedAt: Date.now() }, { merge: true });
  } catch (err: any) {
    throw normalizeFirebaseError(err);
  }
}

export function subscribeUserProfile(
  uid: string,
  onChange: (profile: UserProfile | null) => void
): Unsubscribe {
  if (!uid) return () => {};
  return onSnapshot(doc(db, 'users', uid), (snap) => {
    onChange(snap.exists() ? (snap.data() as UserProfile) : null);
  });
}

export async function saveThemeConfig(uid: string, theme: ThemeConfig): Promise<void> {
  const validUid = assertValidUid(uid);
  await updateUserProfile(validUid, { themeConfig: theme });
}

/* ----------------------------- Images (Firestore data URLs) ----------------------------- */

const ALLOWED_IMAGE_TYPES = ['image/png', 'image/gif', 'image/jpeg', 'image/webp'];

function assertImageType(file: File) {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    const err: any = new Error(
      'Supported image formats: PNG, JPG, JPEG, WEBP, GIF.'
    );
    err.code = 'invalid-argument';
    throw err;
  }
}

/**
 * Uploads a profile avatar image.
 * The image is compressed to a max side of 256px and stored as a base64 data
 * URL on the user document (profileData.avatarUrl + mascotUrl). No Storage.
 */
export async function uploadAvatar(uid: string, file: File): Promise<string> {
  const validUid = assertValidUid(uid);
  assertImageType(file);

  const { dataUrl } = await compressImage(file, {
    maxSize: 256,
    maxBytes: 300 * 1024, // 300KB
    quality: 0.7,
  });

  // Persist the data URL on the user doc so the avatar survives F5 / reloads.
  await setDoc(
    doc(db, 'users', validUid),
    {
      profileData: { avatarUrl: dataUrl, updatedAt: Date.now() },
      mascotUrl: dataUrl,
      updatedAt: Date.now(),
    },
    { merge: true }
  );
  return dataUrl;
}

/**
 * Uploads a background wallpaper image.
 * Compressed to a max side of 1280px and stored as a base64 data URL on the
 * user document (customBackground). No Storage.
 */
export async function uploadBackgroundImage(uid: string, file: File): Promise<string> {
  const validUid = assertValidUid(uid);
  assertImageType(file);

  const { dataUrl } = await compressImage(file, {
    maxSize: 1280,
    maxBytes: 900 * 1024, // 900KB — keeps the user doc under the 1MB Firestore limit
    quality: 0.7,
  });

  await setDoc(
    doc(db, 'users', validUid),
    {
      customBackground: dataUrl,
      backgroundType: 'image',
      updatedAt: Date.now(),
    },
    { merge: true }
  );
  return dataUrl;
}

/**
 * Uploads a mascot sprite.
 * PNG/GIF sprites are kept as-is (no re-encoding, so animation survives) but
 * are still capped at 5MB and stored as a data URL on the user doc.
 */
export async function uploadMascotSprite(uid: string, file: File): Promise<string> {
  const validUid = assertValidUid(uid);
  if (!['image/png', 'image/gif'].includes(file.type)) {
    const err: any = new Error('Only PNG or GIF files are supported for the mascot sprite.');
    err.code = 'invalid-argument';
    throw err;
  }
  if (file.size > 5 * 1024 * 1024) {
    const err: any = new Error('Mascot sprite must be smaller than 5MB.');
    err.code = 'invalid-argument';
    throw err;
  }

  const dataUrl = await fileToDataUrl(file);
  await setDoc(
    doc(db, 'users', validUid),
    {
      mascotUrl: dataUrl,
      updatedAt: Date.now(),
    },
    { merge: true }
  );
  return dataUrl;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(normalizeFirebaseError(reader.error));
    reader.readAsDataURL(file);
  });
}

export { serverTimestamp, formatBytes };