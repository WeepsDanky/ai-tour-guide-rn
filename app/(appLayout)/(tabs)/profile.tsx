import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { Container } from '@/ui/atoms/Container';
import { Button } from '@/ui/atoms/Button';
import { useAuth } from '@/context/AuthContext';

export default function ProfileScreen() {
  const router = useRouter();
  const { signOut, user } = useAuth();

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: () => signOut() },
      ]
    );
  };

  const menuItems = [
    {
      icon: 'cog',
      title: 'Settings',
      subtitle: 'App preferences and configuration',
      onPress: () => router.push('/profile/settings'),
    },
    {
      icon: 'question-circle',
      title: 'Help & Support',
      subtitle: 'Get help and contact support',
      onPress: () => router.push('/profile/help'),
    },
  ];

  return (
    <View className="flex-1 bg-gray-50">
      <Stack.Screen options={{ title: 'Profile' }} />
      <Container>
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View className="px-4 py-6 border-gray-200">
            <Text className="text-3xl font-bold text-gray-900 mb-2">
              Profile
            </Text>
          </View>

          {/* User Info Card */}
          <View className="m-4 p-6">
            <View className="items-center mb-6">
              <View className="w-20 h-20 bg-blue-500 rounded-full items-center justify-center mb-3">
                <FontAwesome name="user" size={32} color="white" />
              </View>
              <Text className="text-xl font-bold text-gray-900">{user?.nickname || 'Tour Explorer'}</Text>
            </View>

          </View>

          {/* Menu Items */}
          <View className="mx-4 overflow-hidden">
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
          <View className="m-4 mb-8">
            <Button
              title="Sign Out"
              variant="danger"
              onPress={handleSignOut}
            />
          </View>
        </ScrollView>
      </Container>
    </View>
  );
} 