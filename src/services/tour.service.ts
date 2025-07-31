// src/services/tour.service.ts
import { fetcher, postData } from '@/lib/fetcher';
import { Tour, TourRequest, GenerateTourRequest, TourGenerationStatusResponse, TourGenerationTask, TourSummary, PaginatedResponse, R } from '@/types';

/**
 * Fetches all tours for the current user from the backend.
 * @returns A promise that resolves to paginated tour summaries.
 */
export async function getMyTours(): Promise<PaginatedResponse<TourSummary>> {
  console.log('[TourService] Fetching user tours...');
  try {
    const response = await fetcher<R<PaginatedResponse<TourSummary>>>('/tour/my-tours');
    console.log('[TourService] User tours fetched successfully:', response);
    if (response.success && response.data) {
      return response.data;
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
    const response = await fetcher<R<Tour>>(`/tour/${tourUid}`);
    console.log('[TourService] Tour fetched successfully:', response);
    if (response.success && response.data) {
      return response.data;
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