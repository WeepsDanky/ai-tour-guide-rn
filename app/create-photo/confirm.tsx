import React, { useState } from 'react';
import { View, Text, ImageBackground, Pressable, ScrollView, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useCreateTour } from '../../src/context/CreateTourContext';
import { LocationPill } from '../../src/ui/molecules/LocationPill';
import { TextArea } from '../../src/ui/atoms/TextArea';
import { Button } from '../../src/ui/atoms/Button';
import { Modal, ModalContent, ModalFooter } from '../../src/ui/molecules/Modal';
import { ProgressIndicator } from '../../src/ui/atoms/ProgressIndicator';
import { LoadingIndicator } from '../../src/ui/atoms/LoadingIndicator';
import { mockTourGeneration, mockProgressCheck, TourGenerationTask } from '../../src/lib/mock-data';
import { TourRequest } from '~/types';

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
  
  // Tour generation state
  const [loading, setLoading] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [generationTask, setGenerationTask] = useState<TourGenerationTask | null>(null);

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
    if (!locationLabel.trim()) {
      Alert.alert('Location Required', 'Please ensure location is available to generate your tour.');
      return;
    }

    try {
      setLoading(true);
      
      // Save preferences to context
      setPreferencesText(localPreferences);
      
      const request: TourRequest = {
        location: locationLabel.trim(),
        photos: photoUri ? [photoUri] : [],
        preferences: localPreferences.trim() || undefined,
      };

      // Start tour generation
      const { taskId } = await mockTourGeneration(request);
      
      // Show progress modal and start polling
      setShowProgressModal(true);
      setLoading(false);
      
      pollGenerationProgress(taskId);
      
    } catch (error) {
      setLoading(false);
      console.error('Failed to generate tour:', error);
      Alert.alert('Error', 'Failed to start tour generation. Please try again.');
    }
  };

  const pollGenerationProgress = async (taskId: string) => {
    let attempts = 0;
    const maxAttempts = 30; // 1 minute with 2-second intervals
    
    const poll = async () => {
      try {
        const task = await mockProgressCheck(taskId);
        setGenerationTask(task);
        
        if (task.phase === 'audio_ready' && task.payload) {
          // Tour generation complete
          setShowProgressModal(false);
          Alert.alert(
            'Tour Ready!',
            'Your personalized tour has been generated successfully.',
            [
              { text: 'View Tour', onPress: () => handleTourComplete(task.payload!) },
              { text: 'Later', style: 'cancel', onPress: () => router.dismiss(2) }
            ]
          );
          return;
        }
        
        if (task.phase === 'error') {
          setShowProgressModal(false);
          Alert.alert('Generation Failed', task.error || 'An error occurred during tour generation.');
          return;
        }
        
        // Continue polling
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 2000);
        } else {
          setShowProgressModal(false);
          Alert.alert('Timeout', 'Tour generation is taking longer than expected. Please try again.');
        }
      } catch (error) {
        console.error('Polling error:', error);
        setShowProgressModal(false);
        Alert.alert('Error', 'Failed to check generation progress.');
      }
    };
    
    poll();
  };

  const handleTourComplete = (tour: any) => {
    // Clear context data after successful generation
    clearPhotoData();
    
    // Navigate to map screen with the generated tour
    router.dismiss();
    setTimeout(() => {
      router.push({
        pathname: '/map',
        params: { tourData: JSON.stringify(tour) }
      });
    }, 100);
  };

  const closeProgressModal = () => {
    setShowProgressModal(false);
    setGenerationTask(null);
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
          className="absolute top-0 left-0 right-0 items-center z-10"
          style={{ paddingTop: insets.top + 60 }}
        >
          {isLocationEditable ? (
            <View className="bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 flex-row items-center shadow-md border border-white/20">
              <FontAwesome name="map-marker" size={14} color="#374151" style={{ marginRight: 6 }} />
              <TextArea
                value={editedLocation}
                onChangeText={setEditedLocation}
                className="text-gray-700 text-sm font-medium max-w-[200px] border-0 p-0"
                rows={1}
                onBlur={handleLocationEdit}
                autoFocus
              />
            </View>
          ) : (
            <LocationPill 
              location={locationLabel}
              onPress={handleLocationEdit}
            />
          )}
        </View>

        {/* Preferences Input (bottom overlay) */}
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

      {/* Progress Modal */}
      <Modal
        isVisible={showProgressModal}
        onClose={closeProgressModal}
        title="Generating Your Tour"
        size="medium"
        showCloseButton={false}
      >
        <ModalContent>
          {generationTask ? (
            <View className="space-y-4">
              <ProgressIndicator
                progress={generationTask.progress}
                text={generationTask.message}
                size="large"
              />
              
              <View className="bg-gray-50 rounded-lg p-4">
                <Text className="text-sm text-gray-600 text-center">
                  This may take a few moments while we create your personalized tour...
                </Text>
              </View>
            </View>
          ) : (
            <LoadingIndicator text="Initializing..." />
          )}
        </ModalContent>
        
        <ModalFooter>
          <Button
            title="Cancel"
            onPress={closeProgressModal}
            className="bg-gray-200 text-gray-700"
          />
        </ModalFooter>
      </Modal>
    </View>
  );
} 