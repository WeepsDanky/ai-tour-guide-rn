import React, { useState } from 'react';
import { View, ImageBackground, Pressable, Alert, Text } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useCreateTour } from '@/features/create-tour/context/CreateTourContext';
import { LocationPill } from '@/ui/molecules/LocationPill';

import { Button } from '@/ui/atoms/Button';
import { useChat } from '@/features/tour-chat/hooks/useChat';

export default function ConfirmPhotoScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { 
    photoUri, 
    locationLabel, 
    setLocationLabel, 
    clearPhotoData 
  } = useCreateTour();
  const { sendPhoto } = useChat();


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
    if (!editedLocation.trim()) {
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
      // Send photo to chat with location
      await sendPhoto(photoUri, locationLabel.trim(), undefined);
      
      // Close all modal screens and return to the full-screen chat interface
      router.dismissAll();
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
      >
        {/* Header with close button */}
        <View 
          className="absolute top-0 left-0 right-0 flex-row justify-between items-center px-4 z-10"
          style={{ paddingTop: 10 }}
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
          className="absolute top-safe left-0 right-0 px-4 z-10"
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
          className="absolute bottom-0 left-0 right-0 backdrop-blur-sm z-10"
          style={{ paddingBottom: insets.bottom + 20, paddingTop: 20 }}
        >
          {/* Action Buttons */}
          <View className="flex-row gap-4 px-6">
            <View className="flex-1">
              <Button
                title="Retake"
                variant="outline"
                size="large"
                onPress={handleRetake}
                className="border-white/60 bg-white/10"
              />
            </View>
            <View className="flex-1">
              <Button
                title={loading ? "Generating Tour..." : "Generate Tour"}
                variant="primary"
                size="large"
                onPress={handleUsePhoto}
                disabled={loading}
                loading={loading}
              />
            </View>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
}