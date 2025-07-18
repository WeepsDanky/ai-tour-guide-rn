import React, { useEffect, useRef, useState } from 'react';
import { View, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { Container } from '../src/ui/atoms/Container';
import { TourMap } from '../src/features/tour-player/components/TourMap';
import { TourInfoDropdown } from '../src/features/tour-player/components/TourInfoDropdown';
import { EmptyState } from '../src/ui/molecules/EmptyState';
import { Tour, POI } from '~/types';
import { getTourById } from '@/services/tour.service';

// ---- Navigation options ----
// Putting this at the module level avoids re‑creating navigation options on each render,
// preventing React Navigation from remounting the screen.
export const navigationOptions = {
  headerShown: false,
};

export default function MapScreen() {
  // ----------------- Router params & navigation  -----------------
  const { tourId, tourData } = useLocalSearchParams<{ tourId?: string; tourData?: string }>();
  const router = useRouter();

  // ----------------- Component state -----------------
  const [tour, setTour] = useState<Tour | null>(null);
  const [currentPOI, setCurrentPOI] = useState<POI | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Guard flag stored in a ref so changing it **won't** trigger a rerender
  // and therefore will never appear in the dependency array.
  const hasFetchedRef = useRef(false);

  // ----------------- Debug logs for mount / unmount -----------------
  // useEffect(() => {
  //   console.log('🟢 MapScreen mounted');
  //   return () => {
  //     console.log('🔴 MapScreen unmounted');
  //   };
  // }, []);

  // ----------------- Data loading -----------------
  useEffect(() => {
    if ((tourId || tourData) && !hasFetchedRef.current) {
      // Mark as fetched BEFORE the async call starts to avoid race‑condition loops
      hasFetchedRef.current = true;
      // console.log('[MapScreen] Starting loadTour', { tourId, tourData });

      const loadTour = async () => {
        setIsLoading(true);
        setError(null);
        try {
          let loadedTour: Tour | null = null;

          if (tourData) {
            // console.log('[MapScreen] Using tourData param');
            loadedTour = JSON.parse(tourData as string);
          } else if (tourId) {
            // console.log('[MapScreen] Fetching tour by ID', tourId);
            loadedTour = await getTourById(tourId as string);
          }

          if (!loadedTour) {
            throw new Error('No tour specified or found.');
          }

          // console.log('[MapScreen] Tour loaded ✓', loadedTour);
          setTour(loadedTour);
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Failed to load tour data';
          // console.error('[MapScreen] Load error:', message); 
          setError(message);
        } finally {
          setIsLoading(false);
        }
      };

      loadTour();
    }
  }, [tourId, tourData]);

  // ----------------- Handlers -----------------
  const handleTourExit = () => {
    // console.log('[MapScreen] Exit pressed, router.back()');
    router.back();
  };

  // ----------------- Render -----------------
  if (isLoading) {
    return (
      <Container>
        <EmptyState
          icon="clock-o"
          title="Loading Tour"
          description="Please wait while we load your tour..."
        />
      </Container>
    );
  }

  if (error || !tour) {
    return (
      <Container>
        <EmptyState
          icon="exclamation-triangle"
          title="Unable to Load Tour"
          description={error || 'The requested tour could not be found.'}
          actionText="Go Back"
          onAction={handleTourExit}
        />
      </Container>
    );
  }

  return (
    <View className="flex-1 bg-white">
      {/* Main Map View */}
      <View className="flex-1 relative">
        <TourInfoDropdown tour={tour} />
        <TourMap tour={tour} currentPOI={currentPOI} onPOISelect={setCurrentPOI} />

        <Pressable
          onPress={handleTourExit}
          className="absolute top-12 left-4 w-10 h-10 items-center justify-center rounded-full bg-white shadow-lg z-10"
        >
          <FontAwesome name="arrow-left" size={20} color="#374151" />
        </Pressable>
      </View>
    </View>
  );
}
