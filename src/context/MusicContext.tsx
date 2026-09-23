'use client';

// src/context/MusicContext.tsx
// Global Music Player Provider supporting YouTube IFrame API & SoundCloud Widget API.
// Keeps audio playback running continuously across tab navigation in the Omni App.

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { PRESET_TRACKS, type MusicTrack } from '@/types/music';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady?: () => void;
    SC: any;
  }
}

export function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }
  const regExp = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|live\/))([a-zA-Z0-9_-]{11})/i;
  const match = trimmed.match(regExp);
  return match ? match[1] : null;
}

export function isSoundCloudUrl(url: string): boolean {
  if (!url) return false;
  return /soundcloud\.com\/.+/i.test(url.trim());
}

interface MusicContextType {
  playlist: MusicTrack[];
  currentTrackIndex: number;
  currentTrack: MusicTrack;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isLiked: boolean;
  isShuffle: boolean;
  isLoop: boolean;
  isLoading: boolean;
  togglePlay: () => void;
  playTrack: (index: number) => void;
  nextTrack: () => void;
  prevTrack: () => void;
  seekTo: (seconds: number) => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
  toggleLike: () => void;
  toggleShuffle: () => void;
  toggleLoop: () => void;
  addCustomTrack: (url: string, title?: string) => { success: boolean; message?: string };
}

const MusicContext = createContext<MusicContextType | null>(null);

export function MusicProvider({ children }: { children: React.ReactNode }) {
  const [playlist, setPlaylist] = useState<MusicTrack[]>(PRESET_TRACKS);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolumeState] = useState<number>(80);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [isLoop, setIsLoop] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const currentTrack = playlist[currentTrackIndex] || playlist[0];

  // Player references
  const ytPlayerRef = useRef<any>(null);
  const scWidgetRef = useRef<any>(null);
  const isYtReadyRef = useRef<boolean>(false);
  const isScReadyRef = useRef<boolean>(false);
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isPlayingRef = useRef<boolean>(isPlaying);
  isPlayingRef.current = isPlaying;

  const currentTrackRef = useRef<MusicTrack>(currentTrack);
  currentTrackRef.current = currentTrack;

  const playlistRef = useRef<MusicTrack[]>(playlist);
  playlistRef.current = playlist;

  const isLoopRef = useRef<boolean>(isLoop);
  isLoopRef.current = isLoop;

  const isShuffleRef = useRef<boolean>(isShuffle);
  isShuffleRef.current = isShuffle;

  // 1. Load YouTube IFrame API script
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      tag.async = true;
      document.body.appendChild(tag);
    }

    const initYt = () => {
      if (window.YT && window.YT.Player && !ytPlayerRef.current) {
        try {
          const defaultYtId = currentTrackRef.current?.type === 'youtube'
            ? (currentTrackRef.current.videoId || 'jfKfPfyJRdk')
            : 'jfKfPfyJRdk';

          ytPlayerRef.current = new window.YT.Player('omni-yt-player-frame', {
            height: '200',
            width: '200',
            videoId: defaultYtId,
            playerVars: {
              autoplay: 0,
              controls: 0,
              disablekb: 1,
              fs: 0,
              modestbranding: 1,
              rel: 0,
            },
            events: {
              onReady: () => {
                isYtReadyRef.current = true;
                if (ytPlayerRef.current?.setVolume) {
                  ytPlayerRef.current.setVolume(80);
                }
              },
              onStateChange: (event: any) => {
                // YT.PlayerState: PLAYING = 1, PAUSED = 2, ENDED = 0, BUFFERING = 3
                if (event.data === 1) {
                  setIsPlaying(true);
                  setIsLoading(false);
                } else if (event.data === 2) {
                  setIsPlaying(false);
                  setIsLoading(false);
                } else if (event.data === 3) {
                  setIsLoading(true);
                } else if (event.data === 0) {
                  // Ended
                  if (isLoopRef.current) {
                    ytPlayerRef.current.seekTo(0);
                    ytPlayerRef.current.playVideo();
                  } else {
                    handleTrackEnded();
                  }
                }
              },
              onError: (err: any) => {
                console.warn('YouTube Player error:', err);
                setIsLoading(false);
                setIsPlaying(false);
              },
            },
          });
        } catch (e) {
          console.error('Failed to instantiate YouTube player', e);
        }
      }
    };

    if (window.YT && window.YT.Player) {
      initYt();
    } else {
      window.onYouTubeIframeAPIReady = initYt;
    }

    return () => {
      // Don't destroy player to keep persistent audio
    };
  }, []);

  // 2. Load SoundCloud Widget API script
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initSCWidget = () => {
      const scIframe = document.getElementById('omni-sc-player-frame') as HTMLIFrameElement;
      if (scIframe && window.SC && window.SC.Widget && !scWidgetRef.current) {
        try {
          const widget = window.SC.Widget(scIframe);
          scWidgetRef.current = widget;

          widget.bind(window.SC.Widget.Events.READY, () => {
            isScReadyRef.current = true;
            widget.setVolume(80);
          });

          widget.bind(window.SC.Widget.Events.PLAY, () => {
            setIsPlaying(true);
            setIsLoading(false);
          });

          widget.bind(window.SC.Widget.Events.PAUSE, () => {
            setIsPlaying(false);
            setIsLoading(false);
          });

          widget.bind(window.SC.Widget.Events.FINISH, () => {
            if (isLoopRef.current) {
              widget.seekTo(0);
              widget.play();
            } else {
              handleTrackEnded();
            }
          });

          widget.bind(window.SC.Widget.Events.PLAY_PROGRESS, (data: { currentPosition: number; relativePosition: number }) => {
            if (currentTrackRef.current?.type === 'soundcloud') {
              setCurrentTime(Math.floor(data.currentPosition / 1000));
            }
          });
        } catch (e) {
          console.error('SoundCloud widget init error', e);
        }
      }
    };

    if (!window.SC) {
      const tag = document.createElement('script');
      tag.src = 'https://w.soundcloud.com/player/api.js';
      tag.async = true;
      tag.onload = initSCWidget;
      document.body.appendChild(tag);
    } else {
      initSCWidget();
    }
  }, []);

  // 3. YouTube Polling timer for real-time progress
  useEffect(() => {
    if (isPlaying && currentTrack.type === 'youtube') {
      pollingIntervalRef.current = setInterval(() => {
        if (ytPlayerRef.current && isYtReadyRef.current) {
          try {
            const cur = ytPlayerRef.current.getCurrentTime?.() || 0;
            const dur = ytPlayerRef.current.getDuration?.() || 0;
            setCurrentTime(Math.floor(cur));
            if (dur > 0) setDuration(Math.floor(dur));
          } catch {
            /* ignore polling error */
          }
        }
      }, 500);
    } else {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    }
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [isPlaying, currentTrack.type]);

  const handleTrackEnded = useCallback(() => {
    if (isShuffleRef.current) {
      const nextIdx = Math.floor(Math.random() * playlistRef.current.length);
      playTrackByIndex(nextIdx, true);
    } else {
      setCurrentTrackIndex((prev) => {
        const next = (prev + 1) % playlistRef.current.length;
        playTrackByIndex(next, true);
        return next;
      });
    }
  }, []);

  // Function to switch and play a track
  const playTrackByIndex = useCallback((index: number, autoStart = true) => {
    const track = playlistRef.current[index];
    if (!track) return;

    setCurrentTrackIndex(index);
    setCurrentTime(0);
    setDuration(track.duration || 0);

    if (track.type === 'youtube') {
      // Pause SoundCloud
      if (scWidgetRef.current && isScReadyRef.current) {
        try { scWidgetRef.current.pause(); } catch {}
      }

      const videoId = track.videoId || extractYouTubeId(track.url);
      if (videoId && ytPlayerRef.current && isYtReadyRef.current) {
        setIsLoading(true);
        try {
          if (autoStart) {
            ytPlayerRef.current.loadVideoById(videoId);
            setIsPlaying(true);
          } else {
            ytPlayerRef.current.cueVideoById(videoId);
          }
        } catch (e) {
          console.warn('Error loading YouTube video', e);
          setIsLoading(false);
        }
      }
    } else if (track.type === 'soundcloud') {
      // Pause YouTube
      if (ytPlayerRef.current && isYtReadyRef.current) {
        try { ytPlayerRef.current.pauseVideo(); } catch {}
      }

      if (scWidgetRef.current && isScReadyRef.current) {
        setIsLoading(true);
        try {
          scWidgetRef.current.load(track.url, {
            auto_play: autoStart,
            callback: () => {
              scWidgetRef.current.getDuration((d: number) => {
                if (d > 0) setDuration(Math.floor(d / 1000));
              });
              scWidgetRef.current.getCurrentSound((sound: any) => {
                if (sound && sound.title && track.title.startsWith('SoundCloud')) {
                  // update title dynamically
                  setPlaylist((prev) =>
                    prev.map((t, idx) =>
                      idx === index ? { ...t, title: sound.title, artist: sound.user?.username || t.artist } : t
                    )
                  );
                }
              });
              setIsLoading(false);
              if (autoStart) setIsPlaying(true);
            },
          });
        } catch (e) {
          console.warn('Error loading SoundCloud track', e);
          setIsLoading(false);
        }
      }
    }
  }, []);

  const togglePlay = useCallback(() => {
    const track = currentTrackRef.current;
    if (!track) return;

    if (isPlayingRef.current) {
      // PAUSE
      if (track.type === 'youtube' && ytPlayerRef.current && isYtReadyRef.current) {
        ytPlayerRef.current.pauseVideo();
      } else if (track.type === 'soundcloud' && scWidgetRef.current && isScReadyRef.current) {
        scWidgetRef.current.pause();
      }
      setIsPlaying(false);
    } else {
      // PLAY
      if (track.type === 'youtube') {
        if (scWidgetRef.current && isScReadyRef.current) {
          try { scWidgetRef.current.pause(); } catch {}
        }
        if (ytPlayerRef.current && isYtReadyRef.current) {
          ytPlayerRef.current.playVideo();
          setIsPlaying(true);
        } else {
          // If not initialized yet, re-attempt
          playTrackByIndex(currentTrackIndex, true);
        }
      } else if (track.type === 'soundcloud') {
        if (ytPlayerRef.current && isYtReadyRef.current) {
          try { ytPlayerRef.current.pauseVideo(); } catch {}
        }
        if (scWidgetRef.current && isScReadyRef.current) {
          scWidgetRef.current.play();
          setIsPlaying(true);
        } else {
          playTrackByIndex(currentTrackIndex, true);
        }
      }
    }
  }, [currentTrackIndex, playTrackByIndex]);

  const nextTrack = useCallback(() => {
    if (isShuffleRef.current) {
      const nextIdx = Math.floor(Math.random() * playlist.length);
      playTrackByIndex(nextIdx, true);
    } else {
      const nextIdx = (currentTrackIndex + 1) % playlist.length;
      playTrackByIndex(nextIdx, true);
    }
  }, [currentTrackIndex, playlist.length, playTrackByIndex]);

  const prevTrack = useCallback(() => {
    const prevIdx = (currentTrackIndex - 1 + playlist.length) % playlist.length;
    playTrackByIndex(prevIdx, true);
  }, [currentTrackIndex, playlist.length, playTrackByIndex]);

  const seekTo = useCallback((seconds: number) => {
    const track = currentTrackRef.current;
    setCurrentTime(seconds);
    if (track.type === 'youtube' && ytPlayerRef.current && isYtReadyRef.current) {
      try {
        ytPlayerRef.current.seekTo(seconds, true);
      } catch {}
    } else if (track.type === 'soundcloud' && scWidgetRef.current && isScReadyRef.current) {
      try {
        scWidgetRef.current.seekTo(seconds * 1000);
      } catch {}
    }
  }, []);

  const handleSetVolume = useCallback((vol: number) => {
    const clamped = Math.max(0, Math.min(100, vol));
    setVolumeState(clamped);
    setIsMuted(clamped === 0);

    if (ytPlayerRef.current && isYtReadyRef.current) {
      try { ytPlayerRef.current.setVolume(clamped); } catch {}
    }
    if (scWidgetRef.current && isScReadyRef.current) {
      try { scWidgetRef.current.setVolume(clamped); } catch {}
    }
  }, []);

  const toggleMute = useCallback(() => {
    if (isMuted) {
      setIsMuted(false);
      handleSetVolume(volume || 80);
    } else {
      setIsMuted(true);
      if (ytPlayerRef.current && isYtReadyRef.current) {
        try { ytPlayerRef.current.setVolume(0); } catch {}
      }
      if (scWidgetRef.current && isScReadyRef.current) {
        try { scWidgetRef.current.setVolume(0); } catch {}
      }
    }
  }, [isMuted, volume, handleSetVolume]);

  const toggleLike = useCallback(() => {
    setIsLiked((prev) => !prev);
  }, []);

  const toggleShuffle = useCallback(() => {
    setIsShuffle((prev) => !prev);
  }, []);

  const toggleLoop = useCallback(() => {
    setIsLoop((prev) => !prev);
  }, []);

  const addCustomTrack = useCallback((url: string, customTitle?: string): { success: boolean; message?: string } => {
    const ytId = extractYouTubeId(url);
    if (ytId) {
      const newTrack: MusicTrack = {
        id: `yt-custom-${Date.now()}`,
        title: customTitle || `YouTube Stream (${ytId})`,
        artist: 'YouTube Live / Stream',
        type: 'youtube',
        url: url.trim(),
        videoId: ytId,
        coverUrl: `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`,
        duration: 0,
        isLive: true,
      };
      setPlaylist((prev) => [newTrack, ...prev]);
      setCurrentTrackIndex(0);
      setTimeout(() => playTrackByIndex(0, true), 100);
      return { success: true };
    }

    if (isSoundCloudUrl(url)) {
      const newTrack: MusicTrack = {
        id: `sc-custom-${Date.now()}`,
        title: customTitle || 'SoundCloud Stream',
        artist: 'SoundCloud Artist',
        type: 'soundcloud',
        url: url.trim(),
        coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
        duration: 180,
        isLive: false,
      };
      setPlaylist((prev) => [newTrack, ...prev]);
      setCurrentTrackIndex(0);
      setTimeout(() => playTrackByIndex(0, true), 100);
      return { success: true };
    }

    return {
      success: false,
      message: 'Invalid URL. Please enter a valid YouTube or SoundCloud URL.',
    };
  }, [playTrackByIndex]);

  return (
    <MusicContext.Provider
      value={{
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
        playTrack: (idx) => playTrackByIndex(idx, true),
        nextTrack,
        prevTrack,
        seekTo,
        setVolume: handleSetVolume,
        toggleMute,
        toggleLike,
        toggleShuffle,
        toggleLoop,
        addCustomTrack,
      }}
    >
      {children}

      {/* Hidden Persistent Audio Player Container */}
      <div
        id="omni-audio-host"
        aria-hidden="true"
        style={{
          position: 'fixed',
          bottom: -9999,
          right: -9999,
          width: 200,
          height: 200,
          opacity: 0.001,
          pointerEvents: 'none',
          zIndex: -999,
          overflow: 'hidden',
        }}
      >
        {/* YouTube Target Element */}
        <div id="omni-yt-player-frame" />

        {/* SoundCloud Target Iframe */}
        <iframe
          id="omni-sc-player-frame"
          src="https://w.soundcloud.com/player/?url=https%3A//soundcloud.com/kupla/twilight&auto_play=false&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false&visual=false"
          allow="autoplay"
          title="SoundCloud Host"
          style={{ width: 200, height: 200 }}
        />
      </div>
    </MusicContext.Provider>
  );
}

export function useMusic() {
  const context = useContext(MusicContext);
  if (!context) {
    throw new Error('useMusic must be used within a MusicProvider');
  }
  return context;
}
