/**
 * Global Type Definitions
 * 
 * Shared types used across the entire application.
 */

// =============================================================================
// CORE DATA TYPES
// =============================================================================

/**
 * Geographic coordinates
 */
export interface Coordinates {
  lat: number;
  lng: number;
}

/**
 * Point of Interest
 */
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

/**
 * Tour difficulty levels
 */
export type TourDifficulty = 'easy' | 'medium' | 'hard';

/**
 * Tour entity
 */
export interface Tour {
  id: string;
  title: string;
  description: string;
  image: string;
  duration: number; // in minutes
  difficulty: TourDifficulty;
  pois: POI[];
  route?: [number, number][]; // array of [lng, lat] coordinates
  created_at: string;
  updated_at: string;
}

/**
 * Tour creation request
 */
export interface TourRequest {
  location: string;
  photos?: string[]; // URIs to selected photos
  preferences?: string; // Additional user preferences for tour generation
}

// =============================================================================
// USER & JOURNEY TYPES
// =============================================================================

/**
 * User entity
 */
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

/**
 * User journey (completed tour)
 */
export interface Journey {
  id: string;
  title: string;
  date: string;
  duration: string;
  distance: string;
  photos: string[];
  rating?: number;
  notes?: string;
}

/**
 * Tour progress tracking
 */
export interface TourProgress {
  tourId: string;
  completedPOIs: string[];
  currentPOI?: string;
  startTime: string;
  endTime?: string;
  totalDuration?: number; // in seconds
}

// =============================================================================
// MEDIA & PLAYBACK TYPES
// =============================================================================

/**
 * Audio playback state
 */
export interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  currentPOI?: POI;
}

/**
 * Geofence event
 */
export interface GeofenceEvent {
  poi: POI;
  distance: number;
  entered: boolean;
}

// =============================================================================
// API & RESPONSE TYPES
// =============================================================================

/**
 * Standard API response wrapper
 */
export interface APIResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
  success: boolean;
}

/**
 * Environment configuration
 */
export interface EnvConfig {
  AMAP_JS_KEY: string;
  AMAP_SECURITY_CODE: string;
  AMAP_WEB_SERVICE_KEY?: string;
  BACKEND_URL: string;
}

// =============================================================================
// NAVIGATION TYPES
// =============================================================================

/**
 * Tab navigation parameters
 */
export interface TabParamList {
  index: undefined;
  create: undefined;
  profile: undefined;
}

/**
 * Root navigation parameters
 */
export interface RootParamList {
  '(tabs)': undefined;
  map: { tourId: string };
  tour: { tourId: string };
  settings: undefined;
  modal: undefined;
} 