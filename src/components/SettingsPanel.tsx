// src/components/SettingsPanel.tsx
// Comprehensive Settings Panel adhering to Requirements 2, 6, and 8:
// - Theme Presets & AI Generator
// - Custom background color picker & Firebase Storage wallpaper upload
// - Pixel AI Memory privacy manager (view/delete/clear memories)
// - Body profile editing & Mascot sprite upload with standardized UI components.

import React from 'react';
import { useTranslation } from '@/i18n/translations';
import { useSettings } from '@/controllers/useSettings';
import { Button, Input, Select, Card, ColorPicker, FileUpload } from '@/ui';
import { THEME_PRESET_COLORS } from '@/types';
import type { AppMode, Gender, Language, ThemePreset, UserProfile } from '@/types';
import {
  Palette,
  Image as ImageIcon,
  Brain,
  Trash2,
  Plus,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

interface SettingsPanelProps {
  uid: string;
  language: Language;
  profile: UserProfile;
  onModeChange: (mode: AppMode) => void;
}

const PRESET_META: {
  id: Exclude<ThemePreset, 'custom'>;
  labelKey: 'themeCleanLight' | 'themeDarkMinimal' | 'themeCyberNeon' | 'themeExecutiveSlate';
}[] = [
  { id: 'clean_light', labelKey: 'themeCleanLight' },
  { id: 'dark_minimal', labelKey: 'themeDarkMinimal' },
  { id: 'cyber_neon', labelKey: 'themeCyberNeon' },
  { id: 'executive_slate', labelKey: 'themeExecutiveSlate' },
];

export default function SettingsPanel({
  uid,
  language,
  profile,
  onModeChange,
}: SettingsPanelProps) {
  const { t } = useTranslation(language);
  const {
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
  } = useSettings({ uid, language, profile, onModeChange });

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* 1. APP MODE (VIEW vs EDIT) */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-base font-bold text-[var(--text)]">{t('setModeTitle')}</h2>
          <div className="flex bg-[var(--panel-2)] border border-[var(--line)] rounded-full p-0.5">
            <button
              type="button"
              onClick={() => onModeChange('view')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                profile.mode === 'view'
                  ? 'bg-[var(--accent)] text-white shadow-xs'
                  : 'text-[var(--text-dim)] hover:text-[var(--text)]'
              }`}
            >
              {t('modeView')}
            </button>
            <button
              type="button"
              onClick={() => onModeChange('edit')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                profile.mode === 'edit'
                  ? 'bg-[var(--accent)] text-white shadow-xs'
                  : 'text-[var(--text-dim)] hover:text-[var(--text)]'
              }`}
            >
              {t('modeEdit')}
            </button>
          </div>
        </div>
        <p className="text-xs text-[var(--text-dim)]">
          {editable ? t('setModeHintEdit') : t('setModeHintView')}
        </p>
      </Card>

      {/* 2. THEME & COLOR SYSTEM (Requirement 2) */}
      <Card className="p-6 space-y-6">
        <div className="flex items-center gap-2 border-b border-[var(--line)] pb-3">
          <Palette size={18} className="text-[var(--accent)]" />
          <h2 className="text-base font-bold text-[var(--text)]">{t('setThemeTitle')}</h2>
        </div>

        {/* Preset Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {PRESET_META.map((preset) => {
            const colors = THEME_PRESET_COLORS[preset.id];
            const active = profile.themeConfig.preset === preset.id;
            return (
              <div
                key={preset.id}
                onClick={() => applyPreset(preset.id)}
                className={`p-3 rounded-2xl border-2 transition-all cursor-pointer ${
                  active
                    ? 'border-[var(--accent)] bg-[var(--panel)] shadow-sm'
                    : 'border-[var(--line)] bg-[var(--panel-2)] hover:border-[var(--accent)]'
                } ${!editable ? 'opacity-50 pointer-events-none' : ''}`}
              >
                <div className="flex gap-1.5 mb-2.5">
                  <div
                    className="w-4 h-4 rounded-full border border-black/10 shadow-2xs"
                    style={{ backgroundColor: colors['--bg'] }}
                  />
                  <div
                    className="w-4 h-4 rounded-full shadow-2xs"
                    style={{ backgroundColor: colors['--accent'] }}
                  />
                  <div
                    className="w-4 h-4 rounded-full shadow-2xs"
                    style={{ backgroundColor: colors['--accent-2'] }}
                  />
                </div>
                <div className="text-xs font-semibold text-[var(--text)]">{t(preset.labelKey)}</div>
              </div>
            );
          })}
        </div>

        {/* Custom Background Color Picker */}
        <div className="pt-2 border-t border-[var(--line)] space-y-2">
          <h3 className="text-xs font-semibold text-[var(--text)] uppercase tracking-wider">
            {t('setBgColor')}
          </h3>
          <p className="text-xs text-[var(--text-dim)]">
            Change the primary background color for the entire application.
          </p>
          <ColorPicker
            value={customBgColor}
            disabled={!editable}
            onChange={handleBackgroundColorChange}
          />
        </div>

        {/* Custom Background Wallpaper Upload */}
        <div className="pt-2 border-t border-[var(--line)] space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-semibold text-[var(--text)] uppercase tracking-wider">
                {t('setBgImage')}
              </h3>
              <p className="text-xs text-[var(--text-dim)] mt-0.5">{t('setBgHint')}</p>
            </div>
            {profile.backgroundType === 'image' && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!editable}
                onClick={handleRemoveBackground}
              >
                {t('setBgRemove')}
              </Button>
            )}
          </div>

          <FileUpload
            disabled={!editable}
            loading={bgUploadLoading}
            error={bgUploadError}
            previewUrl={profile.backgroundType === 'image' ? profile.customBackground : null}
            onFileSelect={handleBackgroundImageUpload}
            helperText="Uploaded wallpapers are saved to Firebase Storage and rendered with adaptive contrast."
          />
        </div>

        {/* AI Theme Generator */}
        <div className="pt-2 border-t border-[var(--line)] space-y-2">
          <label className="block text-xs font-semibold text-[var(--text-dim)]">
            {t('setAiThemeLabel')}
          </label>
          <div className="flex gap-2">
            <Input
              type="text"
              disabled={!editable}
              value={themePrompt}
              onChange={(e) => setThemePrompt(e.target.value)}
              placeholder="e.g. Kyoto autumn matcha tea vibes"
              className="flex-1"
            />
            <Button
              type="button"
              variant="primary"
              disabled={!editable || themeLoading || !themePrompt.trim()}
              loading={themeLoading}
              onClick={handleGenerateTheme}
            >
              {t('themeGenerate')}
            </Button>
          </div>
          {themeStatus && (
            <p className="text-xs text-[var(--text-dim)] italic">{themeStatus}</p>
          )}
        </div>
      </Card>

      {/* 3. AI COMPANION MEMORY & PRIVACY (Requirement 6) */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
          <div className="flex items-center gap-2">
            <Brain size={18} className="text-[var(--accent)]" />
            <div>
              <h2 className="text-base font-bold text-[var(--text)]">{t('memoryTitle')}</h2>
              <p className="text-xs text-[var(--text-dim)] mt-0.5">{t('memorySub')}</p>
            </div>
          </div>

          {memories.length > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClearAllMemories}
              leftIcon={<Trash2 size={13} />}
            >
              {t('memoryClearAll')}
            </Button>
          )}
        </div>

        {/* Add Memory Input */}
        <div className="flex gap-2">
          <Input
            type="text"
            value={newMemoryText}
            onChange={(e) => setNewMemoryText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddMemory()}
            placeholder={t('memoryPlaceholder')}
            className="flex-1"
          />
          <Button
            type="button"
            variant="secondary"
            disabled={!newMemoryText.trim()}
            onClick={handleAddMemory}
            leftIcon={<Plus size={14} />}
          >
            {t('memoryAdd')}
          </Button>
        </div>

        {/* Memories List */}
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {memories.length === 0 ? (
            <div className="p-6 rounded-2xl bg-[var(--panel-2)] text-center text-xs text-[var(--text-dim)]">
              {t('memoryEmpty')}
            </div>
          ) : (
            memories.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between p-3 rounded-2xl border border-[var(--line)] bg-[var(--panel-2)] text-xs text-[var(--text)]"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] flex-shrink-0" />
                  <span className="truncate">{m.content}</span>
                  {m.category && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full border border-[var(--line)] bg-[var(--panel)] text-[var(--text-dim)] flex-shrink-0">
                      {m.category}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteMemory(m.id)}
                  title={t('memoryDelete')}
                  className="p-1 rounded-md text-[var(--text-dim)] hover:text-rose-500 hover:bg-rose-50 transition-colors ml-2 flex-shrink-0"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Privacy Notice */}
        <div className="flex items-start gap-2 p-3 rounded-2xl bg-[var(--panel-2)]/60 text-[11px] text-[var(--text-dim)] border border-[var(--line)]">
          <ShieldCheck size={16} className="text-[var(--accent)] flex-shrink-0 mt-0.5" />
          <span>{t('memoryPrivacyNotice')}</span>
        </div>
      </Card>

      {/* 4. BODY PROFILE SETTINGS */}
      <Card className="p-6 space-y-4">
        <h2 className="text-base font-bold text-[var(--text)] border-b border-[var(--line)] pb-3">
          {t('setProfileTitle')}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label={t('obHeight')}
            type="number"
            disabled={!editable}
            value={heightCm}
            onChange={(e) => setHeightCm(e.target.value)}
          />
          <Input
            label={t('obWeight')}
            type="number"
            disabled={!editable}
            value={weightKg}
            onChange={(e) => setWeightKg(e.target.value)}
          />
          <Input
            label={t('obAge')}
            type="number"
            disabled={!editable}
            value={age}
            onChange={(e) => setAge(e.target.value)}
          />
          <Select
            label={t('obGender')}
            disabled={!editable}
            value={gender}
            onChange={(e) => setGender(e.target.value as Gender)}
          >
            <option value="male">{t('obMale')}</option>
            <option value="female">{t('obFemale')}</option>
            <option value="other">{t('obOther')}</option>
          </Select>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button
            type="button"
            variant="primary"
            disabled={!editable || profileSaving}
            loading={profileSaving}
            onClick={handleProfileSave}
          >
            {t('profileSave')}
          </Button>
          {profileSavedMsg && (
            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
              <CheckCircle2 size={14} />
              <span>{profileSavedMsg}</span>
            </span>
          )}
        </div>
      </Card>

      {/* 5. MASCOT SPRITE UPLOAD */}
      <Card className="p-6 space-y-4">
        <h2 className="text-base font-bold text-[var(--text)] border-b border-[var(--line)] pb-3">
          {t('setMascotTitle')}
        </h2>
        <FileUpload
          disabled={!editable}
          loading={mascotUploading}
          error={mascotError}
          previewUrl={profile.mascotUrl}
          onFileSelect={handleMascotUpload}
          helperText={editable ? t('mascotHint') : t('editModeOnly')}
        />
      </Card>
    </div>
  );
}
