import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '../../lib/tokens';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface CameraTopBarProps {
  onImportPress: () => void;
  onProfilePress?: () => void;
}

export function CameraTopBar({ onImportPress, onProfilePress }: CameraTopBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        paddingTop: insets.top + tokens.spacing.md,
        paddingHorizontal: tokens.spacing.lg,
        paddingBottom: tokens.spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: tokens.zIndex.overlay,
      }}
    >
      {/* Logo */}
      <View style={{ flex: 1 }}>
        <Text
          style={{
            color: tokens.colors.text,
            fontSize: tokens.typography.fontSize.h2,
            fontFamily: tokens.typography.fontFamily.english,
            fontWeight: '700',
            letterSpacing: tokens.typography.letterSpacing,
          }}
        >
          拍照即听
        </Text>
      </View>

      {/* 右上角 Profile */}
      <View style={{ flex: 1, alignItems: 'flex-end' }}>
        <TouchableOpacity
          onPress={onProfilePress}
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
          <Ionicons name="person-outline" size={20} color={tokens.colors.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
}