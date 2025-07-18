// src/lib/fetcher.ts
export interface APIResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
  success: boolean;
}

// The URL must now be a full URL, not a relative path like '/api/tour'
export const fetcher = async <T = any>(path: string): Promise<T> => {
  const fullUrl = `${process.env.EXPO_PUBLIC_BACKEND_URL}${path}`;
  console.log('Fetching:', fullUrl);
  
  const response = await fetch(fullUrl, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  const data = await response.json();
  return data;
};

export const postData = async <T = any>(path: string, data: any): Promise<APIResponse<T>> => {
  const fullUrl = `${process.env.EXPO_PUBLIC_BACKEND_URL}${path}`;
  console.log('Posting to:', fullUrl);
  
  try {
    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        error: result.error || `HTTP error! status: ${response.status}`,
      };
    }
    
    return {
      success: true,
      data: result.data || result,
      message: result.message,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};

// Poll task progress
export const pollTaskProgress = async (taskId: string): Promise<any> => {
  const url = `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/progress/${taskId}`;
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return response.json();
}; 