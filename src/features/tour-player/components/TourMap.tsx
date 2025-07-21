import React, { useRef, useEffect, memo, useState } from 'react';
import { View, Text } from 'react-native';
import MapView, { Marker, Callout, PROVIDER_GOOGLE, Polyline } from 'react-native-maps';
import { Tour, POI } from '~/types';

// --- New Memoized POI Marker Component ---
interface POIMarkerProps {
  poi: POI;
  index: number;
  isSelected: boolean;
  onSelect: (poi: POI) => void;
}

const POIMarker = memo(({ poi, index, isSelected, onSelect }: POIMarkerProps) => {
  // tracksViewChanges optimization: only track changes when selected status changes.
  const [tracksViewChanges, setTracksViewChanges] = useState(true);

  useEffect(() => {
    // When the selection changes, enable tracking to update the color, then disable it.
    setTracksViewChanges(true);
    const timeout = setTimeout(() => {
      setTracksViewChanges(false);
    }, 200); // A brief delay for the re-render to complete.

    return () => clearTimeout(timeout);
  }, [isSelected]);


  const handlePress = () => {
    onSelect(poi);
  };

  return (
    <Marker
      coordinate={{
        latitude: poi.coord.lat,
        longitude: poi.coord.lng,
      }}
      pinColor={isSelected ? '#3B82F6' : undefined}
      tracksViewChanges={tracksViewChanges} // Control re-rendering
      onPress={handlePress}
    >
      <Callout tooltip>
        <View className="p-2 min-w-[150px]">
           <View className="bg-white rounded-lg p-2 shadow-md">
            <View className="flex-row items-center space-x-2">
              <View className="w-6 h-6 bg-blue-100 rounded-full items-center justify-center">
                <Text className="text-blue-500 font-bold">{index + 1}</Text>
              </View>
              <Text className="text-base font-medium text-gray-900 flex-shrink" style={{maxWidth: 180}}>{poi.name}</Text>
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
  );
});
POIMarker.displayName = 'POIMarker';


// --- Main TourMap Component ---
interface TourMapProps {
  tour: Tour;
  currentPOI?: POI | null;
  onPOISelect?: (poi: POI) => void;
}

export const TourMap = memo(({ tour, currentPOI, onPOISelect }: TourMapProps) => {
  const mapRef = useRef<MapView>(null);

  const initialRegion = tour.pois[0] ? {
    latitude: tour.pois[0].coord.lat,
    longitude: tour.pois[0].coord.lng,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  } : undefined;

  // Animate to the selected POI or fit all markers on initial load
  useEffect(() => {
    if (mapRef.current) {
        if (currentPOI) {
            mapRef.current.animateToRegion({
                latitude: currentPOI.coord.lat,
                longitude: currentPOI.coord.lng,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            }, 600);
        } else if (tour.pois.length > 0) {
            // On initial load, fit all markers in the view
            mapRef.current.fitToCoordinates(
                tour.pois.map(p => ({latitude: p.coord.lat, longitude: p.coord.lng})),
                {
                    edgePadding: { top: 150, right: 50, bottom: 50, left: 50 },
                    animated: true,
                }
            );
        }
    }
  }, [currentPOI, tour.pois]);


  const polylineCoords = React.useMemo(() => {
    return tour.route ? tour.route.map(([lng, lat]) => ({
      latitude: lat,
      longitude: lng,
    })) : [];
  }, [tour.route]);

  return (
    <View className="flex-1">
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={{ flex: 1 }}
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
        pitchEnabled={false}
        rotateEnabled={false}
        moveOnMarkerPress={false}
      >
        {/* Render memoized markers */}
        {tour.pois.map((poi, index) => (
          <POIMarker
            key={poi.id}
            poi={poi}
            index={index}
            isSelected={currentPOI?.id === poi.id}
            onSelect={onPOISelect!}
          />
        ))}

        {/* Tour Route Line */}
        {polylineCoords.length > 0 && (
          <Polyline
            coordinates={polylineCoords}
            strokeColor="#3B82F6"
            strokeWidth={4}
            lineDashPattern={[5, 5]}
          />
        )}
      </MapView>
    </View>
  );
});