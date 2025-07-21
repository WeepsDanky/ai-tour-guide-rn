import { useState, useEffect, useRef } from 'react';
import { useAudioPlayer as useExpoAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { POI } from '~/types';
import { AudioPlayerStatus, AudioPlayerControls } from './types';
import { calculateDistance } from '@/lib/map';

const PROXIMITY_THRESHOLD = 50; // meters

export const useAudioPlayer = (
  nearbyPOIs: POI[],
  currentLocation: { lat: number; lng: number } | null
): AudioPlayerControls & { nearestPOI: POI | null } => {
  const [currentPOI, setCurrentPOI] = useState<POI | null>(null);
  const [status, setStatus] = useState<AudioPlayerStatus>({
    isPlaying: false,
    isLoading: false,
    isBuffering: false,
    durationMillis: 0,
    positionMillis: 0,
    error: null,
  });

  // Create audio player instance
  const audioSource = currentPOI?.audio_url ? { uri: currentPOI.audio_url } : null;
  const player = useExpoAudioPlayer(audioSource);
  const playerStatus = useAudioPlayerStatus(player);

  // Find the nearest POI with audio
  const nearestPOI = useRef<POI | null>(null);

  useEffect(() => {
    if (!currentLocation || !nearbyPOIs.length) {
      nearestPOI.current = null;
      return;
    }

    // Find the closest POI with audio that's within proximity threshold
    const poisWithAudio = nearbyPOIs.filter(poi => poi.audio_url);
    if (!poisWithAudio.length) {
      nearestPOI.current = null;
      return;
    }

    let closest: POI | null = null;
    let closestDistance = Infinity;

    poisWithAudio.forEach(poi => {
      const distance = calculateDistance(currentLocation, poi.coord);
      if (distance <= PROXIMITY_THRESHOLD && distance < closestDistance) {
        closest = poi;
        closestDistance = distance;
      }
    });

    nearestPOI.current = closest;

    // Auto-switch to nearest POI if it's different from current
    if (closest && (!currentPOI || closest.id !== currentPOI.id)) {
      setCurrentPOI(closest);
    } else if (!closest && currentPOI) {
      // Move away from POI, pause but don't clear (allow manual resumption)
      player.pause();
    }
  }, [currentLocation, nearbyPOIs, currentPOI?.id, player]);

  // Update our internal status based on expo-audio player status
  useEffect(() => {
    if (playerStatus) {
      setStatus({
        isPlaying: playerStatus.playing || false,
        isLoading: !playerStatus.isLoaded,
        isBuffering: playerStatus.isBuffering || false,
        durationMillis: (playerStatus.duration || 0) * 1000,
        positionMillis: (playerStatus.currentTime || 0) * 1000,
        error: null, // expo-audio handles errors differently
      });
    }
  }, [playerStatus]);

  // Auto-play when near a POI (if we have a current POI and are close enough)
  useEffect(() => {
    if (currentPOI && nearestPOI.current && nearestPOI.current.id === currentPOI.id) {
      // Only auto-play if not already playing
      if (!playerStatus?.playing && playerStatus?.isLoaded) {
        player.play();
      }
    }
  }, [currentPOI, nearestPOI.current, playerStatus?.playing, playerStatus?.isLoaded, player]);

  const play = () => {
    if (player && playerStatus?.isLoaded) {
      player.play();
    }
  };

  const pause = () => {
    if (player && playerStatus?.isLoaded) {
      player.pause();
    }
  };

  const togglePlayPause = () => {
    if (playerStatus?.playing) {
      pause();
    } else {
      play();
    }
  };

  const seekTo = async (positionMillis: number) => {
    if (player && playerStatus?.isLoaded) {
      await player.seekTo(positionMillis / 1000); // expo-audio uses seconds
    }
  };

  return {
    status,
    play,
    pause,
    seekTo,
    togglePlayPause,
    nearestPOI: nearestPOI.current,
  };
}; 