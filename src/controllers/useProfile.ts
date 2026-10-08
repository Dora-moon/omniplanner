// src/controllers/useProfile.ts
// Controller hook for the expanded Personal Profile page (Requirement 6).
// Owns the personal data (display name, phone, avatar, habits, goals,
// interests, journal entries) and exposes both read-only state and
// mutations that write straight to Firestore through the Model layer.

import { useEffect, useState } from 'react';
import { toast } from '@/ui/Toast';
import {
  getProfileData,
  saveProfileData,
  addJournalEntry,
  deleteJournalEntry,
} from '@/models/profile.model';
import { uploadAvatar, updateUserProfile } from '@/models/user.model';
import type {
  Gender,
  JournalEntry,
  Language,
  ProfileData,
  UserProfile,
} from '@/types';

interface UseProfileArgs {
  uid: string;
  profile: UserProfile;
  language: Language;
}

export function useProfile({ uid, profile, language }: UseProfileArgs) {
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  // Form state mirroring the current profile data
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [habits, setHabits] = useState<string[]>([]);
  const [goals, setGoals] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [journalText, setJournalText] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    getProfileData(uid)
      .then((d) => {
        if (!active) return;
        setData(d);
        setDisplayName(d.displayName || profile.displayName || '');
        setPhone(d.phone || '');
        setBio(d.bio || '');
        setAvatarUrl(d.avatarUrl || profile.mascotUrl || null);
        setHabits(d.habits || []);
        setGoals(d.goals || []);
        setInterests(d.interests || []);
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  const t = (key: string) => key; // translations handled by the view

  async function handleAvatarUpload(file: File) {
    setAvatarUploading(true);
    setAvatarError('');
    try {
      // uploadAvatar compresses the image and writes the data URL straight to
      // profileData.avatarUrl + mascotUrl on the user doc (no Storage).
      const url = await uploadAvatar(uid, file);
      setAvatarUrl(url);
      toast.success(
        language === 'vi' ? 'Đã cập nhật avatar!' : 'Avatar updated!'
      );
    } catch (err: any) {
      const code = err?.code || 'upload-failed';
      setAvatarError(err.message || 'Avatar upload failed');
      toast.error(err.message || 'Avatar upload failed', code);
    } finally {
      setAvatarUploading(false);
    }
  }

  async function handleSavePersonal() {
    setSaving(true);
    setSavedMsg('');
    try {
      await saveProfileData(uid, {
        displayName: displayName.trim(),
        phone: phone.trim() || null,
        bio: bio.trim(),
        avatarUrl,
        habits,
        goals,
        interests,
      });
      // Keep the user doc's displayName and avatar in sync so the sidebar stays consistent
      if (displayName.trim()) {
        await updateUserProfile(uid, {
          displayName: displayName.trim(),
          ...(avatarUrl ? { mascotUrl: avatarUrl } : {}),
        });
      }
      setSavedMsg(language === 'vi' ? 'Đã lưu hồ sơ thành công!' : 'Profile saved successfully!');
      toast.success(
        language === 'vi' ? 'Đã lưu hồ sơ thành công!' : 'Profile saved successfully!'
      );
      setTimeout(() => setSavedMsg(''), 3000);
    } catch (err: any) {
      console.error('Failed to save profile:', err);
      toast.error(
        err.message ||
          (language === 'vi' ? 'Không thể lưu hồ sơ.' : 'Failed to save profile.'),
        err?.code || 'save-failed'
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleAddJournal() {
    const text = journalText.trim();
    if (!text) return;
    try {
      await addJournalEntry(uid, text);
      setJournalText('');
      const updated = await getProfileData(uid);
      setData(updated);
    } catch (err) {
      console.error('Failed to add journal entry:', err);
    }
  }

  async function handleDeleteJournal(entryId: string) {
    try {
      await deleteJournalEntry(uid, entryId);
      const updated = await getProfileData(uid);
      setData(updated);
    } catch (err) {
      console.error('Failed to delete journal entry:', err);
    }
  }

  function toggleList(
    list: 'habits' | 'goals' | 'interests',
    setter: (v: string[]) => void,
    value: string
  ) {
    const arr = list === 'habits' ? habits : list === 'goals' ? goals : interests;
    const exists = arr.includes(value);
    const next = exists ? arr.filter((v) => v !== value) : [...arr, value];
    setter(next);
  }

  function addTag(list: 'habits' | 'goals' | 'interests', value: string) {
    const trimmed = value.trim();
    if (!trimmed) return;
    if (list === 'habits') {
      if (!habits.includes(trimmed)) setHabits([...habits, trimmed]);
    } else if (list === 'goals') {
      if (!goals.includes(trimmed)) setGoals([...goals, trimmed]);
    } else {
      if (!interests.includes(trimmed)) setInterests([...interests, trimmed]);
    }
  }

  function removeTag(list: 'habits' | 'goals' | 'interests', value: string) {
    if (list === 'habits') {
      setHabits(habits.filter((h) => h !== value));
    } else if (list === 'goals') {
      setGoals(goals.filter((g) => g !== value));
    } else {
      setInterests(interests.filter((i) => i !== value));
    }
  }

  return {
    data,
    loading,
    displayName,
    setDisplayName,
    phone,
    setPhone,
    bio,
    setBio,
    avatarUrl,
    setAvatarUrl,
    habits,
    setHabits,
    goals,
    setGoals,
    interests,
    setInterests,
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
    toggleList,
    addTag,
    removeTag,
  };
}