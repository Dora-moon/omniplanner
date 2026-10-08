// src/components/SettingsPanel.tsx
// Comprehensive Settings Panel adhering to Requirements 7a, 7b, 2, and 10:
// - Dashboard Edit Mode Toggle
// - AI Companion Settings (system vs personal Gemini API key)
// - Theme Presets, Custom Background Color & Wallpaper Upload
// - AI Theme Generator
// - Pixel AI Long-Term Memory Privacy Manager
// - Mascot Sprite Upload (strictly separated from Personal Profile)

import React, { useState } from 'react';
import { useTranslation } from '@/i18n/translations';
import { useSettings } from '@/controllers/useSettings';
import { Button, Input, Select, Card, ColorPicker, FileUpload } from '@/ui';
import { THEME_PRESET_COLORS } from '@/types';
import type { AppMode, Language, ThemePreset, UserProfile } from '@/types';
import {
  Palette,
  Image as ImageIcon,
  Brain,
  Trash2,
  Plus,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Sliders,
  Cpu,
  Key,
  Eye,
  EyeOff,
  ExternalLink,
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
    mascotUploading,
    mascotError,
    aiApiSource,
    setAiApiSource,
    aiPersonalApiKey,
    setAiPersonalApiKey,
    aiKeySaving,
    aiKeySavedMsg,
    handleSaveAiSettings,
    memories,
    newMemoryText,
    setNewMemoryText,
    applyPreset,
    handleGenerateTheme,
    handleBackgroundColorChange,
    handleBackgroundImageUpload,
    handleRemoveBackground,
    handleMascotUpload,
    handleAddMemory,
    handleDeleteMemory,
    handleClearAllMemories,
  } = useSettings({ uid, language, profile, onModeChange });

  const [showApiKey, setShowApiKey] = useState(false);

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="pb-3 border-b border-[var(--line)]">
        <h1 className="text-2xl font-serif font-bold text-[var(--text)]">
          {t('tabSettings')}
        </h1>
        <p className="text-xs sm:text-sm text-[var(--text-dim)] mt-0.5">
          {language === 'vi'
            ? 'Tùy chỉnh giao diện, chế độ sửa dashboard và cấu hình AI'
            : 'Customize themes, dashboard edit mode, and AI companion engine'}
        </p>
      </div>

      {/* 1. DASHBOARD EDIT MODE TOGGLE (Requirement 7a) */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sliders size={18} className="text-[var(--accent)]" />
              <h2 className="text-base font-bold text-[var(--text)]">
                {t('dashboardEditModeTitle')}
              </h2>
            </div>
            <p className="text-xs text-[var(--text-dim)] max-w-lg">
              {t('dashboardEditModeDesc')}
            </p>
          </div>

          <div className="flex items-center bg-[var(--panel-2)] border border-[var(--line)] rounded-full p-1 self-start sm:self-center shadow-2xs">
            <button
              type="button"
              onClick={() => onModeChange('view')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                profile.mode === 'view'
                  ? 'bg-[var(--accent)] text-white shadow-xs'
                  : 'text-[var(--text-dim)] hover:text-[var(--text)]'
              }`}
            >
              {t('modeView')} (Locked)
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
              {t('modeEdit')} (Drag & Resize)
            </button>
          </div>
        </div>
      </Card>

      {/* 2. AI COMPANION SETTINGS (Requirement 7b) */}
      <Card className="p-6 space-y-5">
        <div className="flex items-center gap-2 border-b border-[var(--line)] pb-3">
          <Cpu size={18} className="text-[var(--accent)]" />
          <div>
            <h2 className="text-base font-bold text-[var(--text)]">
              {t('setAiSettingsTitle')}
            </h2>
            <p className="text-xs text-[var(--text-dim)] mt-0.5">
              {t('setAiSettingsSub')}
            </p>
          </div>
        </div>

        {/* API Source Radio Selector */}
        <div className="space-y-2.5">
          <label className="block text-xs font-semibold text-[var(--text)]">
            {t('setAiSource')}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div
              onClick={() => {
                setAiApiSource('system');
                handleSaveAiSettings('system', aiPersonalApiKey);
              }}
              className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                aiApiSource === 'system'
                  ? 'border-[var(--accent)] bg-[var(--accent)]/10 shadow-xs'
                  : 'border-[var(--line)] bg-[var(--panel-2)] hover:border-[var(--accent)]'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-[var(--text)]">
                  {t('setAiSourceSystem')}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold">
                  Recommended
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-dim)] leading-tight">
                {language === 'vi'
                  ? 'Sử dụng quota và key được cung cấp sẵn từ hệ thống OmniPlanner.'
                  : 'Uses pre-configured server environment Gemini keys with zero setup.'}
              </p>
            </div>

            <div
              onClick={() => {
                setAiApiSource('personal');
                handleSaveAiSettings('personal', aiPersonalApiKey);
              }}
              className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                aiApiSource === 'personal'
                  ? 'border-[var(--accent)] bg-[var(--accent)]/10 shadow-xs'
                  : 'border-[var(--line)] bg-[var(--panel-2)] hover:border-[var(--accent)]'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-[var(--text)]">
                  {t('setAiSourcePersonal')}
                </span>
                <Key size={14} className="text-[var(--accent)]" />
              </div>
              <p className="text-[11px] text-[var(--text-dim)] leading-tight">
                {language === 'vi'
                  ? 'Sử dụng API key cá nhân của bạn để có giới hạn lượt gọi cao hơn.'
                  : 'Bring your own Google AI Studio API key for dedicated rate limits.'}
              </p>
            </div>
          </div>
        </div>

        {/* Personal API Key Input (visible when personal is selected) */}
        {aiApiSource === 'personal' && (
          <div className="p-4 rounded-2xl border border-[var(--line)] bg-[var(--panel-2)] space-y-3 transition-all animate-fadeIn">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-[var(--text)]">
                {t('setAiPersonalKey')}
              </label>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-semibold text-[var(--accent)] hover:underline flex items-center gap-1"
              >
                <span>Google AI Studio</span>
                <ExternalLink size={11} />
              </a>
            </div>

            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={aiPersonalApiKey}
                onChange={(e) => setAiPersonalApiKey(e.target.value)}
                placeholder={t('setAiPersonalKeyPlaceholder')}
                className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-[var(--panel)] border border-[var(--line)] text-xs text-[var(--text)] placeholder:text-[var(--text-dim)] focus:outline-none focus:border-[var(--accent)] font-mono"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-dim)] hover:text-[var(--text)]"
              >
                {showApiKey ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            <p className="text-[11px] text-[var(--text-dim)] leading-relaxed">
              {t('setAiKeyHint')}
            </p>

            <div className="flex items-center gap-3 pt-1">
              <Button
                type="button"
                variant="primary"
                size="sm"
                loading={aiKeySaving}
                disabled={aiKeySaving}
                onClick={() => handleSaveAiSettings('personal', aiPersonalApiKey)}
              >
                {language === 'vi' ? 'Lưu API Key' : 'Save API Key'}
              </Button>
              {aiKeySavedMsg && (
                <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle2 size={14} />
                  <span>{aiKeySavedMsg}</span>
                </span>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* 3. THEME & COLOR SYSTEM (Requirement 2 & 10) */}
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
                }`}
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
            {language === 'vi'
              ? 'Tùy chỉnh mã màu nền chung cho toàn bộ ứng dụng.'
              : 'Change the primary background color for the entire application.'}
          </p>
          <ColorPicker
            value={customBgColor}
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
                onClick={handleRemoveBackground}
              >
                {t('setBgRemove')}
              </Button>
            )}
          </div>

          <FileUpload
            loading={bgUploadLoading}
            error={bgUploadError}
            previewUrl={profile.backgroundType === 'image' ? profile.customBackground : null}
            onFileSelect={handleBackgroundImageUpload}
            helperText="Uploaded wallpapers are compressed and saved as data URLs on your profile, then rendered with adaptive contrast."
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
              value={themePrompt}
              onChange={(e) => setThemePrompt(e.target.value)}
              placeholder="e.g. Kyoto autumn matcha tea vibes"
              className="flex-1"
            />
            <Button
              type="button"
              variant="primary"
              disabled={themeLoading || !themePrompt.trim()}
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

      {/* 4. AI COMPANION MEMORY & PRIVACY (Requirement 6) */}
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

      {/* 5. MASCOT SPRITE UPLOAD */}
      <Card className="p-6 space-y-4">
        <h2 className="text-base font-bold text-[var(--text)] border-b border-[var(--line)] pb-3">
          {t('setMascotTitle')}
        </h2>
        <FileUpload
          loading={mascotUploading}
          error={mascotError}
          previewUrl={profile.mascotUrl}
          onFileSelect={handleMascotUpload}
          helperText={t('mascotHint')}
        />
      </Card>
    </div>
  );
}
