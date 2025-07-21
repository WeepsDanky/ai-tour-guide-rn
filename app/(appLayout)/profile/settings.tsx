import React, { useState } from 'react';
import { View, Text, Switch, Alert, Pressable, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { ScreenLayout } from '@/ui/layout/ScreenLayout';
import { Card, CardContent } from '@/ui/molecules/Card';

export default function SettingsScreen() {
  // Notification Settings
  const [pushNotifications, setPushNotifications] = useState(true);
  const [tourReminders, setTourReminders] = useState(true);
  const [newTourAlerts, setNewTourAlerts] = useState(false);
  const [soundEffects, setSoundEffects] = useState(true);
  const [voiceAnnouncements, setVoiceAnnouncements] = useState(true);

  // App Preferences
  const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>('auto');
  const [language, setLanguage] = useState('English');
  const [units, setUnits] = useState<'metric' | 'imperial'>('metric');
  const [autoPlay, setAutoPlay] = useState(true);

  const autoSave = async () => {
    try {
      // Simulate auto-saving preferences
      await new Promise(resolve => setTimeout(resolve, 200));
      console.log('Settings auto-saved');
    } catch (error) {
      console.error('Failed to auto-save preferences:', error);
    }
  };

  const handleSettingChange = (setter: (value: any) => void, value: any) => {
    setter(value);
    autoSave();
  };

  const SettingRow = ({ 
    title, 
    subtitle, 
    value, 
    onValueChange, 
    icon 
  }: {
    title: string;
    subtitle?: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
    icon: string;
  }) => (
    <View className="flex-row items-center py-3">
      <View className="w-8 h-8 bg-blue-100 rounded-full items-center justify-center mr-3">
        <FontAwesome name={icon as any} size={14} color="#3B82F6" />
      </View>
      <View className="flex-1">
        <Text className="text-base font-medium text-gray-900">{title}</Text>
        {subtitle && (
          <Text className="text-sm text-gray-600">{subtitle}</Text>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={(newValue) => handleSettingChange(onValueChange, newValue)}
        trackColor={{ false: '#E5E7EB', true: '#3B82F6' }}
        thumbColor={value ? '#FFFFFF' : '#FFFFFF'}
      />
    </View>
  );

  const SelectionRow = ({
    title,
    subtitle,
    value,
    options,
    onSelect,
    icon
  }: {
    title: string;
    subtitle?: string;
    value: string;
    options: string[];
    onSelect: (value: string) => void;
    icon: string;
  }) => (
    <Pressable 
      className="flex-row items-center py-3"
      onPress={() => {
        Alert.alert(
          title,
          `Select ${title.toLowerCase()}`,
          options.map(option => ({
            text: option,
            onPress: () => handleSettingChange(onSelect, option)
          }))
        );
      }}
    >
      <View className="w-8 h-8 bg-blue-100 rounded-full items-center justify-center mr-3">
        <FontAwesome name={icon as any} size={14} color="#3B82F6" />
      </View>
      <View className="flex-1">
        <Text className="text-base font-medium text-gray-900">{title}</Text>
        {subtitle && (
          <Text className="text-sm text-gray-600">{subtitle}</Text>
        )}
      </View>
      <View className="flex-row items-center">
        <Text className="text-sm text-gray-500 mr-2">{value}</Text>
        <FontAwesome name="chevron-right" size={14} color="#D1D5DB" />
      </View>
    </Pressable>
  );

  return (
    <View className="flex-1">
      <Stack.Screen options={{ title: 'Settings', headerShown: false }} />
      <ScreenLayout
        showBackButton={true}
        variant="large"
        title="Settings"
      >
        <ScrollView 
          className="flex-1 p-4 space-y-6 bg-white"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          
          {/* Notifications */}
          <Card className="mb-4">
            <CardContent>
              <Text className="text-lg font-semibold text-gray-900">
                Notifications
              </Text>
              
              <View className="space-y-1">
                <SettingRow
                  title="Push Notifications"
                  subtitle="Receive notifications on your device"
                  value={pushNotifications}
                  onValueChange={setPushNotifications}
                  icon="bell"
                />
                <SettingRow
                  title="Tour Reminders"
                  subtitle="Get reminded about planned tours"
                  value={tourReminders}
                  onValueChange={setTourReminders}
                  icon="clock-o"
                />
                <SettingRow
                  title="New Tour Alerts"
                  subtitle="Notifications about new tours in your area"
                  value={newTourAlerts}
                  onValueChange={setNewTourAlerts}
                  icon="map-marker"
                />
              </View>
            </CardContent>
          </Card>

          {/* Audio & Voice */}
          <Card className="mb-4">
            <CardContent>
              <Text className="text-lg font-semibold text-gray-900 mb-4">
                Audio & Voice
              </Text>
              
              <View className="space-y-1">
                <SettingRow
                  title="Sound Effects"
                  subtitle="Play sounds for interactions"
                  value={soundEffects}
                  onValueChange={setSoundEffects}
                  icon="volume-up"
                />
                <SettingRow
                  title="Voice Announcements"
                  subtitle="Audio narration during tours"
                  value={voiceAnnouncements}
                  onValueChange={setVoiceAnnouncements}
                  icon="microphone"
                />
                <SettingRow
                  title="Auto-play Audio"
                  subtitle="Automatically play tour audio"
                  value={autoPlay}
                  onValueChange={setAutoPlay}
                  icon="play"
                />
              </View>
            </CardContent>
          </Card>

          {/* App Preferences */}
          <Card>
            <CardContent>
              <Text className="text-lg font-semibold text-gray-900 mb-4">
                App Preferences
              </Text>
              
              <View className="space-y-1">
                <SelectionRow
                  title="Theme"
                  subtitle="Choose your preferred appearance"
                  value={theme}
                  options={['Light', 'Dark', 'Auto']}
                  onSelect={(value) => setTheme(value.toLowerCase() as 'light' | 'dark' | 'auto')}
                  icon="paint-brush"
                />
                <SelectionRow
                  title="Language"
                  subtitle="Select your preferred language"
                  value={language}
                  options={['English', 'Spanish', 'French', 'German', 'Chinese']}
                  onSelect={setLanguage}
                  icon="globe"
                />
                <SelectionRow
                  title="Units"
                  subtitle="Distance and measurement units"
                  value={units === 'metric' ? 'Metric (km)' : 'Imperial (mi)'}
                  options={['Metric (km)', 'Imperial (mi)']}
                  onSelect={(value) => setUnits(value.includes('Metric') ? 'metric' : 'imperial')}
                  icon="arrows-h"
                />
              </View>
            </CardContent>
          </Card>

        </ScrollView>
      </ScreenLayout>
    </View>
  );
} 