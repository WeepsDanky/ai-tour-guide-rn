// src/services/audio-player.ts
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import type { POI } from '@/types';

export interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  currentPOI?: POI;
}

export class TourAudioPlayer {
  private player: any = null;
  private currentPOI: POI | null = null;
  public onStateChange: ((state: PlaybackState) => void) | null = null;
  private statusUpdateInterval: NodeJS.Timeout | null = null;
  
  constructor() {
    this.setupAudio();
  }

  private async setupAudio() {
    try {
      await setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
        shouldPlayInBackground: true,
        interruptionModeAndroid: 'duckOthers',
        interruptionMode: 'duckOthers',
        shouldRouteThroughEarpiece: false,
      });
    } catch (error) {
      console.warn('Failed to setup audio mode:', error);
    }
  }

  async playPOI(poi: POI): Promise<void> {
    if (!poi.audio_url) {
      throw new Error("POI has no audio URL");
    }

    if (this.player) {
      this.player.remove();
    }

    try {
      this.player = createAudioPlayer({ uri: poi.audio_url });
      this.currentPOI = poi;
      
      // Start monitoring playback status
      this.startStatusMonitoring();
      
      this.player.play();
    } catch (error) {
      console.error('Failed to play audio:', error);
      throw error;
    }
  }

  private startStatusMonitoring() {
    if (this.statusUpdateInterval) {
      clearInterval(this.statusUpdateInterval);
    }

    this.statusUpdateInterval = setInterval(() => {
      if (this.player && this.onStateChange) {
        const state: PlaybackState = {
          isPlaying: this.player.playing,
          currentTime: this.player.currentTime,
          duration: this.player.duration || 0,
          currentPOI: this.currentPOI || undefined,
        };
        
        this.onStateChange(state);
      }
    }, 500);
  }

  private stopStatusMonitoring() {
    if (this.statusUpdateInterval) {
      clearInterval(this.statusUpdateInterval);
      this.statusUpdateInterval = null;
    }
  }

  async pause(): Promise<void> {
    if (this.player) {
      try {
        this.player.pause();
      } catch (error) {
        console.error('Failed to pause audio:', error);
      }
    }
  }

  async resume(): Promise<void> {
    if (this.player) {
      try {
        this.player.play();
      } catch (error) {
        console.error('Failed to resume audio:', error);
      }
    }
  }

  async seek(positionSeconds: number): Promise<void> {
    if (this.player) {
      try {
        await this.player.seekTo(positionSeconds);
      } catch (error) {
        console.error('Failed to seek audio:', error);
      }
    }
  }

  async stop(): Promise<void> {
    if (this.player) {
      try {
        this.player.pause();
        await this.player.seekTo(0);
      } catch (error) {
        console.error('Failed to stop audio:', error);
      }
    }
  }

  async destroy(): Promise<void> {
    this.stopStatusMonitoring();
    
    if (this.player) {
      try {
        this.player.remove();
      } catch (error) {
        console.error('Failed to remove audio player:', error);
      }
      this.player = null;
    }
    this.currentPOI = null;
    this.onStateChange = null;
  }
} 