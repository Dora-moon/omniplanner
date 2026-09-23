# OmniPlanner & Pixel AI Companion

Universal Life Management & Calendar Workspace with an interactive Pixel Art
AI Mascot Companion. Next.js 14 (App Router) + Firebase (Auth, Firestore,
Storage) + Gemini (`gemini-2.5-flash`).

## 1. Project structure

```
src/
├── types/index.ts            # All shared TypeScript interfaces
├── config/firebase.ts        # Firebase app/auth/firestore/storage init
├── i18n/translations.ts      # Complete VI/EN dictionary + t() helper
├── services/
│   ├── aiService.ts          # Gemini: schedule parser, mascot chat, theme generator
│   └── databaseService.ts    # Firestore CRUD + Storage upload
├── components/
│   ├── AuthModal.tsx         # Email/password login & register
│   ├── OnboardingModal.tsx   # Body profile + goal setup
│   ├── TopNav.tsx            # Tabs + language switcher + logout
│   ├── CalendarView.tsx      # Week/month grid + voice-enabled AI parser
│   ├── PixelAssistant.tsx    # Mascot sprite/canvas + context-aware chat
│   ├── TimerModule.tsx       # Pomodoro / rest timer
│   ├── MusicPlayer.tsx       # Web Audio ambient focus tone
│   └── SettingsPanel.tsx     # Mode toggle, theme, mascot upload, profile
└── app/
    ├── layout.tsx
    ├── globals.css
    └── page.tsx               # Orchestrates auth state + real-time listeners
```

Root also has `firestore.rules` and `storage.rules` — deploy both so the
database and mascot uploads are actually locked to their owning user.

## 2. Firebase setup

1. Create a project at https://console.firebase.google.com.
2. **Authentication** → Sign-in method → enable **Email/Password**.
3. **Firestore Database** → Create database (production mode is fine; the
   rules file below locks it down).
4. **Storage** → Get started (default bucket is fine).
5. Project settings → General → "Your apps" → Add a Web app → copy the
   config values into `.env.local` (see step 4 below).
6. Deploy the security rules (requires the Firebase CLI: `npm i -g firebase-tools`):
   ```bash
   firebase login
   firebase init firestore storage   # point at this project, keep the existing rules files
   firebase deploy --only firestore:rules,storage:rules
   ```

Firestore schema this app reads/writes:
- `users/{uid}` — profile, body metrics, goal, theme config, mascot URL, mode, language
- `users/{uid}/tasks/{taskId}` — title, date (`YYYY-MM-DD`), time, category, completed
- `users/{uid}/habits/{habitId}` — name, frequency, streak counters

## 3. Gemini setup

1. Get an API key at https://aistudio.google.com/app/apikey.
2. Put it in `NEXT_PUBLIC_GEMINI_API_KEY` (see below). Note: this ships the
   key to the browser bundle, which is fine for local development/prototypes
   but **not** for a public production deployment — for production, proxy
   `src/services/aiService.ts`'s three functions through a Next.js Route
   Handler (`src/app/api/.../route.ts`) that holds the key server-side
   instead of calling Gemini directly from the client.

## 4. Environment variables

```bash
cp .env.local.example .env.local
# then fill in every value
```

## 5. Install & run

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## 6. Known simplifications

- **Chat history** (Pixel companion conversation) is kept in local React
  state, not persisted to Firestore — the brief's schema only defines
  `users`, `tasks`, and `habits` collections. Add a `users/{uid}/chat`
  subcollection + a couple of `databaseService` functions if you want chat
  to survive a refresh.
- **Voice input** uses the browser's Web Speech API (`SpeechRecognition`),
  which is well-supported in Chrome/Edge but not in Firefox or Safari at
  the time of writing — `CalendarView` falls back to a visible message
  (`calVoiceUnsupported`) rather than failing silently.
- **Habit streak UI**: `databaseService.markHabitDone` implements the
  streak-increment logic, but no component currently calls it — wire a
  "mark done" button into a Habits view/section using `subscribeHabits` +
  `markHabitDone` when you're ready to surface habits in the UI. (Habits are
  already fetched into `page.tsx`'s `habits` state and shown as the "Habit
  Streak" stat on the Companion tab.)
- **Gemini key exposure**: see the note under "Gemini setup" above.
