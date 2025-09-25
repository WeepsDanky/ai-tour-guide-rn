import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { lectureStyles } from '../../styles/lecture.styles';
import { tokens } from '../../lib/tokens';

type HeaderBarProps = {
  onBack: () => void;
  confidence?: number; // kept for compatibility; ignored in UI
};

export function HeaderBar({ onBack }: HeaderBarProps) {
  return (
    <View style={lectureStyles.header}>
      <TouchableOpacity
        style={lectureStyles.backButton}
        onPress={onBack}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="arrow-back" size={24} color={tokens.colors.text} />
      </TouchableOpacity>
    </View>
  );
}


