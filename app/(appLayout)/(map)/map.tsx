// app/(appLayout)/(map)/map.tsx
import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Container } from '@/ui/atoms/Container';
import { TourMap } from '@/features/tour-player/components/TourMap';
import { TourInfoDropdown } from '@/features/tour-player/components/TourInfoDropdown';
import { AudioPlayer } from '~/src/features/AudioPlayer';
import { EmptyState } from '@/ui/molecules/EmptyState';
import { useTourPlayback } from '@/features/tour-player/hooks/useTourPlayback';
import { AudioPlayerButton } from '~/src/features/AudioPlayer/components/AudioPlayerButton';
import { getRouteFromAmap } from '@/lib/map';
import { generateAndSaveNarration } from '@/services/audio-generation.service';
import { POI } from '@/types'; // Removed TravelogueDetail import as useTourPlayback handles it

export default function MapScreen() {
  const { travelogueId, tourId, tourData } = useLocalSearchParams<{ travelogueId?: string; tourId?: string; tourData?: string }>();
  
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [routeLoading, setRouteLoading] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  
  // useTourPlayback already provides the full `tour` object with `pois` and `route`
  const {tour, currentPOI, currentLocation, isLoading, error, showAudioPlayer, handleTourExit, handlePOISelect, handleAudioPlayerClose, handleShowAudioPlayer} = useTourPlayback({ travelogueId, tourId, tourData });

  // This useEffect is now solely responsible for ensuring `routeCoords` state is updated
  // from `tour.route` provided by `useTourPlayback`, or attempting to fetch route if missing.
  useEffect(() => {
    const loadRoute = async () => {
      // Only attempt to load route if `tour` exists, has POIs, and its route is not already set
      if (tour?.pois && tour.pois.length > 1 && !tour.route && !routeCoords.length) {
        setRouteLoading(true);
        try {
          // Filter out POIs with invalid coordinates before attempting AMap route planning
          const validPoisForRoute = tour.pois.filter(p => p.coord.lat !== 0 || p.coord.lng !== 0);

          if (validPoisForRoute.length >= 2) { // getRouteFromAmap requires at least 2 points
            const route = await getRouteFromAmap(validPoisForRoute);
            setRouteCoords(route);
          } else {
              console.warn("Not enough valid POIs with coordinates to plan a route from map.tsx.");
              setRouteCoords([]);
          }
        } catch (e) {
          console.error('Failed to plan route from AMap:', e);
        } finally {
          setRouteLoading(false);
        }
      } else if (tour?.route && !routeCoords.length) {
        // If tour.route is provided by useTourPlayback, update local state
        setRouteCoords(tour.route);
      }
    };
    loadRoute();
  }, [tour, routeCoords.length]); // Depend on `tour` to trigger route loading, and routeCoords length to prevent infinite loop

   // New logic: Process audio generation when tourData param is present (from create-photo flow)
   useEffect(() => {
     const processNewTourAudio = async () => {
       if (tourData && tourId) {
         try {
           setIsGeneratingAudio(true);
           // tourData param is stringified TourDataResponse
           const parsedTourDataResponse = JSON.parse(tourData as string);
           // tourPlan field inside is a JSON string, needs another parse
           const tourPlanString = parsedTourDataResponse.tourPlan;
           const tourPlan = JSON.parse(tourPlanString); // This is the actual tour plan object

           // POIs from AI-generated tour might not have full coords/description ready
           // Assume tourPlan.pois[poiId] *does* have `description` or similar for narration.
           const poisForAudioGeneration: POI[] = tourPlan.ordered_pois.map((poiId: string) => {
             const poiRaw = tourPlan.pois[poiId]; // Raw POI data from AI generation
             return {
               id: poiId,
               name: poiRaw.name || poiId,
               coord: { lat: poiRaw.latitude || 0, lng: poiRaw.longitude || 0 }, // May be 0,0 initially
               description: poiRaw.originalNarrative || poiRaw.description, // Get description for narration
               image_url: poiRaw.imageUrl,
             };
           }).filter(p => p.description); // Only generate audio for POIs with a description

           if (poisForAudioGeneration.length > 0) {
             console.log('[MapScreen] Starting audio generation for new tour POIs...');
             await Promise.all(
               poisForAudioGeneration.map((poi: POI) => generateAndSaveNarration(poi, tourId as string))
             );
             console.log('[MapScreen] All audio generated and saved.');
           } else {
             console.warn('[MapScreen] No POIs with description found for audio generation.');
           }
         } catch (e) {
           console.error('Failed to generate audio for new tour:', e);
         } finally {
           setIsGeneratingAudio(false);
         }
       }
     };
     processNewTourAudio();
   }, [tourData, tourId]);

   // Handle loading and error states for the entire screen
    if (isLoading || routeLoading) {
     return (
       <Container>
         <EmptyState icon="clock-o" title="Loading Tour" description="Please wait while we load your tour..."/>
       </Container>
     );
   }
   
   if (error && (travelogueId || tourId || tourData)) {
     return (
       <Container>
         <EmptyState icon="exclamation-triangle" title="Unable to Load Tour" description={error} actionText="Go Back" onAction={handleTourExit} />
       </Container>
     );
   }

   // Create enhanced tour with route data (prioritize tour.route if available)
   const finalRoute = tour?.route || routeCoords; // Use tour.route if already present, otherwise local state
   const enhancedTour = tour ? { ...tour, route: finalRoute } : null;

   return (
     <View className="flex-1 bg-white">
       {/* ... Stack.Screen and other view elements */}
       <View className="flex-1 relative">
         {enhancedTour && <TourInfoDropdown tour={enhancedTour} />}
         {enhancedTour && <TourMap tour={enhancedTour} currentPOI={currentPOI} onPOISelect={handlePOISelect} />}
         {enhancedTour && !showAudioPlayer && (
           <AudioPlayerButton
             onPress={handleShowAudioPlayer}
             style={{ position: 'absolute', bottom: 16, right: 16, width: 56, height: 56, zIndex: 10 }}
             iconSize={24}
             iconColor="white"
           />
         )}
       </View>
       {enhancedTour && showAudioPlayer && (
         <AudioPlayer
           tour={enhancedTour}
           currentLocation={currentLocation}
           onClose={handleAudioPlayerClose}
         />
       )}
     </View>
   );
}