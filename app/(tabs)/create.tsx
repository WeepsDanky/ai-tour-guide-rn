import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { Container } from '../../src/ui/atoms/Container';
import { Button } from '../../src/ui/atoms/Button';

export default function CreateScreen() {
  const router = useRouter();

  const handleOpenCamera = () => {
    router.push('/create-photo/capture');
  };

  return (
    <Container>
      <Stack.Screen options={{ title: 'Create Tour' }} />
      
      <View className="flex-1 items-center justify-center p-8">
        <View className="items-center space-y-6">
          <View className="w-24 h-24 bg-blue-100 rounded-full items-center justify-center">
            <FontAwesome name="camera" size={40} color="#3B82F6" />
          </View>
          
          <View className="items-center space-y-2">
            <Text className="text-2xl font-bold text-gray-900 text-center">
              Create Your Tour
            </Text>
            <Text className="text-gray-600 text-center leading-relaxed">
              Take a photo of your location to get started with AI-powered tour generation
            </Text>
          </View>
          
          <Button
            title="Take Photo"
            onPress={handleOpenCamera}
            size="large"
            className="px-8"
          />
        </View>
      </View>
    </Container>
  );
} 