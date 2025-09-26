// lib/audio-stream-player.ts

import { createAudioPlayer, AudioPlayer } from 'expo-audio';
import * as FileSystem from 'expo-file-system';

const WS_DEBUG = (process.env.EXPO_PUBLIC_WS_DEBUG || 'true') === 'true';
function log(...args: any[]) { if (WS_DEBUG) console.log('[AUDIO]', ...args); }

export interface AudioStreamPlayerHandlers {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: string) => void;
  onNack?: (expectedSeq: number) => void;
}

export class AudioStreamPlayer {
  private queue: string[] = [];
  private isPlaying = false;
  private expectedSeq = 1;
  private player: AudioPlayer | null = null;
  private destroyed = false;
  private handlers: AudioStreamPlayerHandlers = {};
  private advancing = false;

  setHandlers(h: AudioStreamPlayerHandlers) { this.handlers = h; }

  getExpectedSeq(): number { return this.expectedSeq; }

  async enqueueBinary(seq: number, audioBytes: Uint8Array) {
    if (seq < this.expectedSeq) return;
    if (seq > this.expectedSeq) this.handlers.onNack?.(this.expectedSeq);
    const fileName = `seg_${seq}.mp3`;
    const filePath = `${FileSystem.cacheDirectory}${fileName}`;
    const base64 = this.bytesToBase64(audioBytes);
    await FileSystem.writeAsStringAsync(filePath, base64, { encoding: FileSystem.EncodingType.Base64 });
    this.queue.push(filePath);
    this.expectedSeq = seq + 1;
    log('enqueued', { seq, queueLen: this.queue.length });
    if (!this.isPlaying) this.startPlayback();
  }

  async enqueueBase64(seq: number, base64: string) {
    if (seq < this.expectedSeq) return;
    if (seq > this.expectedSeq) this.handlers.onNack?.(this.expectedSeq);
    const fileName = `seg_${seq}.mp3`;
    const filePath = `${FileSystem.cacheDirectory}${fileName}`;
    await FileSystem.writeAsStringAsync(filePath, base64, { encoding: FileSystem.EncodingType.Base64 });
    this.queue.push(filePath);
    this.expectedSeq = seq + 1;
    log('enqueued', { seq, queueLen: this.queue.length });
    if (!this.isPlaying) this.startPlayback();
  }

  private bytesToBase64(u8: Uint8Array): string {
    const CHUNK_SIZE = 0x8000;
    const parts: string[] = [];
    for (let i = 0; i < u8.length; i += CHUNK_SIZE) {
      const chunk = u8.subarray(i, i + CHUNK_SIZE);
      parts.push(String.fromCharCode.apply(null, chunk as any));
    }
    return btoa(parts.join(''));
  }

  private async startPlayback() {
    if (this.isPlaying || this.destroyed) return;
    this.isPlaying = true;
    this.handlers.onStart?.();
    if (!this.player) {
      try {
        log('Creating AudioPlayer instance...');
        const initialSource = this.queue[0];
        if (!initialSource) {
          this.isPlaying = false;
          this.handlers.onEnd?.();
          return;
        }
        this.player = createAudioPlayer({ uri: initialSource });
        this.player.play();
        // Dequeue only after play has been initiated
        this.queue.shift();
        this.player.addListener('playbackStatusUpdate', (status) => {
          if ((status as any).didJustFinish) {
            log('Playback finished, playing next...');
            this.playNext();
          }
        });
      } catch (e: any) {
        console.error('[AUDIO] Failed to start audio player:', e);
        this.handlers.onError?.('Audio engine failed to start.');
        this.isPlaying = false;
        // Keep the current head of queue for retry on next enqueue
      }
    }
  }

  private playNext() {
    if (this.destroyed || !this.player || this.advancing) return;
    this.advancing = true;
    const nextPath = this.queue[0];
    if (!nextPath) {
      log('Queue empty, playback finished.');
      this.isPlaying = false;
      this.handlers.onEnd?.();
      this.advancing = false;
      return;
    }
    log('Replacing player source with:', nextPath);
    try {
      this.player.replace({ uri: nextPath });
      this.player.play();
      // Dequeue only after replace+play succeed
      this.queue.shift();
    } catch (e: any) {
      console.error('[AUDIO] Failed to replace/play next source:', e);
      this.handlers.onError?.('Audio engine failed to play next segment.');
      // Do not shift; keep for retry on next status tick/enqueue
    } finally {
      this.advancing = false;
    }
  }

  async destroy() {
    this.destroyed = true;
    try { this.player?.release(); } catch {}
    this.player = null;
    for (const filePath of this.queue) {
      try { await FileSystem.deleteAsync(filePath, { idempotent: true }); }
      catch (err) { console.warn('Failed to delete audio file:', filePath, err); }
    }
    this.queue = [];
    this.isPlaying = false;
  }
}


