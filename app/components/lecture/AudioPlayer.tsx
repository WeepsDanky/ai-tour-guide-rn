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
  const [showWaveform, setShowWaveform] = useState(false);
  
  // 格式化时间显示
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  // 处理播放/暂停
  const handlePlayPause = () => {
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
  
  return (
    <View style={styles.container}>
      {/* 转录文本显示 */}
      {transcript && (
        <View style={styles.transcriptContainer}>
          <Text style={styles.transcriptText}>{transcript}</Text>
        </View>
      )}
      
      {/* 波形显示（可选） */}
      {showWaveform && (
        <View style={styles.waveformContainer}>
          {/* 简化的波形显示 */}
          <View style={styles.waveform}>
            {Array.from({ length: 50 }).map((_, index) => (
              <View
                key={index}
                style={[
                  styles.waveformBar,
                  {
                    height: Math.random() * 20 + 4,
                    backgroundColor: index < (progressPercentage / 2)
                      ? tokens.colors.accent.architecture
                      : tokens.colors.text,
                  },
                ]}
              />
            ))}
          </View>
        </View>
      )}
      
      {/* 控制按钮 */}
      <View style={styles.controlsContainer}>
        
        {/* 播放/暂停 */}
        <TouchableOpacity
          style={[styles.controlButton, styles.playButton]}
          onPress={handlePlayPause}
          disabled={playerState.isLoading}
        >
          <Ionicons 
            name={playerState.isPlaying ? "pause" : "play"} 
            size={32} 
            color={tokens.colors.text} 
          />
        </TouchableOpacity>
        
      </View>
      
      {/* 次要控制 */}
      <View style={styles.secondaryControls}>
        {/* 语速控制 */}
        <TouchableOpacity
          style={styles.speedButton}
          onPress={handleSpeedChange}
        >
          <Text style={styles.speedText}>
            {SPEED_OPTIONS[currentSpeedIndex]}×
          </Text>
        </TouchableOpacity>
        
        {/* 波形切换 */}
        <TouchableOpacity
          style={styles.waveformToggle}
          onPress={() => setShowWaveform(!showWaveform)}
        >
          <Ionicons 
            name={showWaveform ? "bar-chart" : "bar-chart-outline"} 
            size={20} 
            color={tokens.colors.text} 
          />
        </TouchableOpacity>
        
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