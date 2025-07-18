import React, { useRef, useEffect } from 'react';
import { View, Text } from 'react-native';
import MapView, { Marker, Callout, PROVIDER_GOOGLE, Polyline } from 'react-native-maps';
import { Tour, POI } from '~/types';

interface TourMapProps {
  tour: Tour;
  currentPOI?: POI | null;
  onPOISelect?: (poi: POI) => void;
}

export function TourMap({ tour, currentPOI, onPOISelect }: TourMapProps) {
  const mapRef = useRef<MapView>(null);

  const initialRegion = {
    latitude: tour.pois[0]?.coord?.lat || 0,
    longitude: tour.pois[0]?.coord?.lng || 0,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  };

  // Animate to the selected POI
  useEffect(() => {
    if (currentPOI && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: currentPOI.coord.lat,
        longitude: currentPOI.coord.lng,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      });
    }
  }, [currentPOI]);

  return (
    <View className="flex-1">
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={{ flex: 1 }}
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton
        showsCompass
      >
        {/* Tour Points */}
        {tour.pois.map((poi, index) => (
          <Marker
            key={poi.id}
            coordinate={{
              latitude: poi.coord.lat,
              longitude: poi.coord.lng,
            }}
            title={poi.name}
            description={poi.description}
            pinColor={currentPOI?.id === poi.id ? '#3B82F6' : undefined}
          >
            <Callout onPress={() => onPOISelect?.(poi)}>
              <View className="p-2 min-w-[150px]">
                <View className="bg-white rounded-lg p-2">
                  <View className="flex-row items-center space-x-2">
                    <View className="w-6 h-6 bg-blue-100 rounded-full items-center justify-center">
                      <Text className="text-blue-500 font-bold">{index + 1}</Text>
                    </View>
                    <Text className="text-base font-medium text-gray-900">{poi.name}</Text>
                  </View>
                  {poi.description && (
                    <Text className="text-sm text-gray-600 mt-1" numberOfLines={2}>
                      {poi.description}
                    </Text>
                  )}
                </View>
              </View>
            </Callout>
          </Marker>
        ))}

        {/* Tour Route Line */}
        {tour.route && (
          <Polyline
            coordinates={tour.route.map(([lng, lat]) => ({
              latitude: lat,
              longitude: lng,
            }))}
            strokeColor="#3B82F6"
            strokeWidth={3}
            lineDashPattern={[1]}
          />
        )}
      </MapView>
    </View>
  );
} 