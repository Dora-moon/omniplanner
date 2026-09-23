// src/types/music.ts

export type MusicPlatform = 'youtube' | 'soundcloud';

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  type: MusicPlatform;
  url: string;
  videoId?: string;
  coverUrl?: string;
  duration?: number; // In seconds
  isLive?: boolean;
}

export const PRESET_TRACKS: MusicTrack[] = [
  {
    id: 'yt-lofi-girl',
    title: 'Lofi Hip Hop Radio - Beats to Relax/Study to',
    artist: 'Lofi Girl',
    type: 'youtube',
    url: 'https://www.youtube.com/watch?v=jfKfPfyJRdk',
    videoId: 'jfKfPfyJRdk',
    coverUrl: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=600&auto=format&fit=crop&q=80',
    duration: 0,
    isLive: true,
  },
  {
    id: 'yt-chillhop',
    title: 'Chillhop Radio - Jazzy & Lofi Hip Hop Beats',
    artist: 'Chillhop Music',
    type: 'youtube',
    url: 'https://www.youtube.com/watch?v=5yx6BWlEVcY',
    videoId: '5yx6BWlEVcY',
    coverUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80',
    duration: 0,
    isLive: true,
  },
  {
    id: 'yt-coffee-shop',
    title: 'Warm Coffee Shop - Cozy Rainy Day Lofi',
    artist: 'Coffee Vibes Hub',
    type: 'youtube',
    url: 'https://www.youtube.com/watch?v=lTRiuFIWV54',
    videoId: 'lTRiuFIWV54',
    coverUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&auto=format&fit=crop&q=80',
    duration: 0,
    isLive: true,
  },
  {
    id: 'yt-synthwave',
    title: 'Synthwave Radio - Chill Synth / Retro Beats',
    artist: 'Lofi Girl Synth',
    type: 'youtube',
    url: 'https://www.youtube.com/watch?v=4xDzrJKXOOY',
    videoId: '4xDzrJKXOOY',
    coverUrl: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=600&auto=format&fit=crop&q=80',
    duration: 0,
    isLive: true,
  },
  {
    id: 'sc-twilight',
    title: 'Twilight (Lo-Fi Study Mix)',
    artist: 'Kupla',
    type: 'soundcloud',
    url: 'https://soundcloud.com/kupla/twilight',
    coverUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
    duration: 154,
    isLive: false,
  },
  {
    id: 'sc-both-of-us',
    title: 'Both of Us (Nostalgic Memory)',
    artist: 'Idealism',
    type: 'soundcloud',
    url: 'https://soundcloud.com/idealism/both-of-us',
    coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
    duration: 168,
    isLive: false,
  },
  {
    id: 'sc-loungin',
    title: 'Loungin (Late Night Sessions)',
    artist: 'Aso',
    type: 'soundcloud',
    url: 'https://soundcloud.com/aricogle/aso-loungin',
    coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
    duration: 192,
    isLive: false,
  },
];
