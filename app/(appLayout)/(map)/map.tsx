import React from 'react';
import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Container } from '@/ui/atoms/Container';
import { TourMap } from '@/features/tour-player/components/TourMap';
import { TourInfoDropdown } from '@/features/tour-player/components/TourInfoDropdown';
import { AudioPlayer } from '~/src/features/AudioPlayer';
import { EmptyState } from '@/ui/molecules/EmptyState';
import { useTourPlayback } from '@/features/tour-player/hooks/useTourPlayback';
import { AudioPlayerButton } from '~/src/features/AudioPlayer/components/AudioPlayerButton';

export default function MapScreen() {
  const { tourId, tourData } = useLocalSearchParams<{ tourId?: string; tourData?: string }>();
  const {tour, currentPOI, currentLocation, isLoading, error, showAudioPlayer, handleTourExit, handlePOISelect, handleAudioPlayerClose, handleShowAudioPlayer} = useTourPlayback({ tourId, tourData });

  if (isLoading) {
    return (
      <Container>
        <EmptyState icon="clock-o" title="Loading Tour" description="Please wait while we load your tour..."/>
      </Container>
    );
  }
  
  // Show error only if there was an error AND tour parameters were provided
  if (error && (tourId || tourData)) {
    return (
      <Container>
        <EmptyState icon="exclamation-triangle" title="Unable to Load Tour" description={error} actionText="Go Back" onAction={handleTourExit} />
      </Container>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <View className="flex-1 relative">
        {tour && <TourInfoDropdown tour={tour} />}
        <TourMap tour={tour} currentPOI={currentPOI} onPOISelect={handlePOISelect} />
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
          tour={tour} 
          currentLocation={currentLocation}
          onClose={handleAudioPlayerClose} 
        />
      )}
    </View>
  );
}