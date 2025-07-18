import React, { useState, useEffect } from 'react';
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
  const [tour, setTour] = useState<Tour | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    loadTour();
  }, [tourId, tourData]);

  const loadTour = async () => {
    try {
      setLoading(true);
      setError(null);

      if (tourData) {
        // Parse tour data from navigation params (from tour creation)
        const parsedTour = JSON.parse(tourData);
        setTour(parsedTour);
      } else if (tourId) {
        // Load tour by ID from mock data
        const mockTours = getMockTours();
        const foundTour = mockTours.find(t => t.id === tourId);
        
        if (foundTour) {
          setTour(foundTour);
        } else {
          setError('Tour not found');
        }
      } else {
        // No tour specified, load the first mock tour as default
        const mockTours = getMockTours();
        if (mockTours.length > 0) {
          setTour(mockTours[0]);
        } else {
          setError('No tours available');
        }
      }
    } catch (error) {
      console.error('Failed to load tour:', error);
      setError('Failed to load tour data');
    } finally {
      setLoading(false);
    }
  };

  const handleTourComplete = () => {
    Alert.alert(
      'Tour Completed!',
      'Congratulations on completing your tour! How was your experience?',
      [
        { 
          text: 'Rate Tour', 
          onPress: () => {
            // TODO: Navigate to rating screen
            router.back();
          }
        },
        { 
          text: 'Finish', 
          onPress: () => router.back(),
          style: 'default'
        }
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
          onPress: () => router.back()
        }
      ]
    );
  };

  if (loading) {
    return (
      <Container>
        <Stack.Screen options={{ title: 'Loading Tour...', headerShown: false }} />
        <LoadingIndicator 
          variant="fullscreen" 
          text="Loading your tour..." 
          size="large"
        />
      </Container>
    );
  }

  if (error || !tour) {
    return (
      <Container>
        <Stack.Screen options={{ title: 'Tour Map' }} />
        <EmptyState
          icon="exclamation-triangle"
          title="Unable to Load Tour"
          description={error || 'The requested tour could not be found.'}
          actionText="Go Back"
          onAction={() => router.back()}
        />
      </Container>
    );
  }

  return (
    <View className="flex-1">
      <Stack.Screen 
        options={{ 
          title: tour.title,
          headerShown: false // TourPlayer will handle its own header
        }} 
      />
      
      <TourPlayer
        tour={tour}
        onComplete={handleTourComplete}
        onExit={handleTourExit}
      />
    </View>
  );
} 