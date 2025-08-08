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
  coverImageUrl?: string;
  duration: number; // in minutes
  pois: POI[];
  route?: [number, number][]; // array of [lng, lat] coordinates
  created_at: string;
  updated_at: string;
}

/**
 * Tour creation request (frontend format)
 */
export interface TourRequest {
  location: string;
  photos?: string[]; // URIs to selected photos
  preferences?: string; // Additional user preferences for tour generation
}

/**
 * Generate tour request (backend format)
 */
export interface GenerateTourRequest {
  locationName: string;
  prefText: string;
  language: string;
  photos: Array<{
    data: string;
    type: 'image';
  }>;
}

/**
 * Tour generation status response
 */
export interface TourGenerationStatusResponse {
  tourUid: string;
  workflowRunId: string;
}

/**
 * Tour generation task status
 */
export interface TourGenerationTask {
  tourUid: string;
  workflowRunId: string;
  status: 'PENDING' | 'GENERATING' | 'COMPLETED' | 'FAILED';
  progress: number;
  message: string;
  tourData?: any; // The generated tour data when completed
  error?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Tour summary for listing
 */
export interface TourSummary {
  uid: string;
  title: string;
  description: string;
  locationName: string;
  status: 'PENDING' | 'GENERATING' | 'COMPLETED' | 'FAILED';
  coverImageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * My tours response from backend
 */
export interface MyToursResponse {
  tourUids: string[];
}

/**
 * Tour data response from backend
 */
export interface TourDataResponse {
  status: 'PENDING' | 'GENERATING' | 'COMPLETED' | 'FAILED';
  tourPlan: string; // JSON string containing tour plan
  tourUid: string;
  title?: string;
  description?: string;
  coverImageUrl?: string;
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

/**
 * Standard backend response wrapper
 */
export interface R<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  code?: number;
}

// =============================================================================
// TRAVELOGUE TYPES
// =============================================================================

/**
 * Create travelogue request
 */
export interface CreateTravelogueRequest {
  tourUids: string[];
  title?: string;
  summary?: string;
  isPublic?: boolean;
}

/**
 * Update travelogue request
 */
export interface UpdateTravelogueRequest {
  title?: string;
  summary?: string;
  isPublic?: boolean;
}

/**
 * Travelogue response
 */
export interface TravelogueResponse {
  uid: string;
  title: string;
  summary?: string;
  tourUid: string;
  userId: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Travelogue summary for listing
 */
export interface TravelogueSummary {
  uid: string;
  title: string;
  summary?: string;
  tourUid: string;
  userId: string;
  userName?: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  thumbnailUrl?: string;
}

/**
 * POI photo
 */
export interface PoiPhoto {
  id: string;
  photoUrl: string;
  caption?: string;
  uploadedAt: string;
}

/**
 * Travelogue POI with user data
 */
export interface TraveloguePoi {
  poiIdInTour: string; // e.g., "poi_1"
  note?: string;
  rating?: number; // 1-5 stars
  photos: PoiPhoto[];
}

/**
 * Complete travelogue detail
 */
export interface TravelogueDetail {
  uid: string;
  title: string;
  summary?: string;
  tourUid: string;
  userId: string;
  userName?: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  
  // Original tour data merged with user customizations
  tourData: any; // The original tour JSON data
  pois: TraveloguePoi[]; // User's POI customizations
}

/**
 * Add POI photo request
 */
export interface AddPoiPhotoRequest {
  travelogueUid: string;
  poiIdInTour: string;
  photoUrl: string;
  caption?: string;
}

/**
 * POI photo response
 */
export interface PoiPhotoResponse {
  id: string;
  photoUrl: string;
  caption?: string;
  uploadedAt: string;
}

/**
 * Update travelogue POI request
 */
export interface UpdateTraveloguePoiRequest {
  note?: string;
  rating?: number;
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
  code?: string;
}

/**
 * Environment configuration
 */
export interface EnvConfig {
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

// =============================================================================
// AUTHENTICATION TYPES
// =============================================================================
export * from './auth';