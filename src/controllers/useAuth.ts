// src/controllers/useAuth.ts
// Controller hook managing authentication state, profile hydration, and onboarding.

import { useEffect, useState, useCallback } from 'react';
import {
  onAuthStateChanged,
  signOut,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
  OAuthProvider,
  type User,
  type AuthError,
} from 'firebase/auth';
import { auth } from '@/config/firebase';
import {
  createUserProfile,
  getUserProfile,
  subscribeUserProfile,
  updateUserProfile,
} from '@/models/user.model';
import { DEFAULT_THEME } from '@/types';
import type { AppMode, Gender, Goal, Language, UserProfile } from '@/types';
import { applyThemeToDocument } from '@/ui/tokens';

export function useAuth() {
  const [authUser, setAuthUser] = useState<User | null | undefined>(undefined); // undefined = loading
  const [profile, setProfile] = useState<UserProfile | null | undefined>(undefined); // undefined = loading
  const [language, setLanguage] = useState<Language>('en');

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setAuthUser(user);
      if (user === null) {
        setProfile(null);
      }
    });
    return () => unsub();
  }, []);

  // Listen to User Profile changes in Firestore
  useEffect(() => {
    if (!authUser) {
      if (authUser === null) setProfile(null);
      return;
    }
    const unsubProfile = subscribeUserProfile(authUser.uid, (p) => {
      setProfile(p);
      if (p) {
        setLanguage(p.language);
        applyThemeToDocument(p);
      }
    });
    return () => unsubProfile();
  }, [authUser]);

  const handleOnboardingComplete = useCallback(
    async (data: {
      heightCm: number | null;
      weightKg: number | null;
      age: number | null;
      gender: Gender;
      goal: Goal;
    }) => {
      if (!authUser) return;
      const now = Date.now();
      const existing = (profile || {}) as Partial<UserProfile>;
      const newProfile: UserProfile = {
        uid: authUser.uid,
        displayName: existing.displayName || authUser.displayName || authUser.email?.split('@')[0] || 'User',
        email: authUser.email || existing.email || '',
        heightCm: data.heightCm,
        weightKg: data.weightKg,
        age: data.age,
        gender: data.gender,
        goal: data.goal,
        mascotUrl: existing.mascotUrl || null,
        themeConfig: existing.themeConfig || DEFAULT_THEME,
        language,
        mode: existing.mode || 'view',
        onboarded: true,
        createdAt: existing.createdAt || now,
        updatedAt: now,
      };
      await createUserProfile(newProfile);
    },
    [authUser, profile, language]
  );

  async function handleLanguageChange(lang: Language) {
    setLanguage(lang);
    if (authUser && profile) {
      await updateUserProfile(authUser.uid, { language: lang });
    }
  }

  async function handleModeChange(mode: AppMode) {
    if (!authUser) return;
    await updateUserProfile(authUser.uid, { mode });
  }

  async function handleLogout() {
    await signOut(auth);
  }

  async function signInWithEmail(email: string, pass: string): Promise<User> {
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    return cred.user;
  }

  async function signUpWithEmail(
    email: string,
    pass: string,
    displayName?: string
  ): Promise<User> {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    if (displayName?.trim()) {
      await updateProfile(cred.user, { displayName: displayName.trim() });
    }
    return cred.user;
  }

  async function signInWithGoogle(): Promise<User> {
    const cred = await signInWithPopup(auth, new GoogleAuthProvider());
    await getUserProfile(cred.user.uid);
    return cred.user;
  }

  async function signInWithApple(): Promise<User> {
    const provider = new OAuthProvider('apple.com');
    const cred = await signInWithPopup(auth, provider);
    return cred.user;
  }

  return {
    authUser,
    profile,
    language,
    setLanguage: handleLanguageChange,
    onModeChange: handleModeChange,
    onLogout: handleLogout,
    onOnboardingComplete: handleOnboardingComplete,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signInWithApple,
  };
}

export function mapAuthError(error: AuthError | any, t: (k: any) => string): string {
  const code = error?.code;
  switch (code) {
    case 'auth/invalid-email':
      return t('authErrorInvalidEmail');
    case 'auth/weak-password':
      return t('authErrorWeakPassword');
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
      return t('authErrorWrongPassword');
    case 'auth/email-already-in-use':
      return t('authErrorEmailInUse');
    case 'auth/operation-not-allowed':
      return t('authErrorOperationNotAllowed');
    case 'auth/network-request-failed':
      return t('authErrorNetworkFailed');
    default:
      return t('authErrorGeneric');
  }
}
