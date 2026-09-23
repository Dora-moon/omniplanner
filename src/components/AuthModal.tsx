// src/components/AuthModal.tsx
// Redesigned Auth Screen adhering to Requirement 7:
// Left: Cozy desk workspace illustration with plants, books, Omni mascot & warm handwritten tagline.
// Right: Clean sign in / sign up form with Google/Apple OAuth, email validation, and responsive mobile layout.

import React, { useState } from 'react';
import {
  GoogleAuthProvider,
  OAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
  type AuthError,
} from 'firebase/auth';
import { auth } from '@/config/firebase';
import { getUserProfile } from '@/models/user.model';
import { useTranslation } from '@/i18n/translations';
import { Button, Input } from '@/ui';
import type { Language } from '@/types';
import { Mail, Lock, User as UserIcon, Sparkles } from 'lucide-react';

interface AuthModalProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
}

function mapAuthError(error: AuthError, t: (k: any) => string): string {
  switch (error.code) {
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

export default function AuthModal({ language, onLanguageChange }: AuthModalProps) {
  const { t } = useTranslation(language);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (mode === 'register' && password !== confirmPassword) {
      setError(t('authErrorPasswordMismatch'));
      return;
    }

    setLoading(true);
    try {
      if (mode === 'register') {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        if (displayName.trim()) {
          await updateProfile(cred.user, { displayName: displayName.trim() });
        }
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      const authErr = err as AuthError;
      setError(mapAuthError(authErr, t));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setError(null);
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, new GoogleAuthProvider());
      await getUserProfile(result.user.uid);
    } catch (err) {
      const authErr = err as AuthError;
      if (
        authErr.code === 'auth/popup-closed-by-user' ||
        authErr.code === 'auth/cancelled-popup-request'
      ) {
        return;
      }
      setError(mapAuthError(authErr, t));
    } finally {
      setLoading(false);
    }
  }

  async function handleAppleLogin() {
    setError(null);
    setLoading(true);
    try {
      const provider = new OAuthProvider('apple.com');
      await signInWithPopup(auth, provider);
    } catch (err) {
      const authErr = err as AuthError;
      if (
        authErr.code === 'auth/popup-closed-by-user' ||
        authErr.code === 'auth/cancelled-popup-request'
      ) {
        return;
      }
      setError(mapAuthError(authErr, t));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-[var(--bg)] transition-colors">
      <div className="w-full max-w-4xl bg-[var(--panel)] border border-[var(--line)] rounded-3xl sm:rounded-[28px] shadow-2xl overflow-hidden flex flex-col md:flex-row transition-all">
        {/* ================= LEFT COLUMN: Cozy Artwork & Tagline ================= */}
        <div className="md:w-5/12 bg-gradient-to-br from-[#EFE6D8] via-[#E2EBE1] to-[#D5E5DA] p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden border-b md:border-b-0 md:border-r border-[var(--line)]">
          {/* Subtle Organic Background Vector Art */}
          <div className="absolute inset-0 pointer-events-none opacity-35 overflow-hidden">
            <svg viewBox="0 0 400 400" className="w-full h-full object-cover">
              <circle cx="340" cy="80" r="90" fill="#FCE5B8" />
              <path d="M-50,300 Q80,220 220,280 T450,260 L450,400 L-50,400 Z" fill="#9DBA9F" />
              <path d="M-20,330 Q120,270 280,320 T420,310 L420,400 L-20,400 Z" fill="#719A78" />
            </svg>
          </div>

          {/* Top Brand Logo */}
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white p-1.5 shadow-sm border border-[#D5DDD2] flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="Omni Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight font-sans text-[#16271D]">
                Omni
              </span>
              <span className="text-[10px] ml-1.5 font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#2F6B4F]/15 text-[#2F6B4F]">
                Life & Planner
              </span>
            </div>
          </div>

          {/* Center Cozy Scene Graphic */}
          <div className="relative z-10 my-6 sm:my-8 flex flex-col items-center text-center">
            <div className="w-32 h-32 rounded-3xl bg-white/80 backdrop-blur-sm border border-white/60 p-4 shadow-lg flex items-center justify-center relative mb-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.png"
                alt="Omni Mascot"
                className="w-full h-full object-contain drop-shadow-md hover:scale-105 transition-transform"
              />
              <span className="absolute -top-2 -right-2 p-1.5 rounded-full bg-amber-100 text-amber-600 shadow-xs border border-amber-200">
                <Sparkles size={14} />
              </span>
            </div>

            {/* Tagline in handwritten / serif display font */}
            <p className="font-serif italic text-base sm:text-lg text-[#254633] font-medium leading-relaxed max-w-xs">
              &ldquo;{t('smallStepsQuote')}&rdquo;
            </p>
            <p className="text-xs text-[#5D6F61] mt-1 font-normal">
              {t('omniTagline')}
            </p>
          </div>

          {/* Bottom Bullet Points */}
          <div className="relative z-10 space-y-2 text-xs text-[#445749] font-medium pt-2 border-t border-[#D5DDCF]/60">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2F6B4F]" />
              <span>Smart AI Schedule Parsing</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2F6B4F]" />
              <span>Pixel AI Companion with Long-Term Memory</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2F6B4F]" />
              <span>Focus Timer & Lo-Fi Sounds Lounge</span>
            </div>
          </div>
        </div>

        {/* ================= RIGHT COLUMN: Form & Social Auth ================= */}
        <div className="md:w-7/12 p-6 sm:p-10 flex flex-col justify-between bg-[var(--panel)]">
          {/* Header & Language Toggle */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold font-sans tracking-tight text-[var(--text)]">
                  {mode === 'login' ? t('authWelcomeBack') : t('authCreateAccount')}
                </h1>
                <p className="text-xs text-[var(--text-dim)] mt-0.5">
                  {t('authSubtitle')}
                </p>
              </div>

              {/* Language Switcher */}
              <div className="flex items-center bg-[var(--panel-2)] rounded-full p-0.5 border border-[var(--line)]">
                <button
                  type="button"
                  onClick={() => onLanguageChange('en')}
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                    language === 'en'
                      ? 'bg-[var(--accent)] text-white shadow-xs'
                      : 'text-[var(--text-dim)] hover:text-[var(--text)]'
                  }`}
                >
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => onLanguageChange('vi')}
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                    language === 'vi'
                      ? 'bg-[var(--accent)] text-white shadow-xs'
                      : 'text-[var(--text-dim)] hover:text-[var(--text)]'
                  }`}
                >
                  VI
                </button>
              </div>
            </div>

            {/* Social Logins */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <button
                type="button"
                disabled={loading}
                onClick={handleGoogleLogin}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl border border-[var(--line)] bg-[var(--panel-2)] hover:bg-[var(--panel)] hover:border-[var(--accent)] text-xs font-semibold text-[var(--text)] transition-all shadow-2xs active:scale-95 disabled:opacity-50"
              >
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3h3.88c2.27-2.09 3.66-5.17 3.66-9.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.09C3.27 21.36 7.35 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.32c-.25-.72-.38-1.49-.38-2.32s.13-1.6.38-2.32V6.59H1.26C.46 8.18 0 9.99 0 12s.46 3.82 1.26 5.41l4.02-3.09z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.27 2.64 1.26 6.59l4.02 3.09c.95-2.83 3.6-4.93 6.72-4.93z"
                  />
                </svg>
                <span>Google</span>
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={handleAppleLogin}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl border border-[var(--line)] bg-[var(--panel-2)] hover:bg-[var(--panel)] hover:border-[var(--accent)] text-xs font-semibold text-[var(--text)] transition-all shadow-2xs active:scale-95 disabled:opacity-50"
              >
                <svg className="w-4 h-4 fill-current flex-shrink-0" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.89c.66-.82 1.11-1.95.99-3.09-.95.04-2.11.64-2.79 1.44-.6.69-1.12 1.83-.98 2.94 1.07.08 2.16-.54 2.78-1.29z" />
                </svg>
                <span>Apple</span>
              </button>
            </div>

            {/* Divider */}
            <div className="relative flex items-center justify-center my-4">
              <div className="w-full border-t border-[var(--line)]" />
              <span className="px-3 bg-[var(--panel)] text-[11px] uppercase tracking-wider text-[var(--text-dim)] absolute font-medium">
                {t('authOrContinueWith')}
              </span>
            </div>

            {/* Email / Password Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {mode === 'register' && (
                <Input
                  label={t('authDisplayName')}
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Alex Rivers"
                  leftIcon={<UserIcon size={16} />}
                />
              )}

              <Input
                label={t('authEmail')}
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                leftIcon={<Mail size={16} />}
              />

              <Input
                label={t('authPassword')}
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                leftIcon={<Lock size={16} />}
              />

              {mode === 'register' && (
                <Input
                  label={t('authConfirmPassword')}
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  leftIcon={<Lock size={16} />}
                />
              )}

              {error && (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-medium">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                block
                size="lg"
                loading={loading}
                className="mt-2"
              >
                {mode === 'login' ? t('authLogin') : t('authRegister')}
              </Button>
            </form>
          </div>

          {/* Bottom Switcher */}
          <div className="text-center pt-5 mt-4 border-t border-[var(--line)]">
            <button
              type="button"
              onClick={() => {
                setError(null);
                setConfirmPassword('');
                setMode(mode === 'login' ? 'register' : 'login');
              }}
              className="text-xs font-semibold text-[var(--accent)] hover:underline underline-offset-4 transition-all"
            >
              {mode === 'login' ? t('authSwitchToRegister') : t('authSwitchToLogin')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
