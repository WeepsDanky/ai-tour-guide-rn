// lib/map.ts
import MapView, { Marker, Polyline, LatLng } from 'react-native-maps';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface POI {
  id: string;
  name: string;
  coord: Coordinates;
  description?: string;
  audio_url?: string;
}

// Helper to create a marker props object
export const createMarkerProps = (poi: POI) => ({
  coordinate: {
    latitude: poi.coord.lat,
    longitude: poi.coord.lng,
  },
  title: poi.name,
  description: poi.description,
  identifier: poi.id,
});

// Helper to create a polyline props object
export const createPolylineProps = (coordinates: [number, number][]) => ({
  coordinates: coordinates.map(([lng, lat]) => ({ latitude: lat, longitude: lng })),
  strokeColor: '#1890ff',
  strokeWidth: 4,
});

// A function to animate the map to a region
export const animateToRegion = (mapRef: React.RefObject<MapView | null>, coordinates: Coordinates[], padding = 50) => {
  if (mapRef.current && coordinates.length > 0) {
    mapRef.current.fitToCoordinates(
      coordinates.map(c => ({ latitude: c.lat, longitude: c.lng })),
      {
        edgePadding: { top: padding, right: padding, bottom: padding, left: padding },
        animated: true,
      }
    );
  }
};

// Calculate distance between two coordinates using Haversine formula
export const calculateDistance = (coord1: Coordinates, coord2: Coordinates): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (coord1.lat * Math.PI) / 180;
  const φ2 = (coord2.lat * Math.PI) / 180;
  const Δφ = ((coord2.lat - coord1.lat) * Math.PI) / 180;
  const Δλ = ((coord2.lng - coord1.lng) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}; 