import { POI } from '@/types';

export interface AudioPlayerStatus {
  isPlaying: boolean;
  isLoading: boolean;
  isBuffering: boolean;
  durationMillis: number;
  positionMillis: number;
  error: string | null;
}

export interface AudioPlayerControls {
  status: AudioPlayerStatus;
  play: () => void;
  pause: () => void;
  seekTo: (positionMillis: number) => Promise<void>;
  togglePlayPause: () => void;
}

export interface AudioPlayerProps {
  tour: any; // Tour object containing POIs
  currentLocation: { lat: number; lng: number } | null;
  onClose: () => void;
}

export interface ProximityAudioPlayerProps {
  poi: POI | null;
  isNearPOI: boolean;
  onClose: () => void;
}