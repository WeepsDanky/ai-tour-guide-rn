import React from 'react';
import { View, Pressable } from 'react-native';

interface SliderProps {
  value: number; // 0 to 1
  onValueChange: (value: number) => void;
  onSlidingComplete: (value: number) => void;
  disabled?: boolean;
}

export const AudioPlayerSlider: React.FC<SliderProps> = ({
  value,
  onValueChange,
  onSlidingComplete,
  disabled = false,
}) => {
  const handlePress = (event: any) => {
    if (disabled) return;
    
    const { locationX, pageX } = event.nativeEvent;
    const { width } = event.currentTarget?.measure || { width: 300 };
    
    // Use locationX if available, otherwise estimate from pageX
    const x = locationX !== undefined ? locationX : pageX;
    const newValue = Math.max(0, Math.min(1, x / width));
    
    onValueChange(newValue);
    onSlidingComplete(newValue);
  };

  return (
    <Pressable
      className="w-full h-5 flex-col justify-center"
      onPress={handlePress}
      disabled={disabled}
    >
      <View className={`w-full h-1 rounded-full ${disabled ? 'bg-gray-200' : 'bg-gray-300'}`}>
        <View
          className={`h-1 rounded-full ${disabled ? 'bg-gray-400' : 'bg-blue-500'}`}
          style={{ width: `${Math.max(0, Math.min(100, value * 100))}%` }}
        />
        <View
          className={`absolute w-3 h-3 border-2 rounded-full -top-1 ${
            disabled 
              ? 'bg-gray-300 border-gray-400' 
              : 'bg-white border-blue-500'
          }`}
          style={{ 
            left: `${Math.max(0, Math.min(100, value * 100))}%`,
            marginLeft: -6, // Half of thumb width to center it
          }}
        />
      </View>
    </Pressable>
  );
}; 