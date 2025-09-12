import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { lectureStyles } from '../../styles/lecture.styles';
import { tokens } from '../../lib/tokens';
import { ConfidenceBadge } from './ConfidenceBadge';

type HeaderBarProps = {
  onBack: () => void;
  confidence?: number;
};

export function HeaderBar({ onBack, confidence }: HeaderBarProps) {
  return (
    <View style={lectureStyles.header}>
      <TouchableOpacity
        style={lectureStyles.backButton}
        onPress={onBack}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="arrow-back" size={24} color={tokens.colors.text} />
      </TouchableOpacity>
      {typeof confidence === 'number' ? (
        <ConfidenceBadge confidence={confidence} size="small" showLabel={false} />
      ) : null}
    </View>
  );
}


