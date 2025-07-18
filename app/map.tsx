import React from 'react';
import { View, Pressable } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Container } from '../src/ui/atoms/Container';
import { TourMap } from '../src/features/tour-player/components/TourMap';
import { TourInfoDropdown } from '../src/features/tour-player/components/TourInfoDropdown';
import { EmptyState } from '../src/ui/molecules/EmptyState';
import { Tour, POI } from '~/types';
import { getMockTours } from '../src/lib/mock-data';

export default function MapScreen() {
  const { tourId, tourData } = useLocalSearchParams<{
    tourId?: string;
    tourData?: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [currentPOI, setCurrentPOI] = React.useState<POI | null>(null);

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

  const handleTourExit = () => {
    router.back();
  };

  const handlePOISelect = (poi: POI) => {
    setCurrentPOI(poi);
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
      <View className="flex-1">
        {/* Full screen map with dropdown */}
        <View className="flex-1 relative">
          <View className="absolute inset-0">
            <View className="flex-1">
              {/* Tour Info Dropdown */}
              <TourInfoDropdown tour={tour} />
              
              {/* Map */}
              <View className="flex-1">
                <TourMap 
                  tour={tour} 
                  currentPOI={currentPOI}
                  onPOISelect={handlePOISelect}
                />
              </View>
            </View>
          </View>
          
          {/* Exit button */}
          <Pressable
            onPress={handleTourExit}
            className="absolute left-4 w-10 h-10 items-center justify-center rounded-full bg-white shadow-lg z-10"
            style={{ top: 50 }}
          >
            <FontAwesome name="arrow-left" size={20} color="#374151" />
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      {content}
    </View>
  );
} 