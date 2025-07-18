import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useCreateTour } from '../../src/context/CreateTourContext';
import { Button } from '../../src/ui/atoms/Button';
import { ProgressIndicator } from '../../src/ui/atoms/ProgressIndicator';
import { LoadingIndicator } from '../../src/ui/atoms/LoadingIndicator';
import { mockTourGeneration, mockProgressCheck, TourGenerationTask } from '../../src/lib/mock-data';
import { TourRequest } from '~/types';

export default function TourProgressScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { 
    photoUri, 
    locationLabel,
    preferencesText,
    clearPhotoData 
  } = useCreateTour();

  const [generationTask, setGenerationTask] = useState<TourGenerationTask | null>(null);

  // Redirect if no photo
  useEffect(() => {
    if (!photoUri || !locationLabel) {
      router.back();
      return;
    }

    startTourGeneration();
  }, []);

  const startTourGeneration = async () => {
    try {
      const request: TourRequest = {
        location: locationLabel.trim(),
        photos: photoUri ? [photoUri] : [],
        preferences: preferencesText?.trim() || undefined,
      };

      // Start tour generation
      const { taskId } = await mockTourGeneration(request);
      pollGenerationProgress(taskId);
    } catch (error) {
      console.error('Failed to generate tour:', error);
      handleError('Failed to start tour generation');
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
          handleTourComplete(task.payload);
          return;
        }
        
        if (task.phase === 'error') {
          handleError(task.error || 'An error occurred during tour generation');
          return;
        }
        
        // Continue polling
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 2000);
        } else {
          handleError('Tour generation is taking longer than expected');
        }
      } catch (error) {
        console.error('Polling error:', error);
        handleError('Failed to check generation progress');
      }
    };
    
    poll();
  };

  const handleError = (message: string) => {
    router.back();
    // Add error handling UI/feedback here
  };

  const handleTourComplete = (tour: any) => {
    // Clear context data after successful generation
    clearPhotoData();
    
    // Navigate to map screen with the generated tour
    router.replace({
      pathname: '/map',
      params: { tourData: JSON.stringify(tour) }
    });
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <View className="flex-1 bg-white">
      <Stack.Screen 
        options={{ 
          title: 'Generating Tour',
          headerShown: false,
          presentation: 'fullScreenModal'
        }} 
      />

      <View 
        className="flex-1 justify-center px-6"
        style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
      >
        {generationTask ? (
          <View className="space-y-8">
            <ProgressIndicator
              progress={generationTask.progress}
              text={generationTask.message}
              size="large"
            />
            
            <View className="bg-gray-50 rounded-lg p-6">
              <Text className="text-base text-gray-600 text-center">
                We're creating your personalized tour experience. This may take a few moments...
              </Text>
            </View>

            <Button
              title="Cancel"
              onPress={handleCancel}
              variant="secondary"
              className="bg-gray-100"
            />
          </View>
        ) : (
          <LoadingIndicator text="Initializing..." />
        )}
      </View>
    </View>
  );
} 