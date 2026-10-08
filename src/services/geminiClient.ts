// src/services/geminiClient.ts
// Centralized Gemini API client (Requirement 5).
//
// Two key sources, resolved per-request:
//   1. System key — `NEXT_PUBLIC_GEMINI_API_KEY` from env (server-side, never
//      exposed to the browser bundle beyond the runtime env var).
//   2. Personal key — the user's own Gemini API key, stored in their private
//      Firestore user doc (`aiPersonalApiKey`) when they opt-in in Settings.
//
// When a user has selected "Use my own API key" in Settings, every subsequent
// AI request from that user is made with their personal key. When the system
// key is missing, the client throws a descriptive error so the UI can surface
// it instead of failing silently.
//
// All callers go through `callGemini()` so error handling and key selection
// live in exactly one place.

import type { UserProfile } from '@/types';

export const GEMINI_MODEL = process.env.NEXT_PUBLIC_GEMINI_MODEL?.trim() || 'gemini-flash-latest';
export const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export class GeminiError extends Error {
  constructor(message: string, public readonly code: 'no_key' | 'http' | 'parse' | 'unknown' = 'unknown') {
    super(message);
    this.name = 'GeminiError';
  }
}

/**
 * Cleans raw API key: trims whitespace, removes quotes, parentheses, brackets, and newlines.
 */
export function cleanApiKey(raw: string | null | undefined): string {
  if (!raw || typeof raw !== 'string') return '';
  return raw
    .replace(/["'`“”‘’()\[\]{}]/g, '')
    .replace(/[\r\n\t\s]+/g, '')
    .trim();
}

export function getSystemKey(): { key: string; isConfigured: boolean } {
  const raw = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  const cleaned = cleanApiKey(raw);
  if (!cleaned || cleaned.toLowerCase() === 'your_gemini_api_key') {
    return { key: '', isConfigured: false };
  }
  return { key: cleaned, isConfigured: true };
}

export function getPersonalKey(profile: UserProfile | null): string {
  const raw = profile?.aiPersonalApiKey;
  return cleanApiKey(raw);
}

/**
 * Resolves which API key to use for the given user.
 * - personal: always wins when the user has opted in and provided a key.
 * - If personal is chosen but the key is empty -> throws a descriptive GeminiError.
 * - system:   used when the user chose default, or has no personal key configured.
 * - If system key is placeholder/empty -> throws "Chưa cấu hình key hệ thống trong .env.local".
 */
export function resolveApiKey(
  profile: UserProfile | null,
  preferred?: 'system' | 'personal'
): { key: string; source: 'system' | 'personal' } {
  const chosenSource = preferred ?? profile?.aiApiSource ?? 'system';

  if (chosenSource === 'personal') {
    const personal = getPersonalKey(profile);
    if (!personal || personal.toLowerCase() === 'your_gemini_api_key') {
      throw new GeminiError(
        'Bạn đã chọn "Dùng API key riêng" nhưng chưa nhập hoặc để trống API key. Vui lòng vào Cài đặt để bổ sung.',
        'no_key'
      );
    }
    if (!personal.startsWith('AIza')) {
      console.warn(
        `[GeminiClient] Cảnh báo: Personal API key không bắt đầu bằng "AIza" (key prefix: '${personal.substring(0, 4)}...'). Tiếp tục gọi API.`
      );
    }
    return { key: personal, source: 'personal' };
  }

  // Source is system
  const { key: systemKey, isConfigured } = getSystemKey();
  if (!isConfigured) {
    const personal = getPersonalKey(profile);
    if (!preferred && personal && personal.toLowerCase() !== 'your_gemini_api_key') {
      if (!personal.startsWith('AIza')) {
        console.warn(
          `[GeminiClient] Cảnh báo: Personal API key không bắt đầu bằng "AIza" (key prefix: '${personal.substring(0, 4)}...'). Tiếp tục gọi API.`
        );
      }
      return { key: personal, source: 'personal' };
    }
    throw new GeminiError(
      'Chưa cấu hình key hệ thống trong .env.local',
      'no_key'
    );
  }

  if (!systemKey || systemKey.toLowerCase() === 'your_gemini_api_key') {
    throw new GeminiError(
      'Chưa cấu hình key hệ thống trong .env.local',
      'no_key'
    );
  }

  if (!systemKey.startsWith('AIza')) {
    console.warn(
      `[GeminiClient] Cảnh báo: System API key không bắt đầu bằng "AIza" (key prefix: '${systemKey.substring(0, 4)}...'). Tiếp tục gọi API.`
    );
  }

  return { key: systemKey, source: 'system' };
}

/**
 * Low-level Gemini call. Throws a descriptive GeminiError when no key is
 * configured, when the HTTP request fails, or when the response shape is
 * unexpected — never fails silently.
 */
export async function callGemini(
  payload: Record<string, unknown>,
  options: {
    profile?: UserProfile | null;
    preferredKey?: 'system' | 'personal';
    signal?: AbortSignal;
  } = {}
): Promise<string> {
  const resolved = resolveApiKey(options.profile ?? null, options.preferredKey);

  if (!resolved.key || resolved.key.toLowerCase() === 'your_gemini_api_key') {
    throw new GeminiError(
      'API key rỗng hoặc chưa được cấu hình hợp lệ.',
      'no_key'
    );
  }

  // Log cảnh báo nếu key không bắt đầu bằng "AIza", nhưng không chặn
  if (!resolved.key.startsWith('AIza')) {
    console.warn(
      `[GeminiClient] Cảnh báo: API key không bắt đầu bằng "AIza" (key prefix: '${resolved.key.substring(0, 4)}...'). Tiếp tục gọi API.`
    );
  }

  // Log (không in nguyên key, chỉ 4 ký tự đầu) xem request đang dùng source 'system' hay 'personal'.
  console.log(`[GeminiClient] Request source: '${resolved.source}', key prefix: '${resolved.key.substring(0, 4)}...'`);

  const MAX_RETRIES = 2;
  let attempt = 0;
  let res: Response | null = null;

  while (attempt <= MAX_RETRIES) {
    attempt++;
    res = await fetch(`${GEMINI_ENDPOINT}?key=${encodeURIComponent(resolved.key)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: options.signal,
    });

    if (res.ok) {
      break;
    }

    if ((res.status === 503 || res.status === 429) && attempt <= MAX_RETRIES) {
      console.warn(`[GeminiClient] Gặp lỗi HTTP ${res.status} (High demand / Rate limit), chờ thử lại lần ${attempt}...`);
      await new Promise((r) => setTimeout(r, 1500 * attempt));
      continue;
    }

    break;
  }

  if (!res || !res.ok) {
    let errMessage = res ? res.statusText : 'Không có phản hồi từ máy chủ';
    let errCode = 'http';
    if (res) {
      try {
        const errJson = await res.json();
        if (errJson?.error?.message) {
          errMessage = errJson.error.message;
        }
        if (errJson?.error?.status) {
          errCode = errJson.error.status;
        }
      } catch {
        errMessage = await res.text().catch(() => res.statusText);
      }
    }
    let hint = '';
    if (res && (res.status === 400 || res.status === 403)) {
      hint = ' Vui lòng kiểm tra lại API key đã nhập.';
    }
    throw new GeminiError(
      `Lỗi Gemini API (${res?.status ?? 0}): ${errMessage}.${hint}`,
      errCode as any
    );
  }

  const data = await res.json();
  const parts = data?.candidates?.[0]?.content?.parts;
  const text = Array.isArray(parts)
    ? parts
        .filter((p: any) => typeof p?.text === 'string')
        .map((p: any) => p.text)
        .join('')
    : undefined;

  if (typeof text !== 'string' || !text.trim()) {
    throw new GeminiError(
      'Gemini trả về phản hồi không hợp lệ. Vui lòng thử lại.',
      'parse'
    );
  }
  return text;
}

export function safeJsonParse<T>(raw: string): T {
  const cleaned = raw.trim().replace(/^```json\s*/i, '').replace(/```$/, '').trim();
  return JSON.parse(cleaned) as T;
}