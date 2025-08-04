// src/services/file.service.ts

import * as SecureStore from 'expo-secure-store';
const TOKEN_KEY = 'auth-token';

interface UploadResponse {
  success: boolean;
  data?: {
    url: string;
  };
  message?: string;
}

/**
 * 上传图片到后端服务器
 * @param localUri 本地图片文件 URI (e.g., 'file://...')
 * @returns 返回图片的公开 URL
 */
export async function uploadImage(localUri: string): Promise<string> {
  const apiUrl = `${process.env.EXPO_PUBLIC_BACKEND_URL}/file/upload`; // 假设的上传接口
  
  // 从 URI 中获取文件名和类型
  const uriParts = localUri.split('/');
  const fileName = uriParts[uriParts.length - 1];
  const fileTypeMatch = /\.(\w+)$/.exec(fileName);
  const fileType = fileTypeMatch ? `image/${fileTypeMatch[1]}` : `image`;

  const formData = new FormData();
  formData.append('file', {
    uri: localUri,
    name: fileName,
    type: fileType,
  } as any);

  try {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    console.log(`[FileService] Uploading image to ${apiUrl}`);
    const response = await fetch(apiUrl, {
      method: 'POST',
      body: formData,
      headers: headers,
    });

    const result: UploadResponse = await response.json();

    if (response.ok && result.success && result.data?.url) {
      console.log(`[FileService] Upload successful, URL: ${result.data.url}`);
      return result.data.url;
    } else {
      throw new Error(result.message || 'Image upload failed');
    }
  } catch (error) {
    console.error('[FileService] Image upload error:', error);
    throw error;
  }
}