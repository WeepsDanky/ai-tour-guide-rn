// src/services/travelogue.service.ts
import { fetcher, postData, putData, deleteData } from '@/lib/fetcher';
import { 
  R, 
  PaginatedResponse, 
  TravelogueResponse, 
  TravelogueDetail, 
  TravelogueSummary,
  CreateTravelogueRequest,
  UpdateTravelogueRequest,
  AddPoiPhotoRequest,
  PoiPhotoResponse,
  UpdateTraveloguePoiRequest
} from '@/types';

/**
 * Creates a new travelogue from a tour
 * @param request - The travelogue creation request
 * @returns A promise that resolves to the created travelogue response
 */
export async function createTravelogue(request: CreateTravelogueRequest): Promise<TravelogueResponse> {
  console.log('[TravelogueService] Creating travelogue with request:', request);
  
  try {
    const response = await postData<R<TravelogueResponse>>('/travelogue', request);
    console.log('[TravelogueService] Create response received:', response);
    
    if (response.success && response.data?.data) {
      console.log('[TravelogueService] Travelogue created successfully:', response.data.data);
      return response.data.data;
    }
    
    const errorMsg = response.error || response.data?.message || 'Failed to create travelogue';
    console.error('[TravelogueService] Travelogue creation failed:', errorMsg);
    throw new Error(errorMsg);
  } catch (error) {
    console.error('[TravelogueService] Travelogue creation error:', error);
    throw error;
  }
}

/**
 * Fetches a complete travelogue by its UID
 * @param travelogueUid - The UID of the travelogue to fetch
 * @returns A promise that resolves to the complete travelogue details
 */
export async function getTravelogueDetail(travelogueUid: string): Promise<TravelogueDetail> {
  console.log('[TravelogueService] Fetching travelogue detail for UID:', travelogueUid);
  
  try {
    const response = await fetcher<R<TravelogueDetail>>(`/travelogue/${travelogueUid}`);
    console.log('[TravelogueService] Travelogue detail fetched successfully:', response);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    const errorMsg = response.message || 'Failed to fetch travelogue detail';
    console.error('[TravelogueService] Travelogue detail fetch failed:', errorMsg);
    throw new Error(errorMsg);
  } catch (error) {
    console.error('[TravelogueService] Travelogue detail fetch error:', error);
    throw error;
  }
}

/**
 * Updates travelogue metadata (title, summary, etc.)
 * @param travelogueUid - The UID of the travelogue to update
 * @param request - The update request
 * @returns A promise that resolves when the update is complete
 */
export async function updateTravelogue(travelogueUid: string, request: UpdateTravelogueRequest): Promise<void> {
  console.log('[TravelogueService] Updating travelogue:', travelogueUid, 'with request:', request);
  
  try {
    const response = await putData<void>(`/travelogue/${travelogueUid}`, request);
    
    if (!response.success) {
      console.error('[TravelogueService] Failed to update travelogue:', response.error);
      throw new Error(response.error || 'Failed to update travelogue');
    }
    
    console.log('[TravelogueService] Travelogue updated successfully');
    return;
  } catch (error) {
    console.error('[TravelogueService] Travelogue update error:', error);
    throw error;
  }
}

/**
 * Deletes a travelogue
 * @param travelogueUid - The UID of the travelogue to delete
 * @returns A promise that resolves when the deletion is complete
 */
export async function deleteTravelogue(travelogueUid: string): Promise<void> {
  console.log('[TravelogueService] Deleting travelogue:', travelogueUid);
  
  try {
    const response = await deleteData<void>(`/travelogue/${travelogueUid}`);
    
    if (!response.success) {
      console.error('[TravelogueService] Failed to delete travelogue:', response.error);
      throw new Error(response.error || 'Failed to delete travelogue');
    }
    
    console.log('[TravelogueService] Travelogue deleted successfully');
    return;
  } catch (error) {
    console.error('[TravelogueService] Travelogue deletion error:', error);
    throw error;
  }
}

/**
 * Fetches all travelogues for the current user
 * @returns A promise that resolves to paginated travelogue summaries
 */
export async function getMyTravelogues(): Promise<PaginatedResponse<TravelogueSummary>> {
  console.log('[TravelogueService] Fetching user travelogues...');
  
  try {
    const response = await fetcher<R<any>>('/travelogue/my-travelogues');
    console.log('[TravelogueService] User travelogues fetched successfully:', response);
    
    if (response.success && response.data) {
      // Handle the actual backend response format: {items: ["id1", "id2"]}
      const backendData = response.data;
      
      if (backendData.items && Array.isArray(backendData.items)) {
        // Fetch detailed information for each travelogue ID
        const traveloguePromises = backendData.items.map(async (uid: string) => {
          try {
            const detail = await getTravelogueDetail(uid);
            // Convert TravelogueDetail to TravelogueSummary
            const summary: TravelogueSummary = {
              uid: detail.uid || uid, // Ensure uid is always present
              title: detail.title || 'Untitled Travelogue',
              summary: detail.summary,
              tourUid: detail.tourUid,
              userId: detail.userId,
              userName: detail.userName,
              isPublic: detail.isPublic,
              createdAt: detail.createdAt,
              updatedAt: detail.updatedAt,
              thumbnailUrl: undefined // Not available in detail
            };
            console.log(`[TravelogueService] Created summary for ${uid}:`, summary);
            return summary;
          } catch (error) {
            console.warn(`[TravelogueService] Failed to fetch detail for travelogue ${uid}:`, error);
            return null;
          }
        });
        
        const travelogues = (await Promise.all(traveloguePromises)).filter(Boolean) as TravelogueSummary[];
        
        // Return in expected PaginatedResponse format
        return {
          content: travelogues,
          totalElements: backendData.totalItems || travelogues.length,
          totalPages: backendData.totalPages || 1,
          size: backendData.pageSize || 10,
          number: (backendData.currentPage || 1) - 1, // Convert to 0-based
          first: !backendData.hasPrevious,
          last: !backendData.hasNext
        };
      }
    }
    
    const errorMsg = response.message || 'Failed to fetch user travelogues';
    console.error('[TravelogueService] User travelogues fetch failed:', errorMsg);
    throw new Error(errorMsg);
  } catch (error) {
    console.error('[TravelogueService] User travelogues fetch error:', error);
    throw error;
  }
}

/**
 * Fetches all public travelogues from the community
 * @param page - Page number (1-based)
 * @param size - Number of items per page
 * @returns A promise that resolves to paginated travelogue summaries
 */
export async function getCommunityTravelogues(page = 1, size = 10): Promise<PaginatedResponse<TravelogueSummary>> {
  console.log('[TravelogueService] Fetching community travelogues...', { page, size });
  
  try {
    const response = await fetcher<R<PaginatedResponse<TravelogueSummary>>>(`/travelogue/community?page=${page - 1}&size=${size}`);
    console.log('[TravelogueService] Community travelogues fetched successfully:', response);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    const errorMsg = response.message || 'Failed to fetch community travelogues';
    console.error('[TravelogueService] Community travelogues fetch failed:', errorMsg);
    throw new Error(errorMsg);
  } catch (error) {
    console.error('[TravelogueService] Community travelogues fetch error:', error);
    throw error;
  }
}

/**
 * Adds a user photo to a POI in a travelogue
 * @param request - The photo addition request
 * @returns A promise that resolves to the photo response
 */
export async function addPoiPhoto(request: AddPoiPhotoRequest): Promise<PoiPhotoResponse> {
  console.log('[TravelogueService] Adding POI photo with request:', request);
  
  try {
    const response = await postData<R<PoiPhotoResponse>>('/travelogue/poi/photo', request);
    console.log('[TravelogueService] POI photo add response received:', response);
    
    if (response.success && response.data?.data) {
      console.log('[TravelogueService] POI photo added successfully:', response.data.data);
      return response.data.data;
    }
    
    const errorMsg = response.error || response.data?.message || 'Failed to add POI photo';
    console.error('[TravelogueService] POI photo addition failed:', errorMsg);
    throw new Error(errorMsg);
  } catch (error) {
    console.error('[TravelogueService] POI photo addition error:', error);
    throw error;
  }
}

/**
 * Updates a POI's notes or rating in a travelogue
 * @param poiId - The ID of the POI to update
 * @param request - The update request
 * @returns A promise that resolves when the update is complete
 */
export async function updateTraveloguePoi(poiId: string, request: UpdateTraveloguePoiRequest): Promise<void> {
  console.log('[TravelogueService] Updating travelogue POI:', poiId, 'with request:', request);
  
  try {
    const response = await putData<void>(`/travelogue/poi/${poiId}`, request);
    
    if (!response.success) {
      console.error('[TravelogueService] Failed to update travelogue POI:', response.error);
      throw new Error(response.error || 'Failed to update travelogue POI');
    }
    
    console.log('[TravelogueService] Travelogue POI updated successfully');
    return;
  } catch (error) {
    console.error('[TravelogueService] Travelogue POI update error:', error);
    throw error;
  }
}