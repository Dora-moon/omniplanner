// src/services/aiService.ts
// All Gemini API calls: schedule parser, context & memory-aware mascot chat,
// theme generator, and automatic memory extraction.

import type {
  AIMemory,
  CssThemeVariables,
  FitnessMetrics,
  Goal,
  Language,
  ParsedTaskDraft,
  ProfileData,
  UserProfile,
} from '@/types';
import { callGemini, GeminiError, safeJsonParse } from '@/services/geminiClient';

export { GeminiError };
export const AiServiceError = GeminiError;
export type AiServiceError = GeminiError;

/**
 * Parses a free-text (or voice-transcribed) schedule description into structured task drafts.
 */
export async function parseScheduleWithAI(
  rawText: string,
  language: Language,
  referenceDateISO: string,
  profile?: UserProfile | null
): Promise<ParsedTaskDraft[]> {
  const prompt = `You are a schedule-parsing assistant for a life-planner app.
Reference date (today): ${referenceDateISO} (this is a Monday-based week; use it to resolve relative days like "Tuesday", "T3", "next week").
The user may write in Vietnamese or English. Extract every distinct task/event mentioned.
Return ONLY a JSON array. Each item must match:
{
  "title": string,
  "date": string ("YYYY-MM-DD", resolved from the reference date),
  "time": string | null ("HH:mm" 24h format, or null if no specific time was given),
  "category": "work" | "study" | "fitness" | "habit" | "rest" | "other"
}
User's schedule description (language: ${language}):
"""${rawText}"""`;

  const raw = await callGemini(
    {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2,
        responseSchema: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              title: { type: 'STRING' },
              date: { type: 'STRING' },
              time: { type: 'STRING', nullable: true },
              category: { type: 'STRING', enum: ['work', 'study', 'fitness', 'habit', 'rest', 'other'] },
            },
            required: ['title', 'date', 'category'],
          },
        },
      },
    },
    { profile }
  );

  const parsed = safeJsonParse<ParsedTaskDraft[]>(raw);
  if (!Array.isArray(parsed)) throw new AiServiceError('Expected an array of tasks from Gemini.');
  return parsed;
}

export interface MascotChatContext {
  goal: Goal;
  tasksDone: number;
  tasksTotal: number;
  metrics: FitnessMetrics | null;
  habitStreak: number;
  memories?: AIMemory[];
  profileData?: ProfileData | null;
}

/**
 * Sends one chat turn to the Pixel mascot persona, grounded in the user's
 * body metrics, task progress, and long-term memories.
 */
export async function chatWithMascot(
  userMessage: string,
  context: MascotChatContext,
  language: Language,
  profile?: UserProfile | null
): Promise<string> {
  const metricsLine = context.metrics
    ? `BMI: ${context.metrics.bmi}, BMR: ${context.metrics.bmr} kcal, TDEE: ${context.metrics.tdee} kcal, daily target: ${context.metrics.targetCalories} kcal.`
    : 'No body metrics on file yet.';

  const memorySection =
    context.memories && context.memories.length > 0
      ? `\nStored memories & preferences about this user:\n${context.memories
          .map((m) => `- ${m.content}`)
          .join('\n')}\n(Use these memories naturally to personalize your reply and demonstrate ongoing companionship across sessions. Do NOT simply list them out.)`
      : '';

  const profileSection = buildProfileSection(context.profileData);

  const prompt = `You are Pixel, a warm, thoughtful, and encouraging pixel-art AI companion inside a life & fitness planner app.
User's primary goal: ${context.goal}.
Today's progress: ${context.tasksDone}/${context.tasksTotal} tasks completed. Current habit streak: ${context.habitStreak} day(s).
Body metrics: ${metricsLine}
${memorySection}
${profileSection}

Reply in ${language === 'vi' ? 'Vietnamese' : 'English'}, in 1-3 short sentences, warm, personalized, and specific to the context and memories above. No markdown fences, no emoji spam (at most one emoji).
User says: "${userMessage}"`;

  const raw = await callGemini(
    {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7 },
    },
    { profile }
  );
  return raw.trim();
}

/**
 * Builds a concise, human-readable summary of the user's personal profile
 * (display name, phone, bio, habits, goals, interests, recent journal notes)
 * so the AI companion can answer in a genuinely personalized way.
 */
function buildProfileSection(profileData?: ProfileData | null): string {
  if (!profileData) return '';
  const lines: string[] = [];
  if (profileData.displayName) lines.push(`Display name: ${profileData.displayName}`);
  if (profileData.phone) lines.push(`Phone: ${profileData.phone}`);
  if (profileData.bio) lines.push(`Bio: ${profileData.bio}`);
  if (profileData.habits.length) lines.push(`Habits: ${profileData.habits.join(', ')}`);
  if (profileData.goals.length) lines.push(`Goals: ${profileData.goals.join(', ')}`);
  if (profileData.interests.length) lines.push(`Interests: ${profileData.interests.join(', ')}`);
  if (profileData.journalEntries.length) {
    const recent = profileData.journalEntries.slice(0, 3).map((e) => `"${e.text}"`).join(' | ');
    lines.push(`Recent journal notes: ${recent}`);
  }
  if (!lines.length) return '';
  return `\nPersonal profile:\n${lines.map((l) => `- ${l}`).join('\n')}\n`;
}

/**
 * Checks a user message to extract important long-term facts, preferences,
 * habits, or goals worth remembering for future conversations.
 */
export async function extractKeyMemories(
  userMessage: string,
  language: Language,
  profile?: UserProfile | null
): Promise<string[]> {
  // Only check if message contains personal intent keywords
  const lower = userMessage.toLowerCase();
  const triggers = [
    'thích', 'ghét', 'mục tiêu', 'thói quen', 'công việc', 'học', 'deadline', 'dự án',
    'like', 'prefer', 'hate', 'goal', 'habit', 'studying', 'learning', 'working on', 'project',
  ];
  const hasTrigger = triggers.some((t) => lower.includes(t));
  if (!hasTrigger || userMessage.length < 8) return [];

  const prompt = `You are a memory extractor for an AI companion.
Analyze this message from the user: "${userMessage}"
If the user mentions an enduring personal preference, study/work focus, habit, or goal worth remembering in future conversations, extract it into a short, concise fact in ${
    language === 'vi' ? 'Vietnamese' : 'English'
  } (e.g. "Thích nghe nhạc lofi khi lập trình" or "Đang ôn thi chứng chỉ AWS").
If the message is just a general question, small talk, or has no lasting personal fact, return an empty array [].
Return ONLY a JSON array of strings.`;

  try {
    const raw = await callGemini(
      {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      },
      { profile }
    );
    const parsed = safeJsonParse<string[]>(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Turns a natural-language style prompt into concrete CSS custom-property overrides.
 */
export async function generateThemeWithAI(
  stylePrompt: string,
  profile?: UserProfile | null
): Promise<CssThemeVariables> {
  const prompt = `You are a UI theme generator for a clean, modern life/fitness planner web app.
The user wants a theme described as: "${stylePrompt}".
Return a JSON object with hex color strings for exactly these keys, ensuring strong contrast between --bg and --text:
--bg, --panel, --panel-2, --line, --text, --text-dim, --accent, --accent-2, --sidebar-bg, --sidebar-text`;

  const raw = await callGemini(
    {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.6,
        responseSchema: {
          type: 'OBJECT',
          properties: {
            '--bg': { type: 'STRING' },
            '--panel': { type: 'STRING' },
            '--panel-2': { type: 'STRING' },
            '--line': { type: 'STRING' },
            '--text': { type: 'STRING' },
            '--text-dim': { type: 'STRING' },
            '--accent': { type: 'STRING' },
            '--accent-2': { type: 'STRING' },
            '--sidebar-bg': { type: 'STRING' },
            '--sidebar-text': { type: 'STRING' },
          },
          required: ['--bg', '--panel', '--panel-2', '--line', '--text', '--text-dim', '--accent', '--accent-2'],
        },
      },
    },
    { profile }
  );

  return safeJsonParse<CssThemeVariables>(raw);
}
