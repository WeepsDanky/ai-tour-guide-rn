import React from 'react';
import { Pressable, ViewStyle, StyleProp } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

interface AudioPlayerButtonProps {
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  iconSize?: number;
  iconColor?: string;
}

export const AudioPlayerButton: React.FC<AudioPlayerButtonProps> = ({
  onPress,
  style,
  iconSize = 24,
  iconColor = 'white',
}) => (
  <Pressable
    onPress={onPress}
    style={style}
    className="items-center justify-center rounded-full bg-blue-500 shadow-lg"
  >
    <FontAwesome name="headphones" size={iconSize} color={iconColor} />
  </Pressable>
); 