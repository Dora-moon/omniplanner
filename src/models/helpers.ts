// src/models/helpers.ts
// Shared helper functions for the Model data access layer (Requirement B).

import { auth } from '@/config/firebase';

/**
 * Ensures uid is available before performing any write operations.
 * If uid is undefined, falls back to auth.currentUser?.uid.
 * If still unavailable, throws an Error with code 'permission-denied' so the UI displays it.
 */
export function assertValidUid(uid?: string | null): string {
  const currentUid = auth.currentUser?.uid;
  const effectiveUid =
    uid && typeof uid === 'string' && uid.trim()
      ? uid.trim()
      : currentUid && typeof currentUid === 'string' && currentUid.trim()
      ? currentUid.trim()
      : '';

  if (!effectiveUid) {
    const err: any = new Error(
      'Chưa đăng nhập hoặc UID không tồn tại (auth.currentUser chưa sẵn sàng)'
    );
    err.code = 'permission-denied';
    throw err;
  }
  return effectiveUid;
}

/**
 * Ensures any Firebase/Storage error preserves its error code (e.g. 'permission-denied',
 * 'storage/unauthorized', etc.) so callers can surface it to the UI.
 */
export function normalizeFirebaseError(err: any): Error & { code?: string } {
  if (!err) {
    const fallback: any = new Error('Lỗi không xác định');
    fallback.code = 'unknown-error';
    return fallback;
  }
  const code =
    err.code ||
    (err.name && err.name !== 'Error' ? err.name : undefined) ||
    'unknown-error';
  const originalMessage = err.message || 'Lỗi thao tác Firestore/Storage';
  const enhanced: any = new Error(originalMessage);
  enhanced.code = code;
  return enhanced;
}
