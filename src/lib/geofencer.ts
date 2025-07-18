// lib/geofencer.ts
import * as Location from 'expo-location';
import { POI, Coordinates, calculateDistance } from './map';

export interface GeofenceEvent {
  poi: POI;
  distance: number;
  entered: boolean;
}

export class GeoFencer {
  private pois: POI[] = [];
  private locationSubscription: Location.LocationSubscription | null = null;
  private triggeredPOIs: Set<string> = new Set();
  private radius: number = 50; // meters
  
  public onPOIEnter: ((event: GeofenceEvent) => void) | null = null;
  public onPOIExit: ((event: GeofenceEvent) => void) | null = null;
  public onLocationUpdate: ((location: Coordinates) => void) | null = null;
  public onError: ((error: string) => void) | null = null;

  constructor(pois: POI[] = [], radius: number = 50) {
    this.pois = pois;
    this.radius = radius;
  }

  async start(): Promise<void> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        this.onError?.('Permission to access location was denied');
        return;
      }

      this.locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000, // 5 seconds
          distanceInterval: 10, // 10 meters
        },
        (location) => {
          this.handleLocationUpdate(location);
        }
      );
    } catch (error) {
      this.onError?.(`Failed to start location tracking: ${error}`);
    }
  }

  stop(): void {
    if (this.locationSubscription) {
      this.locationSubscription.remove();
      this.locationSubscription = null;
    }
    this.triggeredPOIs.clear();
  }

  private handleLocationUpdate(location: Location.LocationObject): void {
    const currentLocation: Coordinates = {
      lat: location.coords.latitude,
      lng: location.coords.longitude,
    };

    this.onLocationUpdate?.(currentLocation);

    // Check each POI for geofence events
    this.pois.forEach(poi => {
      const distance = calculateDistance(currentLocation, poi.coord);
      const isWithinRange = distance <= this.radius;
      const wasTriggered = this.triggeredPOIs.has(poi.id);

      if (isWithinRange && !wasTriggered) {
        // POI entered
        this.triggeredPOIs.add(poi.id);
        this.onPOIEnter?.({
          poi,
          distance,
          entered: true,
        });
      } else if (!isWithinRange && wasTriggered) {
        // POI exited
        this.triggeredPOIs.delete(poi.id);
        this.onPOIExit?.({
          poi,
          distance,
          entered: false,
        });
      }
    });
  }

  updatePOIs(pois: POI[]): void {
    this.pois = pois;
    this.triggeredPOIs.clear();
  }

  setRadius(radius: number): void {
    this.radius = radius;
  }

  async getCurrentLocation(): Promise<Coordinates | null> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        this.onError?.('Permission to access location was denied');
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      return {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      };
    } catch (error) {
      this.onError?.(`Failed to get current location: ${error}`);
      return null;
    }
  }
} 