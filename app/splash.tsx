import React from 'react';
import { View, Text, ActivityIndicator, Image } from 'react-native';

export default function SplashScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Image
        source={require('../assets/icon.png')}
        className="w-24 h-24 mb-6"
        resizeMode="contain"
      />
      <ActivityIndicator size="large" color="#3B82F6" />
      <Text className="text-gray-600 mt-4">Loading...</Text>
    </View>
  );
}