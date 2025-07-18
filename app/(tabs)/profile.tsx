import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { Container } from '../../src/ui/atoms/Container';
import { Button } from '../../src/ui/atoms/Button';

export default function ProfileScreen() {
  const router = useRouter();
  const [user] = useState({
    name: 'Tour Explorer',
    email: 'explorer@example.com',
    toursCreated: 1,
    toursCompleted: 3,
    favoriteStyle: 'Cultural',
  });

  const menuItems = [
    {
      icon: 'cog',
      title: 'Settings',
      subtitle: 'App preferences and configuration',
      onPress: () => router.push('/settings'),
    },
    {
      icon: 'history',
      title: 'Tour History',
      subtitle: 'View your completed tours',
      onPress: () => router.push('/tour-history'),
    },
    {
      icon: 'question-circle',
      title: 'Help & Support',
      subtitle: 'Get help and contact support',
      onPress: () => router.push('/help'),
    },
  ];

  return (
    <>
      <Stack.Screen options={{ title: 'Profile' }} />
      <Container>
        <ScrollView className="flex-1 bg-gray-50" showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View className="bg-white px-4 py-6 border-b border-gray-200">
            <Text className="text-3xl font-bold text-gray-900 mb-2">
              Profile
            </Text>
          </View>

          {/* User Info Card */}
          <View className="m-4 bg-white rounded-lg p-6 shadow-sm">
            <View className="items-center mb-6">
              <View className="w-20 h-20 bg-blue-500 rounded-full items-center justify-center mb-3">
                <FontAwesome name="user" size={32} color="white" />
              </View>
              <Text className="text-xl font-bold text-gray-900">{user.name}</Text>
              <Text className="text-gray-600">{user.email}</Text>
            </View>

            {/* Stats */}
            <View className="flex-row justify-around border-t border-gray-200 pt-4">
              <View className="items-center">
                <Text className="text-2xl font-bold text-blue-600">{user.toursCreated}</Text>
                <Text className="text-gray-600 text-sm">Tours Created</Text>
              </View>
              <View className="items-center">
                <Text className="text-2xl font-bold text-green-600">{user.toursCompleted}</Text>
                <Text className="text-gray-600 text-sm">Tours Completed</Text>
              </View>
              <View className="items-center">
                <Text className="text-lg font-bold text-purple-600">{user.favoriteStyle}</Text>
                <Text className="text-gray-600 text-sm">Favorite Style</Text>
              </View>
            </View>
          </View>

          {/* Menu Items */}
          <View className="mx-4 bg-white rounded-lg shadow-sm overflow-hidden">
            {menuItems.map((item, index) => (
              <Pressable
                key={item.title}
                onPress={item.onPress}
                className="flex-row items-center px-4 py-4 border-b border-gray-100 last:border-b-0"
              >
                <View className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center mr-3">
                  <FontAwesome name={item.icon as any} size={16} color="#6b7280" />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-medium text-gray-900">{item.title}</Text>
                  <Text className="text-sm text-gray-600">{item.subtitle}</Text>
                </View>
                <FontAwesome name="chevron-right" size={14} color="#d1d5db" />
              </Pressable>
            ))}
          </View>

          {/* Sign Out Button */}
          <View className="m-4">
            <Button
              title="Sign Out"
              onPress={() => Alert.alert('Sign Out', 'Sign out functionality will be available soon!')}
              className="border-red-300 bg-red-50"
            />
          </View>
        </ScrollView>
      </Container>
    </>
  );
} 