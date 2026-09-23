// src/config/firebase.ts
// Initializes the Firebase App and exports the Auth, Firestore and Storage
// instances used throughout the app. All values come from environment
// variables — see .env.local.example for the required keys.

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function assertConfig() {
  const missing = Object.entries(firebaseConfig)
    .filter(([, v]) => !v)
    .map(([k]) => k);
  if (missing.length > 0) {
    // eslint-disable-next-line no-console
    console.warn(
      `[firebase] Missing env vars: ${missing.join(', ')}. ` +
        'Copy .env.local.example to .env.local and fill in your Firebase project credentials.'
    );
  }
}
assertConfig();

// Reuse the existing app instance on hot reload / repeated imports instead
// of re-initializing (Next.js App Router re-evaluates modules per request
// on the server, and Fast Refresh on the client).
const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
export const storage: FirebaseStorage = getStorage(app);
export default app;
