import React from 'react';
import { View, Text, Pressable, Image, ActivityIndicator } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAudioPlayer } from './useAudioPlayer';
import { AudioPlayerSlider } from './AudioPlayer.Slider';
import { POI } from '@/types';

// Helper to format time from milliseconds to MM:SS
const formatTime = (millis: number) => {
  if (!millis || millis < 0) return '0:00';
  const totalSeconds = Math.floor(millis / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

interface AudioPlayerProps {
  tour: any; // Tour object containing POIs
  currentLocation: { lat: number; lng: number } | null;
  onClose: () => void;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ 
  tour, 
  currentLocation, 
  onClose 
}) => {
  const nearbyPOIs = tour?.pois || [];
  const { status, togglePlayPause, seekTo, nearestPOI } = useAudioPlayer(nearbyPOIs, currentLocation, tour?.id);
  const insets = useSafeAreaInsets();

  // Always show the player, but show different states
  const currentPOI = nearestPOI;
  const hasActivePOI = currentPOI && currentPOI.audio_url;
  const isNearPOI = !!nearestPOI;

  const progress = status.durationMillis > 0 ? status.positionMillis / status.durationMillis : 0;

  const handleSlidingComplete = (newProgress: number) => {
    if (status.durationMillis > 0) {
      seekTo(newProgress * status.durationMillis);
    }
  };

  return (
    <View
      className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-2xl"
      style={{ paddingBottom: insets.bottom || 16 }}
    >
      <View className="p-4">
        {/* POI Info and Close Button */}
        <View className="flex-row items-start mb-4">
          {hasActivePOI && currentPOI.image_url ? (
            <Image
              source={{ uri: currentPOI.image_url }}
              className="w-16 h-16 rounded-lg mr-4"
            />
          ) : (
            <View className="w-16 h-16 rounded-lg mr-4 bg-gray-200 items-center justify-center">
              <FontAwesome name="headphones" size={24} color="#6B7280" />
            </View>
          )}
          
              <View className="flex-1">
                {hasActivePOI ? (
                  <>
                    <Text className="text-sm text-gray-500">
                      {isNearPOI ? 'Now Playing' : 'Audio Available'}
                    </Text>
                    <Text className="text-lg font-bold text-gray-900" numberOfLines={2}>
                      {currentPOI.name}
                    </Text>
                    {currentPOI.description && (
                      <Text className="text-sm text-gray-600 mt-1" numberOfLines={1}>
                        {currentPOI.description}
                      </Text>
                    )}
                  </>
                ) : (
                  <>
                    <Text className="text-sm text-gray-500">Audio Tour Player</Text>
                    <Text className="text-lg font-bold text-gray-900">Now Playing</Text>
                  </>
                )}
              </View>
          
          <Pressable onPress={onClose} className="p-2 -mt-2 -mr-2">
            <FontAwesome name="times" size={20} color="#6B7280" />
          </Pressable>
        </View>

        {/* Audio Controls - Only show if there's an active POI with audio */}
            {/* Slider and Time */}
            <View className="flex-row items-center w-full space-x-3 mb-4">
              <Text className="text-xs text-gray-500 w-10 text-center">
                {formatTime(status.positionMillis)}
              </Text>
              <View className="flex-1">
                <AudioPlayerSlider
                  value={progress}
                  onValueChange={() => {}} // Live seeking can be implemented here
                  onSlidingComplete={handleSlidingComplete}
                  disabled={!status.durationMillis}
                />
              </View>
              <Text className="text-xs text-gray-500 w-10 text-center">
                {formatTime(status.durationMillis)}
              </Text>
            </View>

            {/* Play/Pause Controls */}
            <View className="flex-row items-center justify-center space-x-8">
                <Pressable
                  onPress={togglePlayPause}
                  className="w-16 h-16 bg-blue-500 rounded-full items-center justify-center shadow-md"
                  disabled={!status.durationMillis}
                >
                  <FontAwesome 
                    name={status.isPlaying ? 'pause' : 'play'} 
                    size={24} 
                    color="white" 
                    style={{ marginLeft: status.isPlaying ? 0 : 4 }}
                  />
                </Pressable>
            </View>
        {/* Status Messages */}
        {!hasActivePOI && isNearPOI && (
          <View className="mt-2 p-3 bg-orange-50 rounded-lg">
            <Text className="text-orange-700 text-center text-sm">
              You&apos;re near a point of interest, but no audio is available.
            </Text>
          </View>
        )}

        {status.error && (
          <View className="mt-2 p-3 bg-red-50 rounded-lg">
            <Text className="text-red-700 text-center text-sm">{status.error}</Text>
          </View>
        )}
      </View>
    </View>
  );
};