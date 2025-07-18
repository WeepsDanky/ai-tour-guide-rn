import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

export interface CameraControlButtonProps {
  onPress: () => void;
  icon: keyof typeof FontAwesome.glyphMap;
  label: string;
  disabled?: boolean;
}

/**
 * A camera control button for secondary actions like flip camera or choose from library.
 * Used in camera screen footer controls.
 */
export function CameraControlButton({ 
  onPress, 
  icon, 
  label, 
  disabled = false 
}: CameraControlButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className="items-center justify-center p-2"
      style={{ opacity: disabled ? 0.5 : 1 }}
    >
      <View 
        className="w-12 h-12 bg-black/50 rounded-full items-center justify-center mb-1"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 4,
          elevation: 4,
        }}
      >
        <FontAwesome name={icon} size={20} color="white" />
      </View>
      <Text className="text-white text-xs font-medium text-center">
        {label}
      </Text>
    </Pressable>
  );
}

// Specific button variants
export interface FlipButtonProps {
  onPress: () => void;
  disabled?: boolean;
}

export function FlipButton({ onPress, disabled }: FlipButtonProps) {
  return (
    <CameraControlButton
      onPress={onPress}
      icon="refresh"
      label="Flip"
      disabled={disabled}
    />
  );
}

export interface ChooseFromLibraryButtonProps {
  onPress: () => void;
  disabled?: boolean;
}

export function ChooseFromLibraryButton({ onPress, disabled }: ChooseFromLibraryButtonProps) {
  return (
    <CameraControlButton
      onPress={onPress}
      icon="image"
      label="Library"
      disabled={disabled}
    />
  );
} 