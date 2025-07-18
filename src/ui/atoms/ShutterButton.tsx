import React from 'react';
import { Pressable, View, Animated } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

export interface ShutterButtonProps {
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}

/**
 * A camera shutter button with iOS-style design and subtle pulse animation.
 * 72x72 dp size with dark fill and shadow.
 */
export function ShutterButton({ onPress, disabled = false, loading = false }: ShutterButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className="items-center justify-center active:scale-95"
    >
      <View 
        className="w-18 h-18 bg-gray-800 rounded-full items-center justify-center border-4 border-white"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        <View className="w-14 h-14 bg-white rounded-full items-center justify-center">
          {loading ? (
            <View className="w-6 h-6 bg-gray-400 rounded-full animate-pulse" />
          ) : (
            <FontAwesome name="camera" size={24} color="#374151" />
          )}
        </View>
      </View>
    </Pressable>
  );
} 