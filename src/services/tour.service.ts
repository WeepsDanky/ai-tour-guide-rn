// src/services/tour.service.ts
import { fetcher, postData, pollTaskProgress as pollApiProgress } from '@/lib/fetcher';
import { Tour, TourRequest } from '~/types';
import type { TourGenerationTask } from '~/types';

/**
 * Fetches all available tours from the backend.
 * @returns A promise that resolves to an array of tours.
 */
export async function getAllTours(): Promise<Tour[]> {
  return fetcher<Tour[]>('/api/tours');
}

/**
 * Fetches a single tour by its ID from the backend.
 * @param id - The ID of the tour to fetch.
 * @returns A promise that resolves to a single tour or undefined if not found.
 */
export async function getTourById(id: string): Promise<Tour | undefined> {
  return fetcher<Tour>(`/api/tours/${id}`);
}

/**
 * Initiates the tour generation process via the API.
 * @param request - The tour creation request payload.
 * @returns A promise that resolves to an object containing the taskId.
 */
export async function createTour(request: TourRequest): Promise<{ taskId: string }> {
  const response = await postData<{ taskId: string }>('/api/tours/generate', request);
  if (response.success && response.data) {
    return response.data;
  }
  throw new Error(response.error || 'Failed to start tour generation');
}

/**
 * Polls the backend for the progress of a tour generation task.
 * @param taskId - The ID of the task to check.
 * @returns A promise that resolves to the current task status.
 */
export async function checkTourCreationProgress(taskId: string): Promise<TourGenerationTask> {
  return pollApiProgress(taskId);
}

// NOTE: All the old mock arrays and mock-prefixed functions are now deleted from this file. 