import React, { useState, useEffect } from 'react';
import { View, Text, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useCreateTour } from '@/features/create-tour/context/CreateTourContext';
import { Button } from '@/ui/atoms/Button';
import { ProgressIndicator } from '@/ui/atoms/ProgressIndicator';
import { LoadingIndicator } from '@/ui/atoms/LoadingIndicator';
import { createTour, checkTourGenerationStatus, getTourByUid } from '@/services/tour.service';
import { getMyTravelogues } from '@/services/travelogue.service';
import { generateAndSaveNarration } from '@/services/audio-generation.service'; // 新增 import
import type { TourGenerationTask, TourRequest, TourGenerationStatusResponse, TourDataResponse } from '@/types';

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
          
          // --- 关键修复点 ---
          // 1. 只检查 status 是否为 COMPLETED
          if (task.status === 'COMPLETED') {
            console.log('[TourProgress] Tour generation completed. Fetching final tour data...');
            setIsPolling(false);
            
            // 2. 额外调用 getTourByUid 获取完整数据
            const finalTourData = await getTourByUid(tourUid);
            if (finalTourData && finalTourData.tourPlan) {
              handleTourComplete(tourUid, finalTourData);
            } else {
              // 如果获取最终数据失败，则报错
              handleError('Tour completed, but failed to retrieve the final tour plan.');
            }
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

  const handleTourComplete = async (completedTourUid: string, tourData: TourDataResponse) => {
    console.log('[TourProgress] Tour generation and data fetch completed, navigating to map...');
    
    // 确保 tourUid 存在
    if (!completedTourUid) {
      console.error('[TourProgress] tourUid is null, cannot navigate to map');
      handleError('Tour ID is missing, cannot proceed to map');
      return;
    }

    console.log('[TourProgress] Fetching user travelogues to find the new one...');
    try {
      const traveloguesResponse = await getMyTravelogues();

      // 后端返回的 travelogue 列表是按创建时间倒序的，所以第一个就是最新的
            if (traveloguesResponse && traveloguesResponse.content && traveloguesResponse.content.length > 0) {
                const newTravelogueId = traveloguesResponse.content[0].uid;
        console.log(`[TourProgress] Found new travelogueId: ${newTravelogueId}. Navigating to map...`);

        // 清理上下文数据
        clearPhotoData();

        // 使用 newTravelogueId 导航到地图页
        router.replace({
          pathname: '/(appLayout)/(map)/map',
          params: {
            travelogueId: newTravelogueId
          }
        });
      } else {
        throw new Error("No travelogues found after creation.");
      }
    } catch (error) {
      console.error('[TourProgress] Failed to fetch new travelogue:', error);
      handleError("Could not find the newly created journey. Please check your journeys list.");
    }
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