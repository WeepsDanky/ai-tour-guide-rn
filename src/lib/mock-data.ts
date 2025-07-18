// src/lib/mock-data.ts
import { Tour, POI } from '~/types';

// Mock POIs for testing
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
];

// Mock tours for testing
export const mockTours: Tour[] = [
  {
    id: 'tour-1',
    title: 'Classic NYC Highlights',
    description: 'Explore the most iconic landmarks of New York City in this comprehensive walking tour.',
    image: 'https://example.com/images/nyc-tour.jpg',
    duration: 120, // 2 hours
    difficulty: 'medium',
    pois: mockPOIs,
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
    title: 'Historic Downtown Walk',
    description: 'Discover the rich history of downtown Manhattan through its historic buildings and landmarks.',
    image: 'https://example.com/images/downtown-tour.jpg',
    duration: 90, // 1.5 hours
    difficulty: 'easy',
    pois: [mockPOIs[2]], // Just Empire State Building for this tour
    route: [
      [-73.985428, 40.748817], // Empire State Building
    ],
    created_at: '2024-01-14T15:30:00Z',
    updated_at: '2024-01-14T15:30:00Z',
  },
  {
    id: 'tour-3',
    title: 'Parks and Recreation',
    description: 'A relaxing tour through New York\'s beautiful parks and green spaces.',
    image: 'https://example.com/images/parks-tour.jpg',
    duration: 75, // 1.25 hours
    difficulty: 'easy',
    pois: [mockPOIs[0]], // Just Central Park
    route: [
      [-73.968285, 40.785091], // Central Park
    ],
    created_at: '2024-01-13T09:15:00Z',
    updated_at: '2024-01-13T09:15:00Z',
  },
];

// Function to get all mock tours
export const getMockTours = (): Tour[] => {
  return mockTours;
};

// Function to get a specific tour by ID
export const getMockTourById = (id: string): Tour | undefined => {
  return mockTours.find(tour => tour.id === id);
};

// Function to create a new mock tour
export const createMockTour = (tourData: Partial<Tour>): Tour => {
  const newTour: Tour = {
    id: `tour-${Date.now()}`,
    title: tourData.title || 'New Tour',
    description: tourData.description || 'A new AI-generated tour',
    image: tourData.image || 'https://example.com/images/default-tour.jpg',
    duration: tourData.duration || 60,
    difficulty: tourData.difficulty || 'medium',
    pois: tourData.pois || [],
    route: tourData.route || [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  mockTours.push(newTour);
  return newTour;
};

// Mock API responses for tour generation
export interface TourGenerationTask {
  taskId: string;
  phase: 'initializing' | 'research' | 'planning' | 'generating' | 'audio_generation' | 'audio_ready' | 'error';
  progress: number;
  message: string;
  payload?: Tour;
  error?: string;
}

// Mock function to simulate tour generation API
export const mockTourGeneration = async (request: any): Promise<{ taskId: string }> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  return { taskId };
};

// Mock function to simulate progress polling
export const mockProgressCheck = async (taskId: string): Promise<TourGenerationTask> => {
  // Simulate different phases based on time
  const now = Date.now();
  const taskTime = parseInt(taskId.split('_')[1]);
  const elapsed = now - taskTime;
  
  if (elapsed < 2000) {
    return {
      taskId,
      phase: 'initializing',
      progress: 15,
      message: 'Initializing tour generation...'
    };
  } else if (elapsed < 4000) {
    return {
      taskId,
      phase: 'research',
      progress: 35,
      message: 'Researching points of interest...'
    };
  } else if (elapsed < 6000) {
    return {
      taskId,
      phase: 'planning',
      progress: 55,
      message: 'Planning optimal route...'
    };
  } else if (elapsed < 8000) {
    return {
      taskId,
      phase: 'generating',
      progress: 75,
      message: 'Generating tour content...'
    };
  } else if (elapsed < 10000) {
    return {
      taskId,
      phase: 'audio_generation',
      progress: 90,
      message: 'Creating audio guides...'
    };
  } else {
    // Return completed tour
    const generatedTour: Tour = {
      id: `generated_${taskId}`,
      title: `Custom Tour - ${new Date().toLocaleDateString()}`,
      description: 'Your personalized AI-generated tour experience.',
      image: 'https://example.com/images/generated-tour.jpg',
      duration: 90,
      difficulty: 'medium',
      pois: mockPOIs,
      route: [
        [-73.968285, 40.785091], // Central Park
        [-73.985130, 40.758896], // Times Square
        [-73.985428, 40.748817], // Empire State Building
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return {
      taskId,
      phase: 'audio_ready',
      progress: 100,
      message: 'Tour generation complete!',
      payload: generatedTour
    };
  }
};

// Mock user journeys for the profile section
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
    title: 'Historic Downtown Walk',
    date: '2024-01-15',
    duration: '2h 15m',
    distance: '3.2 km',
    photos: [
      'https://example.com/images/journey1-1.jpg',
      'https://example.com/images/journey1-2.jpg',
      'https://example.com/images/journey1-3.jpg',
    ],
    rating: 5,
    notes: 'Amazing historical insights! Loved the architecture tour.'
  },
  {
    id: 'journey-2',
    title: 'Art District Explorer',
    date: '2024-01-10',
    duration: '1h 45m',
    distance: '2.8 km',
    photos: [
      'https://example.com/images/journey2-1.jpg',
      'https://example.com/images/journey2-2.jpg',
    ],
    rating: 4,
    notes: 'Great street art discoveries. Could use more museum stops.'
  },
];

// Helper function to get mock journeys
export const getMockJourneys = (): Journey[] => {
  return mockJourneys;
}; 