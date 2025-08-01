// lib/map.ts
import MapView, { Marker, Polyline, LatLng } from 'react-native-maps';
import { POI } from '@/types';

export interface Coordinates {
  lat: number;
  lng: number;
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

// 高德地图路线规划
const AMAP_WEB_KEY = process.env.EXPO_PUBLIC_AMAP_WEB_SERVICE_KEY; // 确保你有一个Web服务的Key

interface AmapPoiDetail {
  name: string;
  coord: {
    lat: number;
    lng: number;
  };
}

/**
 * 从高德地图Web服务API获取单个POI的详细信息
 * @param poiId 高德地图POI ID (例如: "B0FFFAB6J2")
 * @returns 返回POI的名称和坐标，如果未找到则返回null
 */
export async function getPoiDetailsFromAmap(poiId: string): Promise<AmapPoiDetail | null> {
  if (!AMAP_WEB_KEY) {
    console.error("AMap Web Service Key is not configured. Please set EXPO_PUBLIC_AMAP_WEB_SERVICE_KEY in your .env file.");
    return null;
  }

  const url = `https://restapi.amap.com/v3/place/detail?key=${AMAP_WEB_KEY}&id=${poiId}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === '1' && data.pois && data.pois.length > 0) {
      const poi = data.pois[0];
      const [lng, lat] = poi.location.split(',').map(Number);
      return {
        name: poi.name,
        coord: { lat, lng },
      };
    }
    console.warn(`[getPoiDetailsFromAmap] Failed to fetch details for POI ID ${poiId}. Info: ${data.info}`);
    return null;
  } catch (error) {
    console.error(`[getPoiDetailsFromAmap] Error fetching details for POI ID ${poiId}:`, error);
    return null;
  }
}

export async function getRouteFromAmap(pois: POI[]): Promise<[number, number][]> {
  if (pois.length < 2) {
    return [];
  }
  const origin = `${pois[0].coord.lng},${pois[0].coord.lat}`;
  const destination = `${pois[pois.length - 1].coord.lng},${pois[pois.length - 1].coord.lat}`;
   
  const waypoints = pois.slice(1, -1)
    .map(p => `${p.coord.lng},${p.coord.lat}`)
    .join(';');

  const url = `https://restapi.amap.com/v3/direction/driving?key=${AMAP_WEB_KEY}&origin=${origin}&destination=${destination}&waypoints=${waypoints}&strategy=0&extensions=base`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === '1' && data.route.paths.length > 0) {
      const steps = data.route.paths[0].steps;
      const polyline: [number, number][] = [];
      steps.forEach((step: any) => {
        step.polyline.split(';').forEach((point: string) => {
          const [lng, lat] = point.split(',');
          polyline.push([parseFloat(lng), parseFloat(lat)]);
        });
      });
      return polyline;
    }
    console.error('AMap route planning failed:', data.info);
    return [];
  } catch (error) {
    console.error('Error fetching route from AMap:', error);
    return [];
  }
}