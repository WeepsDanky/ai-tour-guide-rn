import React, { useState } from 'react';
import { View, ImageBackground, Pressable, Alert, Text } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useCreateTour } from '@/features/create-tour/context/CreateTourContext';
import { LocationPill } from '@/ui/molecules/LocationPill';
import { TextArea } from '@/ui/atoms/TextArea';
import { Button } from '@/ui/atoms/Button';

export default function ConfirmPhotoScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { 
    photoUri, 
    locationLabel, 
    setLocationLabel, 
    preferencesText, 
    setPreferencesText,
    clearPhotoData 
  } = useCreateTour();

  const [localPreferences, setLocalPreferences] = useState(preferencesText);
  const [isLocationEditable, setIsLocationEditable] = useState(false);
  const [editedLocation, setEditedLocation] = useState(locationLabel);
  const [loading, setLoading] = useState(false);

  // Redirect if no photo
  React.useEffect(() => {
    if (!photoUri) {
      router.back();
    }
  }, []);

  const handleClose = () => {
    clearPhotoData();
    router.dismiss();
  };

  const handleRetake = () => {
    router.back();
  };

  const handleLocationEdit = () => {
    if (isLocationEditable) {
      // Save the edited location
      setLocationLabel(editedLocation);
      setIsLocationEditable(false);
    } else {
      // Enable editing
      setIsLocationEditable(true);
    }
  };

  const handleUsePhoto = async () => {
    console.log('[ConfirmPhoto] User confirmed photo, validating data...');
    console.log('[ConfirmPhoto] Location:', locationLabel);
    console.log('[ConfirmPhoto] Preferences:', localPreferences);
    console.log('[ConfirmPhoto] Photo URI:', photoUri);
    
    if (!locationLabel.trim()) {
      console.warn('[ConfirmPhoto] Location is missing or empty');
      Alert.alert('Location Required', 'Please ensure location is available to generate your tour.');
      return;
    }

    if (!photoUri) {
      console.warn('[ConfirmPhoto] Photo URI is missing');
      Alert.alert('Photo Required', 'Please capture or select a photo to generate your tour.');
      return;
    }

    try {
      setLoading(true);
      console.log('[ConfirmPhoto] Starting tour generation process...');
      
      // Save preferences to context
      setPreferencesText(localPreferences);
      console.log('[ConfirmPhoto] Preferences saved to context');
      
      // Navigate to progress screen
      console.log('[ConfirmPhoto] Navigating to progress screen');
      router.push('/create-photo/progress');
    } catch (error) {
      setLoading(false);
      console.error('[ConfirmPhoto] Failed to start tour generation:', error);
      Alert.alert('Error', 'Failed to start tour generation. Please try again.');
    }
  };

  if (!photoUri) {
    return null; // Will redirect in useEffect
  }

  return (
    <View className="flex-1 bg-black">
      <Stack.Screen 
        options={{ 
          title: '',
          headerShown: false,
          presentation: 'modal'
        }} 
      />

      {/* Photo Background */}
      <ImageBackground 
        source={{ uri: photoUri }}
        className="flex-1"
        resizeMode="contain"
      >
        {/* Header with close button */}
        <View 
          className="absolute top-0 left-0 right-0 flex-row justify-between items-center px-4 z-10"
          style={{ paddingTop: insets.top + 12 }}
        >
          <Pressable
            onPress={handleClose}
            className="w-10 h-10 items-center justify-center rounded-full bg-black/50"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <FontAwesome name="times" size={20} color="white" />
          </Pressable>
        </View>

        {/* Location Pill */}
        <View 
          className="absolute top-1/4 left-0 right-0 px-4 z-10"
        >
          <LocationPill
            location={editedLocation}
            editable={isLocationEditable}
            onEdit={handleLocationEdit}
            onChangeText={setEditedLocation}
            onPress={handleLocationEdit}
          />
        </View>

        {/* Bottom Section */}
        <View 
          className="absolute bottom-20 left-0 right-0 px-4 z-10"
          style={{ paddingBottom: insets.bottom }}
        >
          <View className="bg-white/90 backdrop-blur-sm rounded-lg p-4 mb-4">
            <TextArea
              value={localPreferences}
              onChangeText={setLocalPreferences}
              placeholder="Any personal preferences?&#10;Eg. Stories about the temple's history"
              rows={3}
              maxRows={6}
              autoGrow
              className="bg-transparent border-0 p-0 text-gray-900"
            />
          </View>

          {/* Action Buttons */}
          <View className="flex-row space-x-3">
            <View className="flex-1">
              <Button
                title="Retake"
                variant="secondary"
                onPress={handleRetake}
                className="bg-black/50 border-white/20"
              />
            </View>
            <View className="flex-1">
              <Button
                title={loading ? "Generating Tour..." : "Generate Tour"}
                variant="primary"
                onPress={handleUsePhoto}
                disabled={loading}
                className="bg-blue-500"
              />
            </View>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
}