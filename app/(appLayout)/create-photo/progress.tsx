import React, { useState, useEffect } from 'react';
import { View, Text, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useCreateTour } from '@/features/create-tour/context/CreateTourContext';
import { Button } from '@/ui/atoms/Button';
import { ProgressIndicator } from '@/ui/atoms/ProgressIndicator';
import { LoadingIndicator } from '@/ui/atoms/LoadingIndicator';
import { createTour, checkTourGenerationStatus } from '@/services/tour.service';
import type { TourGenerationTask, TourRequest, TourGenerationStatusResponse } from '@/types';

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
  const [tourUid, setTourUid] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  // Redirect if no photo
  useEffect(() => {
    if (!photoUri || !locationLabel) {
      console.log('[TourProgress] Missing required data - photoUri:', !!photoUri, 'locationLabel:', !!locationLabel);
      router.back();
      return;
    }

    console.log('[TourProgress] Starting tour generation process...');
    startTourGeneration();
  }, []);

  const startTourGeneration = async () => {
    try {
      const request: TourRequest = {
        location: locationLabel.trim(),
        photos: photoUri ? [photoUri] : [],
        preferences: preferencesText?.trim() || undefined,
      };
      
      console.log('[TourProgress] Sending tour generation request:', request);
      
      // Start tour generation
      const statusResponse: TourGenerationStatusResponse = await createTour(request);
      console.log('[TourProgress] Tour generation started:', statusResponse);
      
      setTourUid(statusResponse.tourUid);
      pollGenerationProgress(statusResponse.tourUid);
    } catch (error) {
      console.error('[TourProgress] Failed to generate tour:', error);
      handleError('Failed to start tour generation: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const pollGenerationProgress = async (tourUid: string) => {
    if (isPolling) {
      console.log('[TourProgress] Polling already in progress, skipping...');
      return;
    }
    
    setIsPolling(true);
    console.log('[TourProgress] Starting to poll tour generation progress for UID:', tourUid);
    
    try {
      const poll = async () => {
        try {
          console.log('[TourProgress] Polling status for tour UID:', tourUid);
          const task: TourGenerationTask = await checkTourGenerationStatus(tourUid);
          console.log('[TourProgress] Received task status:', task);
          
          setGenerationTask(task);
          
          if (task.status === 'COMPLETED' && task.tourData) {
            console.log('[TourProgress] Tour generation completed successfully');
            setIsPolling(false);
            handleTourComplete(task.tourData);
          } else if (task.status === 'FAILED') {
            console.error('[TourProgress] Tour generation failed:', task.error);
            setIsPolling(false);
            handleError(task.error || 'Tour generation failed');
          } else {
            console.log('[TourProgress] Tour still generating, polling again in 2 seconds...');
            setTimeout(poll, 2000);
          }
        } catch (error) {
          console.error('[TourProgress] Polling error:', error);
          setIsPolling(false);
          handleError('Failed to poll tour generation progress: ' + (error instanceof Error ? error.message : 'Unknown error'));
        }
      };
      poll();
    } catch (error) {
      console.error('[TourProgress] Failed to start polling:', error);
      setIsPolling(false);
      handleError('Failed to start polling tour generation progress: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleError = (message: string) => {
    console.error('[TourProgress] Handling error:', message);
    Alert.alert(
      'Tour Generation Failed',
      message,
      [
        {
          text: 'OK',
          onPress: () => {
            console.log('[TourProgress] User acknowledged error, going back');
            router.back();
          }
        }
      ]
    );
  };

  const handleTourComplete = (tourData: any) => {
    console.log('[TourProgress] Tour generation completed, navigating to map with data:', tourData);
    
    // Clear context data after successful generation
    clearPhotoData();
    
    // Navigate to map screen with the generated tour in full screen mode
    router.push({
      pathname: '/(appLayout)/(map)/map',
      params: { 
        tourUid: tourUid,
        tourData: JSON.stringify(tourData) 
      }
    });
  };

  const handleCancel = () => {
    console.log('[TourProgress] User cancelled tour generation');
    setIsPolling(false);
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
              text={generationTask.message || getStatusMessage(generationTask.status)}
              size="large"
            />
            
            <View className="bg-gray-50 rounded-lg p-6">
              <Text className="text-base text-gray-600 text-center">
                We&apos;re creating your personalized tour experience. This may take a few moments...
              </Text>
              {__DEV__ && (
                <View className="mt-4 p-3 bg-gray-100 rounded">
                  <Text className="text-xs text-gray-500 font-mono">
                    Debug Info:{"\n"}
                    Tour UID: {tourUid}{"\n"}
                    Status: {generationTask.status}{"\n"}
                    Progress: {generationTask.progress}%{"\n"}
                    Workflow ID: {generationTask.workflowRunId}
                  </Text>
                </View>
              )}
            </View>

            <Button
              title="Cancel"
              onPress={handleCancel}
              variant="secondary"
              className="bg-gray-100"
            />
          </View>
        ) : (
          <LoadingIndicator text="Initializing tour generation..." />
        )}
      </View>
    </View>
  );
}

// Helper function to get user-friendly status messages
function getStatusMessage(status: string): string {
  switch (status) {
    case 'PENDING':
      return 'Preparing your tour request...';
    case 'GENERATING':
      return 'AI is crafting your personalized tour...';
    case 'COMPLETED':
      return 'Tour generation completed!';
    case 'FAILED':
      return 'Tour generation failed';
    default:
      return 'Processing your request...';
  }
}