import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '../../lib/tokens';

interface AudioPlayerProps {
  playerState: {
    isPlaying: boolean;
    currentPosition: number;
    duration: number;
    isLoading: boolean;
  };
  onPlayPause: () => void;
  onSeek: (position: number) => void;
  onSpeedChange: (speed: number) => void;
  onRegenerate: () => void;
  transcript: string;
}

const SPEED_OPTIONS = [0.9, 1.0, 1.2, 1.5];

export function AudioPlayer({
  playerState,
  onPlayPause,
  onSeek,
  onSpeedChange,
  onRegenerate,
  transcript,
}: AudioPlayerProps) {
  const [currentSpeedIndex, setCurrentSpeedIndex] = useState(1); // 默认1.0x
  const [waveBars, setWaveBars] = useState<number[]>(() =>
    Array.from({ length: 50 }).map(() => 8 + Math.random() * 16)
  );
  const [tick, setTick] = useState(0);
  
  // 格式化时间显示
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  // 结束判定（允许少量阈值防止边界误差）
  const isEnded = playerState.duration > 0 && (playerState.currentPosition >= Math.max(0, playerState.duration - 300));

  // 处理播放/暂停
  const handlePlayPause = () => {
    if (playerState.isLoading) return;
    if (isEnded) {
      onSeek(0);
      onPlayPause();
      return;
    }
    onPlayPause();
  };
  
  // 处理快进/快退
  const handleSeek = (direction: 'forward' | 'backward') => {
    const seekAmount = 10000; // 10秒
    const newPosition = direction === 'forward' 
      ? Math.min(playerState.currentPosition + seekAmount, playerState.duration)
      : Math.max(playerState.currentPosition - seekAmount, 0);
    onSeek(newPosition);
  };
  
  // 处理语速切换
  const handleSpeedChange = () => {
    const nextIndex = (currentSpeedIndex + 1) % SPEED_OPTIONS.length;
    setCurrentSpeedIndex(nextIndex);
    onSpeedChange(SPEED_OPTIONS[nextIndex]);
  };
  
  // 计算进度百分比
  const progressPercentage = playerState.duration > 0 
    ? (playerState.currentPosition / playerState.duration) * 100 
    : 0;

  // 驱动波形动态变化（简易幅度动画，随播放而动）
  useEffect(() => {
    let raf: number | null = null;
    let lastTs = 0;
    const step = (ts: number) => {
      const dt = ts - lastTs;
      if (dt > 50) {
        lastTs = ts;
        setWaveBars(prev => {
          const next = prev.slice(1);
          const t = (performance.now() / 1000) % 1000;
          // 基于播放状态生成新高度：播放时抖动更明显，暂停时缓慢衰减
          const base = playerState.isPlaying ? 14 : 8;
          const jitter = playerState.isPlaying ? 12 : 4;
          const sinMod = Math.abs(Math.sin(t * 2.2)) * (playerState.isPlaying ? 10 : 2);
          next.push(Math.max(4, Math.min(28, base + sinMod + (Math.random() - 0.5) * jitter)));
          return next;
        });
        setTick(v => (v + 1) % 1_000_000);
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => { if (raf) cancelAnimationFrame(raf); };
  }, [playerState.isPlaying]);
  
  return (
    <View style={styles.container}>
      {/* 转录文本显示 */}
      {transcript && (
        <View style={styles.transcriptContainer}>
          <Text style={styles.transcriptText}>{transcript}</Text>
        </View>
      )}
      
      {/* 波形显示（默认显示，动态变化） */}
      <View style={styles.waveformContainer}>
        <View style={styles.waveform}>
          {waveBars.map((h, index) => (
            <View
              key={`${tick}-${index}`}
              style={[
                styles.waveformBar,
                {
                  height: h,
                  backgroundColor: index < (progressPercentage / 2)
                    ? tokens.colors.accent.architecture
                    : tokens.colors.text,
                },
              ]}
            />
          ))}
        </View>
      </View>
      
      {/* 控制按钮 */}
      <View style={styles.controlsContainer}>
        
        {/* 播放/暂停 */} 
        {/* <TouchableOpacity
          style={[styles.controlButton, styles.playButton]}
          onPress={handlePlayPause}
          disabled={playerState.isLoading}
        >
          <Ionicons 
            name={(playerState.isPlaying && !isEnded) ? "pause" : "play"} 
            size={32} 
            color={tokens.colors.text} 
          />
        </TouchableOpacity> */}
        {/* TODO: Implement play/pause button */}
      </View>
      
      {/* 次要控制 */}
      <View style={styles.secondaryControls}>

        {/* 换一种讲法 */}
        <TouchableOpacity
          style={styles.regenerateButton}
          onPress={onRegenerate}
        >
          <Ionicons 
            name="refresh" 
            size={20} 
            color={tokens.colors.accent.history} 
          />
          <Text style={styles.regenerateText}>换一种讲法</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.md,
    backgroundColor: tokens.colors.background,
    borderRadius: tokens.borderRadius.lg,
    marginHorizontal: tokens.spacing.md,
  },
  
  transcriptContainer: {
    marginBottom: tokens.spacing.md,
    minHeight: 60,
  },
  
  transcriptText: {
    fontSize: tokens.typography.fontSize.body,
    lineHeight: tokens.typography.lineHeight.body,
    color: tokens.colors.text,
    fontFamily: tokens.typography.fontFamily.chinese,
    letterSpacing: tokens.typography.letterSpacing,
  },
  
  waveformContainer: {
    marginBottom: tokens.spacing.md,
  },
  
  waveform: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 40,
    paddingHorizontal: tokens.spacing.sm,
  },
  
  waveformBar: {
    width: 2,
    borderRadius: 1,
    marginHorizontal: 0.5,
  },
  
  progressContainer: {
    marginBottom: tokens.spacing.lg,
  },
  
  progressTrack: {
    height: 4,
    backgroundColor: tokens.colors.border.default,
    borderRadius: 2,
    overflow: 'hidden',
  },
  
  progressFill: {
    height: '100%',
    backgroundColor: tokens.colors.accent.architecture,
    borderRadius: 2,
  },
  
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: tokens.spacing.xs,
  },
  
  timeText: {
    fontSize: tokens.typography.fontSize.meta,
    color: tokens.colors.text,
    fontFamily: tokens.typography.fontFamily.english,
  },
  
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: tokens.spacing.md,
  },
  
  controlButton: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: tokens.spacing.lg,
  },
  
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: tokens.colors.accent.architecture,
    marginHorizontal: tokens.spacing.xl,
  },
  
  seekLabel: {
    fontSize: tokens.typography.fontSize.meta,
    color: tokens.colors.text,
    marginTop: 2,
    fontFamily: tokens.typography.fontFamily.english,
  },
  
  secondaryControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  
  speedButton: {
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    backgroundColor: tokens.colors.background,
    borderRadius: tokens.borderRadius.md,
  },
  
  speedText: {
    fontSize: tokens.typography.fontSize.body,
    color: tokens.colors.text,
    fontFamily: tokens.typography.fontFamily.english,
    fontWeight: '600',
  },
  
  waveformToggle: {
    padding: tokens.spacing.sm,
  },
  
  regenerateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    backgroundColor: tokens.colors.background,
    borderRadius: tokens.borderRadius.md,
  },
  
  regenerateText: {
    fontSize: tokens.typography.fontSize.body,
    color: tokens.colors.accent.history,
    marginLeft: tokens.spacing.xs,
    fontFamily: tokens.typography.fontFamily.chinese,
  },
});