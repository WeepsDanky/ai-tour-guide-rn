import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { lectureStyles } from '../../styles/lecture.styles';
import { tokens } from '../../lib/tokens';

type ErrorViewProps = {
  message: string;
  onRetry: () => void;
};

export function ErrorView({ message, onRetry }: ErrorViewProps) {
  return (
    <View style={lectureStyles.errorContainer}>
      <Ionicons name="warning-outline" size={48} color={tokens.colors.semantic.error} />
      <Text style={lectureStyles.errorText}>{message}</Text>
      <TouchableOpacity style={lectureStyles.retryButton} onPress={onRetry}>
        <Text style={lectureStyles.retryButtonText}>返回重试</Text>
      </TouchableOpacity>
    </View>
  );
}


