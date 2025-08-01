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
            if (tourDetail) {
              return {
                uid,
                title: tourDetail.title || 'Untitled Tour',
                description: tourDetail.description || 'No description available',
                locationName: 'Unknown', // This might need to be extracted from tour data
                status: 'COMPLETED' as const,
                coverImageUrl: tourDetail.coverImageUrl,
                createdAt: tourDetail.created_at || new Date().toISOString(),
                updatedAt: tourDetail.updated_at || new Date().toISOString()
              };
            } else {
              throw new Error('Failed to fetch tour details');
            }
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
 * @returns A promise that resolves to the full tour data response from the backend.
 */
export async function getTourByUid(tourUid: string): Promise<TourDataResponse | null> {
  console.log('[TourService] Fetching full tour data by UID:', tourUid);
  try {
    const response = await fetcher<R<TourDataResponse>>(`/tour/${tourUid}`);
    if (response.success && response.data) {
      console.log('[TourService] Full tour data fetched successfully:', response.data);
      return response.data;
    }
    throw new Error(response.message || 'Failed to fetch tour data');
  } catch (error) {
    console.error('[TourService] Failed to fetch full tour data:', error);
    return null;
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
      language: 'zh', // Default to Chinese, could be made configurable
      photoUrls: request.photos || []
    };
    
    console.log('[TourService] Sending generate request:', generateRequest);
    
    // 后端返回的结构是 R<TourGenerationStatusResponse>
    // postData 会将其包装为 APIResponse<R<TourGenerationStatusResponse>>
    // 但根据 fetcher.ts 的逻辑，它会解开一层，所以 response.data 就是 R<TourGenerationStatusResponse> 的 data 部分
    const response = await postData<TourGenerationStatusResponse>('/tour/generate', generateRequest);
    console.log('[TourService] Generate response received:', response);
    
    // 正确的判断逻辑：检查外层 postData 的 success 标志和内层后端返回的数据
    if (response.success && response.data) {
      console.log('[TourService] Tour generation started successfully:', response.data);
      return response.data; // 直接返回 data 对象
    }
    
    // 如果失败，构造错误信息
    const errorMsg = response.error || response.message || 'Failed to start tour generation';
    console.error('[TourService] Tour generation failed:', errorMsg);
    throw new Error(errorMsg);
  } catch (error) {
    console.error('[TourService] Tour generation error:', error);
    // 确保抛出的是 Error 对象
    if (error instanceof Error) {
        throw error;
    }
    throw new Error(String(error));
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