import React, { useState } from 'react';
import { View, Alert } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Container } from '../src/ui/atoms/Container';
import { TourPlayer } from '../src/features/tour-player/components/TourPlayer';
import { LoadingIndicator } from '../src/ui/atoms/LoadingIndicator';
import { EmptyState } from '../src/ui/molecules/EmptyState';
import { Tour } from '~/types';
import { getMockTours } from '../src/lib/mock-data';

export default function MapScreen() {
  const { tourId, tourData } = useLocalSearchParams<{
    tourId?: string;
    tourData?: string;
  }>();
  const router = useRouter();

  let tour: Tour | null = null;
  let error: string | null = null;

  try {
    if (tourData) {
      tour = JSON.parse(tourData);
    } else if (tourId) {
      const mockTours = getMockTours();
      const foundTour = mockTours.find((t) => t.id === tourId);
      if (!foundTour) {
        error = 'Tour not found';
      } else {
        tour = foundTour;
      }
    } else {
      const mockTours = getMockTours();
      tour = mockTours.length > 0 ? mockTours[0] : null;
      if (!tour) {
        error = 'No tours available';
      }
    }
  } catch (e) {
    console.error('Failed to load tour:', e);
    error = e instanceof Error ? e.message : 'Failed to load tour data';
  }

  const handleTourComplete = () => {
    Alert.alert(
      'Tour Completed!',
      'Congratulations on completing your tour! How was your experience?',
      [
        {
          text: 'Rate Tour',
          onPress: () => {
            router.back();
          },
        },
        {
          text: 'Finish',
          onPress: () => router.back(),
          style: 'default',
        },
      ]
    );
  };

  const handleTourExit = () => {
    Alert.alert(
      'Exit Tour?',
      'Are you sure you want to exit the current tour? Your progress will be saved.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Exit',
          style: 'destructive',
          onPress: () => router.back(),
        },
      ]
    );
  };

  // Conditionally select the content to render
  let content;
  if (error || !tour) {
    content = (
      <Container>
        <EmptyState
          icon="exclamation-triangle"
          title="Unable to Load Tour"
          description={error || 'The requested tour could not be found.'}
          actionText="Go Back"
          onAction={() => router.back()}
        />
      </Container>
    );
  } else {
    content = (
      <TourPlayer tour={tour} onComplete={handleTourComplete} onExit={handleTourExit} />
    );
  }

  // Always return the same JSX structure
  return (
    <View className="flex-1">
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      {content}
    </View>
  );
} 