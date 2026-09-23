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
  type User,
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
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [language, setLanguage] = useState<Language>('en');

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => setAuthUser(user));
    return () => unsub();
  }, []);

  // Listen to User Profile changes in Firestore
  useEffect(() => {
    if (!authUser) {
      setProfile(null);
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
      const newProfile: UserProfile = {
        uid: authUser.uid,
        displayName: authUser.displayName || authUser.email?.split('@')[0] || 'User',
        email: authUser.email || '',
        heightCm: data.heightCm,
        weightKg: data.weightKg,
        age: data.age,
        gender: data.gender,
        goal: data.goal,
        mascotUrl: null,
        themeConfig: DEFAULT_THEME,
        language,
        mode: 'view',
        onboarded: true,
        createdAt: now,
        updatedAt: now,
      };
      await createUserProfile(newProfile);
    },
    [authUser, language]
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

  return {
    authUser,
    profile,
    language,
    setLanguage: handleLanguageChange,
    onModeChange: handleModeChange,
    onLogout: handleLogout,
    onOnboardingComplete: handleOnboardingComplete,
  };
}
