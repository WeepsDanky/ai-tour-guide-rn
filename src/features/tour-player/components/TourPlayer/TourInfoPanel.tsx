import React from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Tour, POI, PlaybackState } from '~/types';
import { ProgressIndicator } from '../../../../ui/atoms/ProgressIndicator';

interface TourInfoPanelProps {
  tour: Tour;
  completionPercentage: number;
  playbackState: PlaybackState;
  currentPOI?: POI | null;
  onPlayPause: () => void;
  onStop: () => void;
  onComplete: () => void;
  onTogglePOIList: () => void;
  onClose: () => void;
}

export function TourInfoPanel({
  tour,
  completionPercentage,
  playbackState,
  currentPOI,
  onPlayPause,
  onStop,
  onComplete,
  onTogglePOIList,
  onClose,
}: TourInfoPanelProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View className="absolute top-12 left-4 right-4">
      <View className="bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <View className="p-4 border-b border-gray-100">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-lg font-semibold text-gray-900 flex-1 mr-3">
              {tour.title}
            </Text>
            <Pressable
              onPress={onClose}
              className="w-6 h-6 items-center justify-center"
            >
              <FontAwesome name="minus" size={14} color="#6B7280" />
            </Pressable>
          </View>

          {/* Progress */}
          <ProgressIndicator
            progress={completionPercentage}
            text={`${Math.round(completionPercentage)}% Complete`}
            size="small"
            className="mb-2"
          />

          {/* Tour stats */}
          <View className="flex-row items-center space-x-4">
            <View className="flex-row items-center">
              <FontAwesome name="clock-o" size={12} color="#6B7280" />
              <Text className="text-xs text-gray-500 ml-1">
                {tour.duration} min
              </Text>
            </View>
            <View className="flex-row items-center">
              <FontAwesome name="map-marker" size={12} color="#6B7280" />
              <Text className="text-xs text-gray-500 ml-1">
                {tour.pois.length} stops
              </Text>
            </View>
            <View className="flex-row items-center">
              <FontAwesome name="signal" size={12} color="#6B7280" />
              <Text className="text-xs text-gray-500 ml-1 capitalize">
                {tour.difficulty}
              </Text>
            </View>
          </View>
        </View>

        {/* Current POI Info */}
        {currentPOI && (
          <View className="p-4 bg-blue-50 border-b border-gray-100">
            <View className="flex-row items-center">
              {currentPOI.image_url && (
                <Image
                  source={{ uri: currentPOI.image_url }}
                  className="w-12 h-12 rounded-lg mr-3"
                  resizeMode="cover"
                />
              )}
              <View className="flex-1">
                <Text className="text-sm font-semibold text-gray-900 mb-1">
                  Now Playing: {currentPOI.name}
                </Text>
                {playbackState.duration > 0 && (
                  <Text className="text-xs text-gray-600">
                    {formatTime(playbackState.currentTime)} / {formatTime(playbackState.duration)}
                  </Text>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Controls */}
        <View className="p-4">
          <View className="flex-row items-center justify-between">
            {/* Audio controls */}
            <View className="flex-row items-center space-x-3">
              {currentPOI && (
                <>
                  <Pressable
                    onPress={onPlayPause}
                    className="w-10 h-10 items-center justify-center rounded-full bg-blue-500"
                  >
                    <FontAwesome
                      name={playbackState.isPlaying ? 'pause' : 'play'}
                      size={14}
                      color="white"
                    />
                  </Pressable>
                  <Pressable
                    onPress={onStop}
                    className="w-10 h-10 items-center justify-center rounded-full bg-gray-200"
                  >
                    <FontAwesome name="stop" size={14} color="#6B7280" />
                  </Pressable>
                </>
              )}
            </View>

            {/* Action buttons */}
            <View className="flex-row items-center space-x-2">
              <Pressable
                onPress={onTogglePOIList}
                className="px-3 py-2 bg-gray-100 rounded-full"
              >
                <View className="flex-row items-center">
                  <FontAwesome name="list" size={12} color="#6B7280" />
                  <Text className="text-xs text-gray-600 ml-1">POIs</Text>
                </View>
              </Pressable>

              <Pressable
                onPress={onComplete}
                className="px-3 py-2 bg-green-100 rounded-full"
              >
                <View className="flex-row items-center">
                  <FontAwesome name="flag-checkered" size={12} color="#059669" />
                  <Text className="text-xs text-green-700 ml-1">Finish</Text>
                </View>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
} 