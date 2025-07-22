import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useCreateTour } from '@/features/create-tour/context/CreateTourContext';
import { Button } from '@/ui/atoms/Button';
import { ProgressIndicator } from '@/ui/atoms/ProgressIndicator';
import { LoadingIndicator } from '@/ui/atoms/LoadingIndicator';
import { createTour, checkTourCreationProgress } from '@/services/tour.service';
import type { TourGenerationTask, TourRequest } from '@/types';

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
      const { taskId } = await createTour(request);
      pollGenerationProgress(taskId);
    } catch (error) {
      console.error('Failed to generate tour:', error);
      handleError('Failed to start tour generation');
    }
  };

  const pollGenerationProgress = async (taskId: string) => {
    try {
      const poll = async () => {
        try {
          const task: TourGenerationTask = await checkTourCreationProgress(taskId);
          setGenerationTask(task);
          if (task.phase === 'audio_ready' && task.payload) {
            handleTourComplete(task.payload);
          } else if (task.phase === 'error') {
            handleError(task.error || 'Tour generation failed');
          } else {
            setTimeout(poll, 1500);
          }
        } catch (error) {
          console.error('Polling error:', error);
          handleError('Failed to poll tour generation progress');
        }
      };
      poll();
    } catch (error) {
      console.error('Failed to start polling:', error);
      handleError('Failed to start polling tour generation progress');
    }
  };

  const handleError = (message: string) => {
    router.back();
    // Add error handling UI/feedback here
  };

  const handleTourComplete = (tour: any) => {
    // Clear context data after successful generation
    clearPhotoData();
    
    // Navigate to map screen with the generated tour in full screen mode
    router.push({
      pathname: '/(appLayout)/(map)/map',
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
                We&apos;re creating your personalized tour experience. This may take a few moments...
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