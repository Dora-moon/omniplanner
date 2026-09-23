// src/controllers/useSettings.ts
// Controller hook managing Settings: theme customization, background color/image upload,
// body metrics, and AI memories privacy controls.

import { useState, useRef, useEffect } from 'react';
import { generateThemeWithAI } from '@/services/aiService';
import {
  saveThemeConfig,
  updateUserProfile,
  uploadBackgroundImage,
  uploadMascotSprite,
} from '@/models/user.model';
import {
  addUserMemory,
  clearUserMemories,
  deleteUserMemory,
  subscribeUserMemories,
} from '@/models/memory.model';
import { THEME_PRESET_COLORS } from '@/types';
import type {
  AIMemory,
  AppMode,
  Gender,
  Language,
  ThemeConfig,
  ThemePreset,
  UserProfile,
} from '@/types';

export function useSettings({
  uid,
  language,
  profile,
  onModeChange,
}: {
  uid: string;
  language: Language;
  profile: UserProfile;
  onModeChange: (mode: AppMode) => void;
}) {
  const editable = profile.mode === 'edit';

  // AI Theme Generator
  const [themePrompt, setThemePrompt] = useState('');
  const [themeStatus, setThemeStatus] = useState('');
  const [themeLoading, setThemeLoading] = useState(false);

  // Background customization
  const [customBgColor, setCustomBgColor] = useState(
    profile.customBackground && profile.backgroundType === 'color'
      ? profile.customBackground
      : profile.themeConfig?.overrides?.['--bg'] || '#F7F5EF'
  );
  const [bgUploadLoading, setBgUploadLoading] = useState(false);
  const [bgUploadError, setBgUploadError] = useState('');

  // Profile data
  const [heightCm, setHeightCm] = useState(profile.heightCm?.toString() ?? '');
  const [weightKg, setWeightKg] = useState(profile.weightKg?.toString() ?? '');
  const [age, setAge] = useState(profile.age?.toString() ?? '');
  const [gender, setGender] = useState<Gender>(profile.gender);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSavedMsg, setProfileSavedMsg] = useState('');

  // Mascot sprite upload
  const [mascotUploading, setMascotUploading] = useState(false);
  const [mascotError, setMascotError] = useState('');

  // AI Memories
  const [memories, setMemories] = useState<AIMemory[]>([]);
  const [newMemoryText, setNewMemoryText] = useState('');

  // Real-time memories subscription
  useEffect(() => {
    if (!uid) return;
    const unsub = subscribeUserMemories(uid, setMemories);
    return () => unsub();
  }, [uid]);

  async function applyPreset(preset: Exclude<ThemePreset, 'custom'>) {
    if (!editable) return;
    const theme: ThemeConfig = {
      preset,
      overrides: THEME_PRESET_COLORS[preset] || {},
    };
    await saveThemeConfig(uid, theme);
    // Reset custom background image if switching preset, or keep as desired
  }

  async function handleGenerateTheme() {
    if (!editable || !themePrompt.trim()) return;
    setThemeLoading(true);
    setThemeStatus(language === 'vi' ? 'Đang tạo giao diện...' : 'Generating theme...');
    try {
      const overrides = await generateThemeWithAI(themePrompt.trim());
      await saveThemeConfig(uid, { preset: 'custom', overrides });
      setThemeStatus(language === 'vi' ? 'Đã áp dụng giao diện!' : 'Theme applied!');
    } catch (err) {
      setThemeStatus(language === 'vi' ? 'Không thể tạo giao diện lúc này.' : 'Failed to generate theme.');
      console.error(err);
    } finally {
      setThemeLoading(false);
    }
  }

  async function handleBackgroundColorChange(hex: string) {
    if (!editable) return;
    setCustomBgColor(hex);
    await updateUserProfile(uid, {
      customBackground: hex,
      backgroundType: 'color',
      themeConfig: {
        ...profile.themeConfig,
        overrides: {
          ...profile.themeConfig.overrides,
          '--bg': hex,
        },
      },
    });
  }

  async function handleBackgroundImageUpload(file: File) {
    if (!editable) return;
    setBgUploadLoading(true);
    setBgUploadError('');
    try {
      const url = await uploadBackgroundImage(uid, file);
      await updateUserProfile(uid, {
        customBackground: url,
        backgroundType: 'image',
      });
    } catch (err: any) {
      setBgUploadError(err.message || 'Upload failed');
    } finally {
      setBgUploadLoading(false);
    }
  }

  async function handleRemoveBackground() {
    if (!editable) return;
    await updateUserProfile(uid, {
      customBackground: null,
      backgroundType: 'default',
    });
  }

  async function handleProfileSave() {
    setProfileSaving(true);
    try {
      await updateUserProfile(uid, {
        heightCm: heightCm ? Number(heightCm) : null,
        weightKg: weightKg ? Number(weightKg) : null,
        age: age ? Number(age) : null,
        gender,
      });
      setProfileSavedMsg(language === 'vi' ? 'Đã lưu!' : 'Saved!');
      setTimeout(() => setProfileSavedMsg(''), 3000);
    } finally {
      setProfileSaving(false);
    }
  }

  async function handleMascotUpload(file: File) {
    if (!editable) return;
    setMascotUploading(true);
    setMascotError('');
    try {
      const url = await uploadMascotSprite(uid, file);
      await updateUserProfile(uid, { mascotUrl: url });
    } catch (err: any) {
      setMascotError(err.message || 'Mascot upload failed');
    } finally {
      setMascotUploading(false);
    }
  }

  async function handleAddMemory() {
    if (!newMemoryText.trim()) return;
    await addUserMemory(uid, newMemoryText.trim(), 'preference');
    setNewMemoryText('');
  }

  async function handleDeleteMemory(id: string) {
    await deleteUserMemory(uid, id);
  }

  async function handleClearAllMemories() {
    if (window.confirm(language === 'vi' ? 'Xóa toàn bộ bộ nhớ của Pixel?' : 'Clear all AI memories?')) {
      await clearUserMemories(uid);
    }
  }

  return {
    editable,
    themePrompt,
    setThemePrompt,
    themeStatus,
    themeLoading,
    customBgColor,
    bgUploadLoading,
    bgUploadError,
    heightCm,
    setHeightCm,
    weightKg,
    setWeightKg,
    age,
    setAge,
    gender,
    setGender,
    profileSaving,
    profileSavedMsg,
    mascotUploading,
    mascotError,
    memories,
    newMemoryText,
    setNewMemoryText,
    applyPreset,
    handleGenerateTheme,
    handleBackgroundColorChange,
    handleBackgroundImageUpload,
    handleRemoveBackground,
    handleProfileSave,
    handleMascotUpload,
    handleAddMemory,
    handleDeleteMemory,
    handleClearAllMemories,
    onModeChange,
  };
}
