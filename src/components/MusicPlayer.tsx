// src/components/MusicPlayer.tsx
// Full Sounds page ("Omni Sound Lounge") adhering to Requirement 5:
// - Interactive seek scrubber with smooth dragging and real time formatting.
// - Play/pause, next/prev, shuffle, repeat, and volume controls.
// - Custom YouTube / SoundCloud URL streamer.
// - Persists playback globally across all page views.
// - Uses Omni design tokens and standardized UI components.

import React, { useState } from 'react';
import { useTranslation } from '@/i18n/translations';
import { useMusic } from '@/context/MusicContext';
import { Button, Input, Card } from '@/ui';
import type { Language } from '@/types';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Volume2,
  VolumeX,
  Heart,
  Plus,
  Radio,
  Music2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

interface MusicPlayerProps {
  language: Language;
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function MusicPlayer({ language }: MusicPlayerProps) {
  const { t } = useTranslation(language);
  const {
    playlist,
    currentTrackIndex,
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isLiked,
    isShuffle,
    isLoop,
    isLoading,
    togglePlay,
    playTrack,
    nextTrack,
    prevTrack,
    seekTo,
    setVolume,
    toggleMute,
    toggleLike,
    toggleShuffle,
    toggleLoop,
    addCustomTrack,
  } = useMusic();

  const [customUrl, setCustomUrl] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Scrubber drag state to prevent stutter during interval polling
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubberValue, setScrubberValue] = useState(0);

  const displayTime = isScrubbing ? scrubberValue : currentTime;
  const progressPercent = duration > 0 ? Math.min(100, (displayTime / duration) * 100) : 0;

  function handleAddTrack(e: React.FormEvent) {
    e.preventDefault();
    if (!customUrl.trim()) return;

    const res = addCustomTrack(customUrl, customTitle.trim() || undefined);
    if (res.success) {
      setFeedback({ type: 'success', message: t('musicCustomAdded') });
      setCustomUrl('');
      setCustomTitle('');
      setTimeout(() => setFeedback(null), 4000);
    } else {
      setFeedback({ type: 'error', message: res.message || t('musicInvalidUrl') });
      setTimeout(() => setFeedback(null), 5000);
    }
  }

  function handleScrubberChange(e: React.ChangeEvent<HTMLInputElement>) {
    setScrubberValue(Number(e.target.value));
  }

  function handleScrubberMouseDown() {
    setIsScrubbing(true);
    setScrubberValue(currentTime);
  }

  function handleScrubberMouseUp(e: React.MouseEvent<HTMLInputElement> | React.TouchEvent<HTMLInputElement>) {
    setIsScrubbing(false);
    const target = e.currentTarget as HTMLInputElement;
    seekTo(Number(target.value));
  }

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[var(--line)]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-[var(--panel-2)] border border-[var(--line)] text-[var(--accent)]">
              <Music2 size={18} />
            </span>
            <h1 className="text-2xl font-serif font-bold text-[var(--text)]">
              {t('musicTitle')}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[var(--text-dim)]">{t('musicSub')}</p>
        </div>

        {/* Live badge */}
        <div className="flex items-center gap-2 self-start sm:self-center px-3.5 py-1.5 rounded-full bg-[var(--panel)] border border-[var(--line)] shadow-2xs">
          <span className="relative flex h-2.5 w-2.5">
            {isPlaying && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            )}
            <span
              className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                isPlaying ? 'bg-emerald-500' : 'bg-[var(--text-dim)]'
              }`}
            />
          </span>
          <span className="text-xs font-semibold text-[var(--text)]">
            {isPlaying
              ? currentTrack.isLive
                ? `${t('musicLiveStream')} · ${currentTrack.artist}`
                : `${t('musicNowPlaying')} · ${currentTrack.artist}`
              : t('musicPause')}
          </span>
        </div>
      </div>

      {/* Main Grid: Player Studio Left (7 cols), Presets Playlist Right (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: HERO MUSIC PLAYER (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="p-6 sm:p-8">
            {/* Visual Cover / Landscape Banner */}
            <div className="relative w-full aspect-video sm:aspect-2/1 rounded-2xl overflow-hidden bg-gradient-to-t from-[#261E38] via-[#5C3B53] to-[#DF8C68] shadow-inner mb-6 flex flex-col justify-between p-4 sm:p-5 select-none">
              {currentTrack.coverUrl && (
                <img
                  src={currentTrack.coverUrl}
                  alt={currentTrack.title}
                  className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay"
                />
              )}

              {/* Lo-fi artwork SVG backdrop */}
              <svg
                viewBox="0 0 400 160"
                className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-40"
              >
                <circle cx="200" cy="110" r="45" fill="#FFA366" opacity="0.8" />
                <rect x="0" y="0" width="400" height="160" fill="none" stroke="#221A30" strokeWidth="4" />
                <line x1="200" y1="0" x2="200" y2="160" stroke="#221A30" strokeWidth="4" />
                <line x1="0" y1="80" x2="400" y2="80" stroke="#221A30" strokeWidth="3" />
              </svg>

              {/* Top badges */}
              <div className="relative z-10 flex items-center justify-between">
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/50 backdrop-blur-md text-white text-[11px] font-semibold tracking-wide border border-white/10">
                  <Radio size={12} className={isPlaying ? 'text-emerald-400 animate-pulse' : 'text-gray-300'} />
                  {currentTrack.type === 'youtube' ? 'YouTube IFrame' : 'SoundCloud Widget'}
                </span>

                {currentTrack.isLive && (
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-500/90 text-white text-[10px] font-bold uppercase tracking-wider shadow-xs">
                    {t('musicLiveStream')}
                  </span>
                )}
              </div>

              {/* Bottom animated audio visualizer bars */}
              <div className="relative z-10 flex items-end justify-end gap-1 h-8">
                {Array.from({ length: 14 }).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      height: isPlaying
                        ? `${15 + Math.sin(i * 1.2 + (currentTime % 10)) * 50 + ((i % 4) * 8)}%`
                        : '4px',
                      transition: 'height 0.25s ease',
                    }}
                    className={`w-1.5 rounded-full ${
                      isPlaying ? 'bg-amber-300/90 shadow-[0_0_8px_rgba(252,211,77,0.6)]' : 'bg-white/30'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Title, Artist & Like */}
            <div className="flex items-start justify-between gap-4 mb-5">
              <div className="min-w-0 flex-1">
                <h2 className="text-xl sm:text-2xl font-serif font-bold text-[var(--text)] leading-snug truncate">
                  {currentTrack.title}
                </h2>
                <p className="text-sm font-medium text-[var(--text-dim)] mt-1 flex items-center gap-2">
                  <span>{currentTrack.artist}</span>
                  <span className="text-[var(--line)]">·</span>
                  <span className="text-[11px] uppercase tracking-wider font-semibold">
                    {currentTrack.type}
                  </span>
                </p>
              </div>

              <button
                type="button"
                onClick={toggleLike}
                title="Like Track"
                className={`p-2.5 rounded-full border transition-all ${
                  isLiked
                    ? 'bg-rose-50 border-rose-200 text-rose-500 shadow-2xs'
                    : 'bg-[var(--panel-2)] border-[var(--line)] text-[var(--text-dim)] hover:text-rose-500'
                }`}
              >
                <Heart size={20} fill={isLiked ? 'currentColor' : 'none'} />
              </button>
            </div>

            {/* Interactive Progress Bar & Scrubber */}
            <div className="space-y-1.5 mb-6">
              <div className="relative flex items-center">
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  value={displayTime}
                  disabled={currentTrack.isLive}
                  onMouseDown={handleScrubberMouseDown}
                  onTouchStart={handleScrubberMouseDown}
                  onChange={handleScrubberChange}
                  onMouseUp={handleScrubberMouseUp}
                  onTouchEnd={handleScrubberMouseUp}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer bg-[var(--line)] accent-[var(--accent)] outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              <div className="flex items-center justify-between text-xs font-mono text-[var(--text-dim)]">
                <span>{currentTrack.isLive ? '00:00' : formatTime(displayTime)}</span>
                <span className="text-[11px]">
                  {currentTrack.isLive ? (
                    <span className="text-rose-600 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                      LIVE FEED
                    </span>
                  ) : (
                    formatTime(duration)
                  )}
                </span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-5 pt-3 border-t border-[var(--line)]">
              {/* Shuffle & Loop */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleShuffle}
                  title={t('musicShuffle')}
                  className={`p-2 rounded-xl transition-colors ${
                    isShuffle
                      ? 'bg-[var(--accent)]/15 text-[var(--accent)] font-bold'
                      : 'text-[var(--text-dim)] hover:text-[var(--text)]'
                  }`}
                >
                  <Shuffle size={18} />
                </button>
                <button
                  type="button"
                  onClick={toggleLoop}
                  title={t('musicRepeat')}
                  className={`p-2 rounded-xl transition-colors ${
                    isLoop
                      ? 'bg-[var(--accent)]/15 text-[var(--accent)] font-bold'
                      : 'text-[var(--text-dim)] hover:text-[var(--text)]'
                  }`}
                >
                  <Repeat size={18} />
                </button>
              </div>

              {/* Prev, Play/Pause, Next */}
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={prevTrack}
                  title={t('musicPrev')}
                  className="p-2.5 rounded-full text-[var(--text-dim)] hover:text-[var(--text)] hover:bg-[var(--panel-2)] transition-all active:scale-95"
                >
                  <SkipBack size={22} />
                </button>

                <button
                  type="button"
                  onClick={togglePlay}
                  title={isPlaying ? t('musicPause') : t('musicPlay')}
                  className="w-14 h-14 rounded-full bg-[var(--accent)] hover:brightness-105 text-white flex items-center justify-center shadow-md transition-all active:scale-95 relative"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : isPlaying ? (
                    <Pause size={22} className="fill-white" />
                  ) : (
                    <Play size={22} className="fill-white translate-x-[2px]" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={nextTrack}
                  title={t('musicNext')}
                  className="p-2.5 rounded-full text-[var(--text-dim)] hover:text-[var(--text)] hover:bg-[var(--panel-2)] transition-all active:scale-95"
                >
                  <SkipForward size={22} />
                </button>
              </div>

              {/* Volume Slider */}
              <div className="flex items-center gap-2.5 w-full sm:w-36">
                <button
                  type="button"
                  onClick={toggleMute}
                  className="text-[var(--text-dim)] hover:text-[var(--text)] transition-colors p-1"
                >
                  {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={isMuted ? 0 : volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-[var(--line)] accent-[var(--accent)] outline-none"
                />
                <span className="text-[11px] font-mono text-[var(--text-dim)] w-6 text-right">
                  {isMuted ? 0 : volume}%
                </span>
              </div>
            </div>
          </Card>

          {/* Add Custom Stream Box */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm">🔗</span>
              <h3 className="font-bold text-sm text-[var(--text)] font-sans">
                {t('musicAddCustom')}
              </h3>
            </div>
            <p className="text-xs text-[var(--text-dim)] mb-4">
              {language === 'vi'
                ? 'Dán đường dẫn YouTube hoặc SoundCloud bất kỳ để phát nhạc trực tiếp.'
                : 'Paste any public YouTube or SoundCloud track URL to play inside Omni.'}
            </p>

            <form onSubmit={handleAddTrack} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                <div className="sm:col-span-8">
                  <Input
                    type="url"
                    required
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    placeholder={t('musicAddPlaceholder')}
                  />
                </div>
                <div className="sm:col-span-4">
                  <Input
                    type="text"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="Custom Title (optional)"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2 text-[11px] text-[var(--text-dim)]">
                  <span className="px-1.5 py-0.5 rounded bg-[var(--panel-2)] border border-[var(--line)]">
                    YouTube
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-[var(--panel-2)] border border-[var(--line)]">
                    SoundCloud
                  </span>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  leftIcon={<Plus size={14} />}
                >
                  {t('musicAddBtn')}
                </Button>
              </div>

              {feedback && (
                <div
                  className={`mt-2 flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium ${
                    feedback.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {feedback.type === 'success' ? (
                    <CheckCircle2 size={15} className="text-emerald-600 flex-shrink-0" />
                  ) : (
                    <AlertCircle size={15} className="text-rose-600 flex-shrink-0" />
                  )}
                  <span>{feedback.message}</span>
                </div>
              )}
            </form>
          </Card>
        </div>

        {/* RIGHT COLUMN: CURATED SOUNDSCAPES / PLAYLIST (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-serif font-bold text-base text-[var(--text)]">
                  {t('musicPresets')}
                </h3>
                <p className="text-[11px] text-[var(--text-dim)] mt-0.5">
                  {playlist.length}{' '}
                  {language === 'vi' ? 'luồng âm thanh tuyển chọn' : 'curated focus streams'}
                </p>
              </div>
              <Sparkles size={16} className="text-amber-500" />
            </div>

            {/* Tracks List */}
            <div className="space-y-2.5 max-h-[560px] overflow-y-auto pr-1">
              {playlist.map((track, idx) => {
                const isCurrent = idx === currentTrackIndex;
                return (
                  <div
                    key={track.id}
                    onClick={() => playTrack(idx)}
                    className={`group relative flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-[var(--accent)]/10 border-[var(--accent)] shadow-xs'
                        : 'bg-[var(--panel-2)] border-[var(--line)] hover:border-[var(--accent)]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* Thumbnail with overlay icon */}
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-[#2D243E] flex-shrink-0 shadow-2xs">
                        {track.coverUrl ? (
                          <img
                            src={track.coverUrl}
                            alt={track.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white/50">
                            <Music2 size={16} />
                          </div>
                        )}

                        <div
                          className={`absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity ${
                            isCurrent && isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                          }`}
                        >
                          {isCurrent && isPlaying ? (
                            <div className="flex items-end gap-0.5 h-3.5">
                              <span className="w-1 bg-white rounded-full animate-bounce" />
                              <span className="w-1 bg-white rounded-full animate-bounce [animation-delay:0.2s]" />
                              <span className="w-1 bg-white rounded-full animate-bounce [animation-delay:0.4s]" />
                            </div>
                          ) : (
                            <Play size={16} className="fill-white text-white ml-0.5" />
                          )}
                        </div>
                      </div>

                      {/* Details */}
                      <div className="min-w-0 flex-1">
                        <h4
                          className={`text-xs font-bold leading-snug truncate ${
                            isCurrent ? 'text-[var(--accent)]' : 'text-[var(--text)]'
                          }`}
                        >
                          {track.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[11px] text-[var(--text-dim)] truncate">
                            {track.artist}
                          </span>
                          <span
                            className={`text-[9.5px] font-semibold uppercase px-1.5 py-0.2 rounded-full border ${
                              track.type === 'youtube'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            {track.type === 'youtube' ? 'YouTube' : 'SoundCloud'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="ml-2 flex-shrink-0 text-right">
                      {track.isLive ? (
                        <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                          LIVE
                        </span>
                      ) : (
                        <span className="text-[11px] font-mono text-[var(--text-dim)]">
                          {track.duration ? formatTime(track.duration) : '--:--'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
