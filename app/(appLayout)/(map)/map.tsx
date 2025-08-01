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
import { getTravelogueDetail } from '@/services/travelogue.service';
import { getRouteFromAmap } from '@/lib/map';
import { generateAndSaveNarration } from '@/services/audio-generation.service';
import { TravelogueDetail, POI } from '@/types';

export default function MapScreen() {
  const { travelogueId, tourId, tourData } = useLocalSearchParams<{ travelogueId?: string; tourId?: string; tourData?: string }>();
  const [travelogue, setTravelogue] = useState<TravelogueDetail | null>(null);
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [routeLoading, setRouteLoading] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const {tour, currentPOI, currentLocation, isLoading, error, showAudioPlayer, handleTourExit, handlePOISelect, handleAudioPlayerClose, handleShowAudioPlayer} = useTourPlayback({ travelogueId, tourId, tourData });

  // Load travelogue and plan route
  useEffect(() => {
    const loadTravelogueAndRoute = async () => {
      if (travelogueId) {
        setRouteLoading(true);
        try {
          const detail = await getTravelogueDetail(travelogueId);
          setTravelogue(detail);
          
          // Parse tourData JSON to get POIs
          if (detail.tourData) {
            const tourPlan = JSON.parse(detail.tourData);
            const pois = tourPlan.ordered_pois.map((poiId: string) => tourPlan.pois[poiId]);
            
            // Get route from AMap
            const route = await getRouteFromAmap(pois);
            setRouteCoords(route);
          }
        } catch (e) {
          console.error('Failed to load travelogue or plan route:', e);
        } finally {
          setRouteLoading(false);
        }
      }
    };
    loadTravelogueAndRoute();
  }, [travelogueId]);

   // 新增逻辑：处理从 progress 页面传来的 tourData
   useEffect(() => {
     const processNewTour = async () => {
       if (tourData && tourId) {
         try {
           setIsGeneratingAudio(true); // 显示正在生成语音
           const parsedTourData = JSON.parse(tourData as string);
           
           // 解析 POIs
           const tourPlan = JSON.parse(parsedTourData.tourData);
           const pois = tourPlan.ordered_pois.map((poiId: string) => tourPlan.pois[poiId]);
           
           // 并行生成所有 POI 的语音
           await Promise.all(pois.map((poi: POI) => generateAndSaveNarration(poi, tourId)));
           
           setIsGeneratingAudio(false); // 语音生成完毕
           // 此时可以刷新 travelogue 列表或直接使用
         } catch (e) {
           console.error('Failed to generate audio:', e);
           setIsGeneratingAudio(false);
         }
       }
     };
     processNewTour();
   }, [tourData, tourId]);
 
   // 在 UI 中根据 isGeneratingAudio 显示提示
   if (isGeneratingAudio) {
     return (
       <Container>
         <EmptyState icon="clock-o" title="正在为您生成语音讲解" description="请稍候..." />
       </Container>
     );
   }
 
   if (isLoading || routeLoading) {
    return (
      <Container>
        <EmptyState icon="clock-o" title="Loading Tour" description="Please wait while we load your tour..."/>
      </Container>
    );
  }
  
  // Show error only if there was an error AND tour/travelogue parameters were provided
  if (error && (travelogueId || tourId || tourData)) {
    return (
      <Container>
        <EmptyState icon="exclamation-triangle" title="Unable to Load Tour" description={error} actionText="Go Back" onAction={handleTourExit} />
      </Container>
    );
  }

  // Create enhanced tour with route data
  const enhancedTour = tour && routeCoords.length > 0 ? {
    ...tour,
    route: routeCoords
  } : tour;

  return (
    <View className="flex-1 bg-white">
      <View className="flex-1 relative">
        {enhancedTour && <TourInfoDropdown tour={enhancedTour} />}
        <TourMap tour={enhancedTour} currentPOI={currentPOI} onPOISelect={handlePOISelect} />
        {tour && !showAudioPlayer && (
          <AudioPlayerButton
            onPress={handleShowAudioPlayer}
            style={{ position: 'absolute', bottom: 16, right: 16, width: 56, height: 56, zIndex: 10 }}
            iconSize={24}
            iconColor="white"
          />
        )}
      </View>
      {tour && showAudioPlayer && (
        <AudioPlayer 
          tour={enhancedTour || tour} 
          currentLocation={currentLocation}
          onClose={handleAudioPlayerClose} 
        />
      )}
    </View>
  );
}