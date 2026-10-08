// src/components/ProfileView.tsx
// Profile View (Requirement 5): Expanded personal profile management.
// Manages full name, phone number, avatar upload, habits, goals, interests, and daily journal entries.

import React, { useState } from 'react';
import { useTranslation } from '@/i18n/translations';
import { useProfile } from '@/controllers/useProfile';
import { Button, Input, Card, Badge } from '@/ui';
import type { Language, UserProfile } from '@/types';
import {
  User,
  Phone,
  Camera,
  Heart,
  Target,
  Sparkles,
  BookOpen,
  Plus,
  Trash2,
  CheckCircle2,
  Calendar,
  AlertCircle,
} from 'lucide-react';

interface ProfileViewProps {
  uid: string;
  profile: UserProfile;
  language: Language;
}

export default function ProfileView({ uid, profile, language }: ProfileViewProps) {
  const { t } = useTranslation(language);
  const {
    data,
    loading,
    displayName,
    setDisplayName,
    phone,
    setPhone,
    bio,
    setBio,
    avatarUrl,
    habits,
    goals,
    interests,
    journalText,
    setJournalText,
    saving,
    savedMsg,
    avatarUploading,
    avatarError,
    handleAvatarUpload,
    handleSavePersonal,
    handleAddJournal,
    handleDeleteJournal,
    addTag,
    removeTag,
  } = useProfile({ uid, profile, language });

  // Local state for adding custom tags
  const [newHabit, setNewHabit] = useState('');
  const [newGoal, setNewGoal] = useState('');
  const [newInterest, setNewInterest] = useState('');

  const currentAvatar = avatarUrl || profile.mascotUrl || null;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="pb-3 border-b border-[var(--line)]">
        <h1 className="text-2xl font-serif font-bold text-[var(--text)]">
          {t('profileTitle')}
        </h1>
        <p className="text-xs sm:text-sm text-[var(--text-dim)] mt-0.5">
          {t('profileSubtitle')}
        </p>
      </div>

      {/* 1. PERSONAL INFORMATION & AVATAR */}
      <Card className="p-6 space-y-6">
        <div className="flex items-center gap-2 border-b border-[var(--line)] pb-3">
          <User size={18} className="text-[var(--accent)]" />
          <h2 className="text-base font-bold text-[var(--text)]">
            {language === 'vi' ? 'Thông tin cá nhân & Ảnh đại diện' : 'Personal Details & Avatar'}
          </h2>
        </div>

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar Upload Frame */}
          <div className="flex flex-col items-center gap-2 flex-shrink-0">
            <div className="relative w-28 h-28 rounded-3xl overflow-hidden bg-[var(--panel-2)] border-2 border-[var(--line)] shadow-md group">
              {currentAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={currentAvatar}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-[var(--accent)]/15 text-[var(--accent)] text-3xl font-bold font-sans">
                  {displayName.charAt(0).toUpperCase() || 'U'}
                </div>
              )}

              {/* Upload overlay */}
              <label
                htmlFor="avatar-file-input"
                className="absolute inset-0 bg-black/40 backdrop-blur-2xs opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white cursor-pointer transition-opacity"
              >
                <Camera size={22} />
                <span className="text-[10px] font-semibold mt-1">Change</span>
              </label>
              <input
                id="avatar-file-input"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                disabled={avatarUploading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleAvatarUpload(file);
                }}
              />
            </div>

            <label
              htmlFor="avatar-file-input"
              className="text-xs font-semibold text-[var(--accent)] hover:underline cursor-pointer"
            >
              {avatarUploading
                ? (language === 'vi' ? 'Đang tải lên...' : 'Uploading...')
                : (language === 'vi' ? 'Tải ảnh mới' : 'Upload photo')}
            </label>

            {avatarError && (
              <span className="text-[11px] text-rose-500 font-medium max-w-xs text-center">
                {avatarError}
              </span>
            )}
          </div>

          {/* Form fields */}
          <div className="flex-1 w-full space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label={t('profileDisplayName')}
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Alex Rivers"
              />
              <Input
                label={t('profilePhone')}
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+84 912 345 678"
                leftIcon={<Phone size={15} />}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[var(--text-dim)]">
                {t('profileBio')}
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                placeholder={t('profileBioPlaceholder')}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-[var(--panel-2)] border border-[var(--line)] text-xs text-[var(--text)] placeholder:text-[var(--text-dim)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all resize-none"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button
                type="button"
                variant="primary"
                loading={saving}
                disabled={saving}
                onClick={handleSavePersonal}
              >
                {saving ? t('saving') : (language === 'vi' ? 'Lưu thông tin' : 'Save Changes')}
              </Button>
              {savedMsg && (
                <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle2 size={15} />
                  <span>{savedMsg}</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* 2. HABITS, GOALS & INTERESTS (TAG MANAGEMENT) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Habits */}
        <Card className="p-5 space-y-3">
          <div className="flex items-center gap-2 border-b border-[var(--line)] pb-2">
            <Heart size={16} className="text-rose-500" />
            <h3 className="text-sm font-bold text-[var(--text)]">{t('profileHabits')}</h3>
          </div>
          <p className="text-[11px] text-[var(--text-dim)]">{t('profileHabitsHint')}</p>

          {/* Tag list */}
          <div className="flex flex-wrap gap-1.5 min-h-[48px]">
            {habits.map((h) => (
              <span
                key={h}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--panel-2)] border border-[var(--line)] text-xs text-[var(--text)]"
              >
                <span>{h}</span>
                <button
                  type="button"
                  onClick={() => removeTag('habits', h)}
                  className="hover:text-rose-500 transition-colors"
                >
                  ×
                </button>
              </span>
            ))}
            {habits.length === 0 && (
              <span className="text-[11px] text-[var(--text-dim)] italic self-center">
                {language === 'vi' ? 'Chưa có thói quen' : 'No habits added'}
              </span>
            )}
          </div>

          {/* Add habit input */}
          <div className="flex gap-1.5 pt-1">
            <input
              type="text"
              value={newHabit}
              onChange={(e) => setNewHabit(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  addTag('habits', newHabit);
                  setNewHabit('');
                }
              }}
              placeholder={language === 'vi' ? 'Thêm thói quen...' : 'Add habit...'}
              className="flex-1 px-3 py-1.5 rounded-xl bg-[var(--panel-2)] border border-[var(--line)] text-xs text-[var(--text)] placeholder:text-[var(--text-dim)] focus:outline-none focus:border-[var(--accent)]"
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={!newHabit.trim()}
              onClick={() => {
                addTag('habits', newHabit);
                setNewHabit('');
              }}
            >
              {t('profileAddTag')}
            </Button>
          </div>
        </Card>

        {/* Goals */}
        <Card className="p-5 space-y-3">
          <div className="flex items-center gap-2 border-b border-[var(--line)] pb-2">
            <Target size={16} className="text-amber-500" />
            <h3 className="text-sm font-bold text-[var(--text)]">{t('profileGoals')}</h3>
          </div>
          <p className="text-[11px] text-[var(--text-dim)]">{t('profileGoalsHint')}</p>

          {/* Tag list */}
          <div className="flex flex-wrap gap-1.5 min-h-[48px]">
            {goals.map((g) => (
              <span
                key={g}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--panel-2)] border border-[var(--line)] text-xs text-[var(--text)]"
              >
                <span>{g}</span>
                <button
                  type="button"
                  onClick={() => removeTag('goals', g)}
                  className="hover:text-rose-500 transition-colors"
                >
                  ×
                </button>
              </span>
            ))}
            {goals.length === 0 && (
              <span className="text-[11px] text-[var(--text-dim)] italic self-center">
                {language === 'vi' ? 'Chưa có mục tiêu' : 'No goals added'}
              </span>
            )}
          </div>

          {/* Add goal input */}
          <div className="flex gap-1.5 pt-1">
            <input
              type="text"
              value={newGoal}
              onChange={(e) => setNewGoal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  addTag('goals', newGoal);
                  setNewGoal('');
                }
              }}
              placeholder={language === 'vi' ? 'Thêm mục tiêu...' : 'Add goal...'}
              className="flex-1 px-3 py-1.5 rounded-xl bg-[var(--panel-2)] border border-[var(--line)] text-xs text-[var(--text)] placeholder:text-[var(--text-dim)] focus:outline-none focus:border-[var(--accent)]"
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={!newGoal.trim()}
              onClick={() => {
                addTag('goals', newGoal);
                setNewGoal('');
              }}
            >
              {t('profileAddTag')}
            </Button>
          </div>
        </Card>

        {/* Interests */}
        <Card className="p-5 space-y-3">
          <div className="flex items-center gap-2 border-b border-[var(--line)] pb-2">
            <Sparkles size={16} className="text-cyan-500" />
            <h3 className="text-sm font-bold text-[var(--text)]">{t('profileInterests')}</h3>
          </div>
          <p className="text-[11px] text-[var(--text-dim)]">{t('profileInterestsHint')}</p>

          {/* Tag list */}
          <div className="flex flex-wrap gap-1.5 min-h-[48px]">
            {interests.map((it) => (
              <span
                key={it}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--panel-2)] border border-[var(--line)] text-xs text-[var(--text)]"
              >
                <span>{it}</span>
                <button
                  type="button"
                  onClick={() => removeTag('interests', it)}
                  className="hover:text-rose-500 transition-colors"
                >
                  ×
                </button>
              </span>
            ))}
            {interests.length === 0 && (
              <span className="text-[11px] text-[var(--text-dim)] italic self-center">
                {language === 'vi' ? 'Chưa có sở thích' : 'No interests added'}
              </span>
            )}
          </div>

          {/* Add interest input */}
          <div className="flex gap-1.5 pt-1">
            <input
              type="text"
              value={newInterest}
              onChange={(e) => setNewInterest(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  addTag('interests', newInterest);
                  setNewInterest('');
                }
              }}
              placeholder={language === 'vi' ? 'Thêm sở thích...' : 'Add interest...'}
              className="flex-1 px-3 py-1.5 rounded-xl bg-[var(--panel-2)] border border-[var(--line)] text-xs text-[var(--text)] placeholder:text-[var(--text-dim)] focus:outline-none focus:border-[var(--accent)]"
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={!newInterest.trim()}
              onClick={() => {
                addTag('interests', newInterest);
                setNewInterest('');
              }}
            >
              {t('profileAddTag')}
            </Button>
          </div>
        </Card>
      </div>

      {/* 3. PERSONAL JOURNAL & REFLECTIONS */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-[var(--line)] pb-3">
          <BookOpen size={18} className="text-[var(--accent)]" />
          <div>
            <h2 className="text-base font-bold text-[var(--text)]">{t('profileJournal')}</h2>
            <p className="text-xs text-[var(--text-dim)] mt-0.5">
              {language === 'vi'
                ? 'Ghi lại chiêm nghiệm, bài học hay cảm xúc của bạn mỗi ngày.'
                : 'Capture your thoughts, reflections, and insights every day.'}
            </p>
          </div>
        </div>

        {/* Add Entry Form */}
        <div className="space-y-2">
          <textarea
            value={journalText}
            onChange={(e) => setJournalText(e.target.value)}
            rows={3}
            placeholder={t('profileJournalPlaceholder')}
            className="w-full px-3.5 py-2.5 rounded-2xl bg-[var(--panel-2)] border border-[var(--line)] text-xs text-[var(--text)] placeholder:text-[var(--text-dim)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all resize-none"
          />
          <div className="flex justify-end">
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={!journalText.trim()}
              onClick={handleAddJournal}
              leftIcon={<Plus size={14} />}
            >
              {t('profileAddJournalBtn')}
            </Button>
          </div>
        </div>

        {/* Journal Entries List */}
        <div className="space-y-3 pt-2">
          {(!data?.journalEntries || data.journalEntries.length === 0) ? (
            <div className="p-8 rounded-2xl bg-[var(--panel-2)] text-center text-xs text-[var(--text-dim)]">
              {t('profileEmptyJournal')}
            </div>
          ) : (
            data.journalEntries.map((entry) => {
              const d = new Date(entry.createdAt);
              const dateStr = d.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={entry.id}
                  className="p-4 rounded-2xl border border-[var(--line)] bg-[var(--panel-2)] text-xs text-[var(--text)] space-y-2 relative group"
                >
                  <div className="flex items-center justify-between text-[11px] text-[var(--text-dim)]">
                    <span className="flex items-center gap-1 font-mono">
                      <Calendar size={12} />
                      {dateStr}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteJournal(entry.id)}
                      title="Delete note"
                      className="p-1 rounded-md text-[var(--text-dim)] hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <p className="whitespace-pre-wrap leading-relaxed text-[13px]">{entry.text}</p>
                </div>
              );
            })
          )}
        </div>
      </Card>
    </div>
  );
}
