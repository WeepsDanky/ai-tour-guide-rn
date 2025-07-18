import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

export interface LocationPillProps {
  location: string;
  onPress?: () => void;
  loading?: boolean;
}

/**
 * A pill-shaped component displaying location information with a map marker icon.
 * Used in camera screens to show current location.
 */
export function LocationPill({ location, onPress, loading = false }: LocationPillProps) {
  const Component = onPress ? Pressable : View;
  
  return (
    <Component
      onPress={onPress}
      className="bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 flex-row items-center shadow-md border border-white/20"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }}
    >
      <FontAwesome 
        name="map-marker" 
        size={14} 
        color="#374151" 
        style={{ marginRight: 6 }}
      />
      <Text 
        className="text-gray-700 text-sm font-medium max-w-[200px]" 
        numberOfLines={1}
      >
        {loading ? 'Getting location...' : location || 'Unknown location'}
      </Text>
    </Component>
  );
} 