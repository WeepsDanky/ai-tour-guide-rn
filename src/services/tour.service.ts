// src/services/tour.service.ts
import { fetcher, postData } from '@/lib/fetcher';
import { Tour, TourRequest, GenerateTourRequest, TourGenerationStatusResponse, TourGenerationTask, TourSummary, PaginatedResponse, R, MyToursResponse, TourDataResponse } from '@/types';

/**
 * Fetches all tours for the current user from the backend.
 * @returns A promise that resolves to paginated tour summaries.
 */
export async function getMyTours(): Promise<PaginatedResponse<TourSummary>> {
  console.log('[TourService] Fetching user tours...');
  try {
    const response = await fetcher<R<MyToursResponse>>('/tour/my-tours');
    console.log('[TourService] User tours fetched successfully:', response);
    if (response.success && response.data) {
      console.log('[TourService] Raw tourUids from backend:', response.data.tourUids);
      
      // Fetch detailed information for each tour
      const tourSummaries: TourSummary[] = await Promise.all(
        response.data.tourUids.map(async (uid) => {
          try {
            const tourDetail = await getTourByUid(uid);
            return {
              uid,
              title: tourDetail.title || 'Untitled Tour',
              description: tourDetail.description || 'No description available',
              locationName: 'Unknown', // This might need to be extracted from tour data
              status: 'COMPLETED' as const,
              coverImageUrl: tourDetail.coverImageUrl,
              createdAt: tourDetail.created_at,
              updatedAt: tourDetail.updated_at
            };
          } catch (error) {
            console.error('[TourService] Failed to fetch tour details for uid', uid, ':', error);
            return {
              uid,
              title: 'Error loading tour',
              description: 'Failed to load tour details',
              locationName: 'Unknown',
              status: 'COMPLETED' as const,
              coverImageUrl: undefined,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
          }
        })
      );
      
      // Return in PaginatedResponse format
      return {
        content: tourSummaries,
        totalElements: tourSummaries.length,
        totalPages: 1,
        size: tourSummaries.length,
        number: 0,
        first: true,
        last: true
      };
    }
    throw new Error(response.message || 'Failed to fetch user tours');
  } catch (error) {
    console.error('[TourService] Failed to fetch user tours:', error);
    throw error;
  }
}

/**
 * Fetches a single tour by its UID from the backend.
 * @param tourUid - The UID of the tour to fetch.
 * @returns A promise that resolves to a single tour.
 */
export async function getTourByUid(tourUid: string): Promise<Tour> {
  console.log('[TourService] Fetching tour by UID:', tourUid);
  try {
    const response = await fetcher<R<TourDataResponse>>(`/tour/${tourUid}`);
    if (response.success && response.data) {
      // Parse the tour plan JSON string
      let tourPlan;
      try {
        tourPlan = JSON.parse(response.data.tourPlan);
      } catch (parseError) {
        console.error('[TourService] Failed to parse tour plan:', parseError);
        tourPlan = { segments: [], ordered_pois: [], total_distance_m: 0, total_duration_min: 0 };
      }
      
      // Convert TourDataResponse to Tour format
       const tour: Tour = {
         id: response.data.tourUid,
         title: response.data.title || 'Generated Tour', // Use title from response or default
         description: response.data.description || `A tour with ${tourPlan.ordered_pois?.length || 0} points of interest`,
         coverImageUrl: response.data.coverImageUrl, // Use cover image URL from response
         duration: tourPlan.total_duration_min || 0,
         pois: [], // Will need to be populated separately if needed
         route: [], // Will need to be populated from segments if needed
         created_at: new Date().toISOString(),
         updated_at: new Date().toISOString()
       };
      
      return tour;
    }
    throw new Error(response.message || 'Failed to fetch tour');
  } catch (error) {
    console.error('[TourService] Failed to fetch tour:', error);
    throw error;
  }
}

/**
 * Initiates the tour generation process via the API.
 * @param request - The tour creation request payload.
 * @returns A promise that resolves to tour generation status response.
 */
export async function createTour(request: TourRequest): Promise<TourGenerationStatusResponse> {
  console.log('[TourService] Starting tour generation with request:', request);
  
  try {
    // Convert TourRequest to GenerateTourRequest format
    const generateRequest: GenerateTourRequest = {
      locationName: request.location,
      prefText: request.preferences || '',
      language: 'zh-CN', // Default to Chinese, could be made configurable
      photoUrls: request.photos || []
    };
    
    console.log('[TourService] Sending generate request:', generateRequest);
    
    const response = await postData<R<TourGenerationStatusResponse>>('/tour/generate', generateRequest);
    console.log('[TourService] Generate response received:', response);
    
    if (response.success && response.data?.data) {
      console.log('[TourService] Tour generation started successfully:', response.data.data);
      return response.data.data;
    }
    
    const errorMsg = response.error || response.data?.message || 'Failed to start tour generation';
    console.error('[TourService] Tour generation failed:', errorMsg);
    throw new Error(errorMsg);
  } catch (error) {
    console.error('[TourService] Tour generation error:', error);
    throw error;
  }
}

/**
 * Polls the backend for the progress of a tour generation task.
 * @param tourUid - The UID of the tour to check status for.
 * @returns A promise that resolves to the current task status.
 */
export async function checkTourGenerationStatus(tourUid: string): Promise<TourGenerationTask> {
  console.log('[TourService] Checking tour generation status for UID:', tourUid);
  
  try {
    const response = await fetcher<R<TourGenerationTask>>(`/tour/status/${tourUid}`);
    console.log('[TourService] Status response received:', response);
    
    if (response.success && response.data) {
      console.log('[TourService] Tour status:', response.data.status, 'Progress:', response.data.progress);
      return response.data;
    }
    
    const errorMsg = response.message || 'Failed to check tour generation status';
    console.error('[TourService] Status check failed:', errorMsg);
    throw new Error(errorMsg);
  } catch (error) {
    console.error('[TourService] Status check error:', error);
    throw error;
  }
}

// Legacy function for backward compatibility
export async function checkTourCreationProgress(taskId: string): Promise<TourGenerationTask> {
  console.log('[TourService] Legacy progress check called with taskId:', taskId);
  return checkTourGenerationStatus(taskId);
}