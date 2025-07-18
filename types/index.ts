// types/index.ts
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
  image_url?: string;
  category?: string;
  duration?: number; // in seconds
}

export interface Tour {
  id: string;
  title: string;
  description: string;
  image: string;
  duration: number; // in minutes
  difficulty: 'easy' | 'medium' | 'hard';
  pois: POI[];
  route?: [number, number][]; // array of [lng, lat] coordinates
  created_at: string;
  updated_at: string;
}

export interface TourRequest {
  location: string;
  photos?: string[]; // URIs to selected photos
}

export interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  currentPOI?: POI;
}

export interface GeofenceEvent {
  poi: POI;
  distance: number;
  entered: boolean;
}

export interface APIResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
  success: boolean;
}

export interface EnvConfig {
  AMAP_JS_KEY: string;
  AMAP_SECURITY_CODE: string;
  AMAP_WEB_SERVICE_KEY?: string;
  BACKEND_URL: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  preferences?: {
    interests: string[];
    language: string;
    notifications: boolean;
  };
}

export interface TourProgress {
  tourId: string;
  completedPOIs: string[];
  currentPOI?: string;
  startTime: string;
  endTime?: string;
  totalDuration?: number; // in seconds
}

// Navigation types for Expo Router
export interface TabParamList {
  index: undefined;
  create: undefined;
  profile: undefined;
}

export interface RootParamList {
  '(tabs)': undefined;
  map: { tourId: string };
  tour: { tourId: string };
  settings: undefined;
  modal: undefined;
} 