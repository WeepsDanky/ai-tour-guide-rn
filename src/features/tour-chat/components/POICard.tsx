import { View, Text, Image, TouchableOpacity } from 'react-native';
import { POICardProps } from '../types';

export default function POICard({ poi }: POICardProps) {
  if (!poi) {
    return (
      <View className="bg-white mx-4 my-3 p-4 rounded-lg shadow-sm">
        <View className="w-45 h-45 bg-gray-200 rounded-lg self-center my-3 animate-pulse" />
        <View className="h-4 bg-gray-200 rounded mb-2 animate-pulse" />
        <View className="h-3 bg-gray-200 rounded w-3/4 animate-pulse" />
      </View>
    );
  }

  const handlePlayAudio = () => {
    // TODO: Implement audio playback
    console.log('Playing audio:', poi.audioUrl);
  };

  return (
    <View className="bg-white mx-4 my-3 p-4 rounded-lg shadow-sm">
      {/* POI Cover Image */}
      <Image 
        source={{ uri: poi.coverImage }}
        className="w-45 h-45 rounded-lg self-center my-3"
        resizeMode="cover"
      />
      
      {/* POI Title */}
      <Text className="text-xl font-bold text-center mb-2">{poi.name}</Text>
      
      {/* Audio Player */}
      {poi.audioUrl && (
        <TouchableOpacity 
          onPress={handlePlayAudio}
          className="bg-blue-500 rounded-lg p-3 mb-3 flex-row items-center justify-center"
          activeOpacity={0.7}
        >
          <Text className="text-white mr-2">🎵</Text>
          <Text className="text-white font-medium">播放介绍</Text>
        </TouchableOpacity>
      )}
      
      {/* POI Description */}
      <Text className="text-gray-600 text-sm leading-5">
        {poi.description}
      </Text>
    </View>
  );
}