import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { Tour, POI } from '@/types';
import { getTourByUid } from '@/services/tour.service';
import { getTravelogueDetail } from '@/services/travelogue.service';

interface UseTourPlaybackOptions {
  travelogueId?: string;
  tourId?: string;
  tourData?: string;
}

interface UseTourPlaybackReturn {
  // State
  tour: Tour | null;
  currentPOI: POI | null;
  currentLocation: { lat: number; lng: number } | null;
  isLoading: boolean;
  error: string | null;
  showAudioPlayer: boolean;
  
  // Handlers
  handleTourExit: () => void;
  handlePOISelect: (poi: POI) => void;
  handleAudioPlayerClose: () => void;
  handleShowAudioPlayer: () => void;
}

export function useTourPlayback({ travelogueId, tourId, tourData }: UseTourPlaybackOptions): UseTourPlaybackReturn {
  const router = useRouter();

  // ----------------- Component state -----------------
  const [tour, setTour] = useState<Tour | null>(null);
  const [currentPOI, setCurrentPOI] = useState<POI | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAudioPlayer, setShowAudioPlayer] = useState(true);

  const hasFetchedRef = useRef(false);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);

  // ----------------- Location tracking -----------------
  useEffect(() => {
    const startLocationTracking = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.warn('Location permission denied');
          return;
        }

        // Get initial location
        const initialLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        
        setCurrentLocation({
          lat: initialLocation.coords.latitude,
          lng: initialLocation.coords.longitude,
        });

        // Start watching location
        locationSubscription.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 5000, // 5 seconds
            distanceInterval: 10, // 10 meters
          },
          (location) => {
            setCurrentLocation({
              lat: location.coords.latitude,
              lng: location.coords.longitude,
            });
          }
        );
      } catch (err) {
        console.error('Failed to start location tracking:', err);
      }
    };

    startLocationTracking();

    return () => {
      if (locationSubscription.current) {
        locationSubscription.current.remove();
        locationSubscription.current = null;
      }
    };
  }, []);

  // ----------------- Data loading -----------------
  useEffect(() => {
    if (travelogueId || tourId || tourData) {
      if (!hasFetchedRef.current) {
        hasFetchedRef.current = true;

        const loadTour = async () => {
          setIsLoading(true);
          setError(null);
          try {
            let loadedTour: Tour | null = null;

            if (tourData) {
              // tourData 是从 progress 页面传来的 TourDataResponse 对象的 JSON 字符串
              const tourDataResponse = JSON.parse(tourData as string);
              // 从 TourDataResponse 中提取实际的 tourData 并解析
              if (tourDataResponse.tourData) {
                loadedTour = typeof tourDataResponse.tourData === 'string' 
                  ? JSON.parse(tourDataResponse.tourData) 
                  : tourDataResponse.tourData;
              }
            } else if (travelogueId) {
              // Load tour data from travelogue
              const travelogueDetail = await getTravelogueDetail(travelogueId as string);
              console.log('[useTourPlayback] Travelogue detail loaded:', travelogueDetail);
              
              // --- 关键优化点 ---
              // 后端已经聚合了 POI 信息，我们应该直接使用 travelogueDetail.pois
              // tourData 主要用来获取 route 等原始路线信息
              if (travelogueDetail && travelogueDetail.pois) {
                // 调试：查看后端返回的 PoiDetail 结构
                console.log('[useTourPlayback] First POI detail structure:', JSON.stringify(travelogueDetail.pois[0], null, 2));
                
                // 将后端返回的 PoiDetail 转换为前端的 POI 类型
                // 注意：后端返回的 PoiDetail 结构可能与前端 POI 不同，需要适配
                const frontendPois: POI[] = travelogueDetail.pois.map((poiDetail: any) => {
                  console.log('[useTourPlayback] Processing POI detail:', poiDetail);
                  return {
                    id: poiDetail.poiIdInTour || poiDetail.id || poiDetail.poiId, // 尝试多个可能的ID字段
                    name: poiDetail.name || poiDetail.title || poiDetail.poiName || 'Unknown POI',
                    coord: { 
                      lat: poiDetail.latitude || poiDetail.lat || poiDetail.coord?.lat, 
                      lng: poiDetail.longitude || poiDetail.lng || poiDetail.coord?.lng 
                    },
                    description: poiDetail.userNotes || poiDetail.originalNarrative || poiDetail.description || poiDetail.narrative, // 优先用用户笔记
                    // 其他字段根据需要进行映射...
                    // image_url, audio_url 等可以从 userPhotos 或原始数据中获取
                    image_url: poiDetail.userPhotos?.[0]?.photoUrl || poiDetail.imageUrl || poiDetail.image_url,
                  };
                });

                const routeCoords = travelogueDetail.tourData?.route;

                loadedTour = {
                  id: travelogueDetail.travelogueUid,
                  title: travelogueDetail.title,
                  description: travelogueDetail.summary || 'No description',
                  coverImageUrl: travelogueDetail.tourData?.coverImageUrl, // 从 tourData 获取
                  duration: travelogueDetail.tourData?.duration || 60,
                  pois: frontendPois, // 使用后端聚合好的 POI
                  route: routeCoords,
                  created_at: travelogueDetail.createdAt,
                  updated_at: travelogueDetail.updatedAt,
                };
                console.log('[useTourPlayback] Transformed tour from TravelogueDetail:', loadedTour);
              } else {
                // 此处错误日志可以保留，以防后端返回的数据结构再次出错
                console.error('[useTourPlayback] No pois found in travelogue detail');
                throw new Error('Invalid travelogue data received from server.');
              }
            } else if (tourId) {
              const tour = await getTourByUid(tourId as string);
              loadedTour = tour || null;
            }

            if (!loadedTour) {
              throw new Error('No tour specified or found.');
            }
            setTour(loadedTour);
          } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to load tour data';
            setError(message);
          } finally {
            setIsLoading(false);
          }
        };

        loadTour();
      }
    } else {
      // No tour specified - empty map mode
      setIsLoading(false);
      setTour(null);
      setError(null);
    }
  }, [travelogueId, tourId, tourData]);

  // ----------------- Handlers -----------------
  const handleTourExit = useCallback(() => {
    router.back();
  }, [router]);

  const handlePOISelect = useCallback((poi: POI) => {
    setCurrentPOI(poi);
  }, []);

  const handleAudioPlayerClose = useCallback(() => {
    setShowAudioPlayer(false);
  }, []);

  const handleShowAudioPlayer = useCallback(() => {
    setShowAudioPlayer(true);
  }, []);

  return {
    // State
    tour,
    currentPOI,
    currentLocation,
    isLoading,
    error,
    showAudioPlayer,
    
    // Handlers
    handleTourExit,
    handlePOISelect,
    handleAudioPlayerClose,
    handleShowAudioPlayer,
  };
}
