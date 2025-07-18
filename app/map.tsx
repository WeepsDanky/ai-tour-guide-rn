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
import { getAllTours, getTourById } from '@/services/tour.service';

export default function MapScreen() {
  const { tourId, tourData } = useLocalSearchParams<{
    tourId?: string;
    tourData?: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [currentPOI, setCurrentPOI] = React.useState<POI | null>(null);
  const [tour, setTour] = React.useState<Tour | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Load tour data on mount
  React.useEffect(() => {
    const loadTour = async () => {
      try {
        setLoading(true);
        setError(null);

        if (tourData) {
          // Tour data passed directly
          const parsedTour = JSON.parse(tourData);
          setTour(parsedTour);
        } else if (tourId) {
          // Load specific tour by ID
          const foundTour = await getTourById(tourId);
          if (!foundTour) {
            setError('Tour not found');
          } else {
            setTour(foundTour);
          }
        } else {
          // Load first available tour
          const tours = await getAllTours();
          const defaultTour = tours.length > 0 ? tours[0] : null;
          if (!defaultTour) {
            setError('No tours available');
          } else {
            setTour(defaultTour);
          }
        }
      } catch (e) {
        console.error('Failed to load tour:', e);
        setError(e instanceof Error ? e.message : 'Failed to load tour data');
      } finally {
        setLoading(false);
      }
    };

    loadTour();
  }, [tourId, tourData]);

  const handleTourExit = () => {
    router.back();
  };

  const handlePOISelect = (poi: POI) => {
    setCurrentPOI(poi);
  };

  // Conditionally select the content to render
  let content;
  if (loading) {
    content = (
      <Container>
        <EmptyState
          icon="clock-o"
          title="Loading Tour"
          description="Please wait while we load your tour..."
        />
      </Container>
    );
  } else if (error || !tour) {
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