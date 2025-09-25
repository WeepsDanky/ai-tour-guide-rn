import React from 'react';
import { TouchableOpacity, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '../../lib/tokens';

interface HistoryButtonProps {
  onPress: () => void;
}

export function HistoryButton({ onPress }: HistoryButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        width: tokens.sizing.touchTarget.min,
        height: tokens.sizing.touchTarget.min,
        borderRadius: tokens.borderRadius.md,
        backgroundColor: tokens.colors.overlay.medium,
        alignItems: 'center',
        justifyContent: 'center',
      }}
      activeOpacity={0.7}
    >
      <Ionicons name="time-outline" size={20} color={tokens.colors.text} />
    </TouchableOpacity>
  );
}


