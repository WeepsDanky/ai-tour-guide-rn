import React, { forwardRef, useState } from 'react';
import { View, Alert, Text } from 'react-native';
import MapView, { Marker, Polyline, Region } from 'react-native-maps';
import { FontAwesome } from '@expo/vector-icons';
import { Tour, POI } from '~/types';
import { LoadingIndicator } from '../../../../ui/atoms/LoadingIndicator';
import { createMarkerProps, createPolylineProps, animateToRegion } from '../../../../lib/map';

interface MapShellProps {
  tour: Tour;
  currentPOI?: POI | null;
  visitedPOIs: Set<string>;
  onPOIPress: (poi: POI) => void;
}

export const MapShell = forwardRef<MapView, MapShellProps>(
  ({ tour, currentPOI, visitedPOIs, onPOIPress }, ref) => {
    const [isLoading, setIsLoading] = useState(true);
    const [mapError, setMapError] = useState<string | null>(null);

    const handleMapReady = () => {
      setIsLoading(false);
      
      // Animate to show all POIs
      if (ref && typeof ref === 'object' && 'current' in ref && ref.current && tour.pois.length > 0) {
        ref.current.fitToCoordinates(
          tour.pois.map(poi => ({ latitude: poi.coord.lat, longitude: poi.coord.lng })),
          {
            edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
            animated: true,
          }
        );
      }
    };

    const handleMapError = () => {
      setIsLoading(false);
      setMapError('Failed to load map. Please check your connection.');
    };

    const getMarkerColor = (poi: POI) => {
      if (currentPOI?.id === poi.id) return '#3B82F6'; // Blue for current
      if (visitedPOIs.has(poi.id)) return '#10B981'; // Green for visited
      return '#EF4444'; // Red for unvisited
    };

    const getMarkerIcon = (poi: POI) => {
      if (currentPOI?.id === poi.id) return 'play-circle';
      if (visitedPOIs.has(poi.id)) return 'check-circle';
      return 'map-marker';
    };

    if (mapError) {
      return (
        <View className="flex-1 items-center justify-center bg-gray-100">
          <FontAwesome name="exclamation-triangle" size={48} color="#EF4444" />
          <Text className="text-lg font-semibold text-gray-900 mt-4 mb-2">
            Map Error
          </Text>
          <Text className="text-gray-600 text-center px-8">
            {mapError}
          </Text>
        </View>
      );
    }

    return (
      <View className="flex-1">
        <MapView
          ref={ref}
          className="flex-1"
          onMapReady={handleMapReady}
          showsUserLocation
          showsMyLocationButton={false}
          showsCompass
          showsScale
          pitchEnabled
          rotateEnabled
          zoomEnabled
          scrollEnabled
        >
          {/* Route polyline */}
          {tour.route && tour.route.length > 1 && (
            <Polyline
              coordinates={tour.route.map(([lng, lat]) => ({
                latitude: lat,
                longitude: lng,
              }))}
              strokeColor="#3B82F6"
              strokeWidth={3}
            />
          )}

          {/* POI markers */}
          {tour.pois.map((poi) => (
            <Marker
              key={poi.id}
              coordinate={{
                latitude: poi.coord.lat,
                longitude: poi.coord.lng,
              }}
              title={poi.name}
              description={poi.description}
              onPress={() => onPOIPress(poi)}
              pinColor={getMarkerColor(poi)}
            >
              <View
                className="w-10 h-10 rounded-full items-center justify-center border-2 border-white shadow-lg"
                style={{ backgroundColor: getMarkerColor(poi) }}
              >
                <FontAwesome
                  name={getMarkerIcon(poi)}
                  size={16}
                  color="white"
                />
              </View>
            </Marker>
          ))}
        </MapView>

        {/* Loading overlay */}
        {isLoading && (
          <LoadingIndicator
            variant="overlay"
            text="Loading map..."
            size="large"
          />
        )}
      </View>
    );
  }
); 