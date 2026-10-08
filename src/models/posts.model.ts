// src/models/posts.model.ts
// Data access layer (Model) for the social feed (Requirement 7).
// Each post lives at users/{uid}/posts/{postId} and is authored by that user.
//
// Post images are no longer uploaded to Firebase Storage (no Blaze plan /
// CORS preflight error). They are compressed in the browser to a max side of
// 800px and stored as base64 data URLs inside the post document's `imageUrl`
// field. The post document is kept under the 900KB Firestore limit.

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { Post } from '@/types';
import { compressImage, byteSize, formatBytes } from '@/lib/imageCompress';

const POST_DOC_MAX_BYTES = 900 * 1024; // 900KB — keep each post doc under the 1MB Firestore limit

export async function uploadPostImage(uid: string, file: File): Promise<string> {
  const { dataUrl } = await compressImage(file, {
    maxSize: 800,
    maxBytes: 800 * 1024, // 800KB
    quality: 0.7,
  });
  return dataUrl;
}

/**
 * Estimates the serialized size of a post document in bytes.
 * Firestore measures UTF-8 bytes, so we serialize the JSON the same way it
 * would be written and count the bytes of that string.
 */
export function estimatePostDocBytes(data: Omit<Post, 'id'>): number {
  return byteSize(JSON.stringify(data));
}

function postsCollection(uid: string) {
  return collection(db, 'users', uid, 'posts');
}

export function subscribeUserPosts(
  uid: string,
  onChange: (posts: Post[]) => void
): Unsubscribe {
  const q = query(postsCollection(uid), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    const list: Post[] = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<Post, 'id'>),
    }));
    onChange(list);
  });
}

export async function getUserPosts(uid: string): Promise<Post[]> {
  const q = query(postsCollection(uid), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Post, 'id'>) }));
}

export async function addPost(
  uid: string,
  authorName: string,
  data: {
    content: string;
    imageUrl?: string | null;
    visibility?: Post['visibility'];
  }
): Promise<string> {
  const now = Date.now();
  const docData: Omit<Post, 'id'> = {
    authorId: uid,
    authorName,
    content: data.content.trim(),
    imageUrl: data.imageUrl ?? null,
    visibility: data.visibility ?? 'private',
    createdAt: now,
    updatedAt: now,
  };

  // Guard against the 1MB Firestore document limit (Requirement 7).
  const docBytes = estimatePostDocBytes(docData);
  if (docBytes > POST_DOC_MAX_BYTES) {
    const err: any = new Error(
      `Bài viết quá lớn (${formatBytes(docBytes)}). Vui lòng dùng ảnh nhỏ hơn hoặc giảm nội dung.`
    );
    err.code = 'invalid-argument';
    throw err;
  }

  const docRef = await addDoc(postsCollection(uid), docData);
  return docRef.id;
}

export async function updatePost(
  uid: string,
  postId: string,
  patch: Partial<Omit<Post, 'id' | 'authorId' | 'createdAt'>>
): Promise<void> {
  await updateDoc(doc(db, 'users', uid, 'posts', postId), {
    ...patch,
    updatedAt: Date.now(),
  });
}

export async function deletePost(uid: string, postId: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid, 'posts', postId));
}