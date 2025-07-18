// Temporary types - these will be moved to global types later
interface Coordinates {
  lat: number;
  lng: number;
}

interface POI {
  id: string;
  name: string;
  coord: Coordinates;
  description?: string;
  audio_url?: string;
  image_url?: string;
  category?: string;
  duration?: number;
}

interface Tour {
  id: string;
  title: string;
  description: string;
  image: string;
  duration: number;
  difficulty: 'easy' | 'medium' | 'hard';
  pois: POI[];
  route?: [number, number][];
  created_at: string;
  updated_at: string;
}

/**
 * Mock POIs for testing and development
 */
export const mockPOIs: POI[] = [
  {
    id: '1',
    name: 'Central Park',
    coord: { lat: 40.785091, lng: -73.968285 },
    description: 'A large public park in Manhattan, New York City.',
    audio_url: 'https://example.com/audio/central-park.mp3',
    image_url: 'https://example.com/images/central-park.jpg',
    category: 'park',
    duration: 300, // 5 minutes
  },
  {
    id: '2',
    name: 'Times Square',
    coord: { lat: 40.758896, lng: -73.985130 },
    description: 'A major commercial intersection and tourist destination.',
    audio_url: 'https://example.com/audio/times-square.mp3',
    image_url: 'https://example.com/images/times-square.jpg',
    category: 'landmark',
    duration: 180, // 3 minutes
  },
  {
    id: '3',
    name: 'Empire State Building',
    coord: { lat: 40.748817, lng: -73.985428 },
    description: 'A 102-story Art Deco skyscraper in Midtown Manhattan.',
    audio_url: 'https://example.com/audio/empire-state.mp3',
    image_url: 'https://example.com/images/empire-state.jpg',
    category: 'architecture',
    duration: 420, // 7 minutes
  },
  {
    id: '4',
    name: 'Brooklyn Bridge',
    coord: { lat: 40.706086, lng: -73.996864 },
    description: 'A historic suspension bridge connecting Manhattan and Brooklyn.',
    audio_url: 'https://example.com/audio/brooklyn-bridge.mp3',
    image_url: 'https://example.com/images/brooklyn-bridge.jpg',
    category: 'architecture',
    duration: 360, // 6 minutes
  },
  {
    id: '5',
    name: 'Statue of Liberty',
    coord: { lat: 40.689249, lng: -74.044500 },
    description: 'A colossal neoclassical sculpture on Liberty Island.',
    audio_url: 'https://example.com/audio/statue-liberty.mp3',
    image_url: 'https://example.com/images/statue-liberty.jpg',
    category: 'landmark',
    duration: 480, // 8 minutes
  },
];

/**
 * Mock tours for testing and development
 */
export const mockTours: Tour[] = [
  {
    id: 'tour-1',
    title: 'Classic NYC Highlights',
    description: 'Explore the most iconic landmarks of New York City in this comprehensive walking tour.',
    image: 'https://example.com/images/nyc-tour.jpg',
    duration: 120, // 2 hours
    difficulty: 'medium',
    pois: mockPOIs.slice(0, 3),
    route: [
      [-73.968285, 40.785091], // Central Park
      [-73.985130, 40.758896], // Times Square
      [-73.985428, 40.748817], // Empire State Building
    ],
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
  {
    id: 'tour-2',
    title: 'Brooklyn & Manhattan Bridges',
    description: 'Discover the architectural marvels that connect NYC boroughs.',
    image: 'https://example.com/images/bridges-tour.jpg',
    duration: 90,
    difficulty: 'easy',
    pois: [mockPOIs[3], mockPOIs[4]], // Brooklyn Bridge, Statue of Liberty
    route: [
      [-73.996864, 40.706086], // Brooklyn Bridge
      [-74.044500, 40.689249], // Statue of Liberty
    ],
    created_at: '2024-01-16T14:30:00Z',
    updated_at: '2024-01-16T14:30:00Z',
  },
  {
    id: 'tour-3',
    title: 'Central Park Nature Walk',
    description: 'A peaceful journey through Central Park\'s natural beauty and hidden gems.',
    image: 'https://example.com/images/central-park-tour.jpg',
    duration: 75,
    difficulty: 'easy',
    pois: [mockPOIs[0]], // Central Park
    route: [
      [-73.968285, 40.785091],
      [-73.965355, 40.782865],
      [-73.971249, 40.775551],
    ],
    created_at: '2024-01-17T09:15:00Z',
    updated_at: '2024-01-17T09:15:00Z',
  },
];

/**
 * Mock journeys (completed tours) for testing
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

export const mockJourneys: Journey[] = [
  {
    id: 'journey-1',
    title: 'Morning Central Park Walk',
    date: '2024-01-10T08:00:00Z',
    duration: '1h 45m',
    distance: '2.3 km',
    photos: [
      'https://example.com/photos/journey1-1.jpg',
      'https://example.com/photos/journey1-2.jpg',
      'https://example.com/photos/journey1-3.jpg',
    ],
    rating: 5,
    notes: 'Beautiful morning walk with great weather. Saw some amazing wildlife!',
  },
  {
    id: 'journey-2',
    title: 'Brooklyn Bridge Sunset Tour',
    date: '2024-01-08T17:30:00Z',
    duration: '2h 15m',
    distance: '3.1 km',
    photos: [
      'https://example.com/photos/journey2-1.jpg',
      'https://example.com/photos/journey2-2.jpg',
    ],
    rating: 4,
    notes: 'Amazing sunset views from the bridge. A bit crowded but worth it.',
  },
];

/**
 * Get mock tours data
 * @returns Array of mock tours
 */
export function getMockTours(): Tour[] {
  return [...mockTours];
}

/**
 * Get mock journeys data
 * @returns Array of mock journeys
 */
export function getMockJourneys(): Journey[] {
  return [...mockJourneys];
}

/**
 * Get a specific tour by ID
 * @param id Tour ID
 * @returns Tour object or undefined
 */
export function getMockTourById(id: string): Tour | undefined {
  return mockTours.find(tour => tour.id === id);
}

/**
 * Search tours by query
 * @param query Search query
 * @returns Array of matching tours
 */
export function searchMockTours(query: string): Tour[] {
  const lowercaseQuery = query.toLowerCase();
  return mockTours.filter(tour =>
    tour.title.toLowerCase().includes(lowercaseQuery) ||
    tour.description.toLowerCase().includes(lowercaseQuery) ||
    tour.pois.some(poi =>
      poi.name.toLowerCase().includes(lowercaseQuery) ||
      poi.description?.toLowerCase().includes(lowercaseQuery)
    )
  );
} 