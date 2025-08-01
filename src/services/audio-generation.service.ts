import * as FileSystem from 'expo-file-system';
import { POI } from '@/types';

const ELEVENLABS_API_KEY = process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY;
const ELEVENLABS_BASE_URL = 'https://api.elevenlabs.io/v1';

/**
 * 为单个 POI 生成语音并保存到本地
 * @param poi - POI 对象，包含讲解文本
 * @param travelogueUid - 用于创建唯一的文件夹路径
 * @returns 返回本地文件的 URI
 */
export async function generateAndSaveNarration(poi: POI, travelogueUid: string): Promise<string | null> {
  const narrationText = poi.description; // 假设讲解文本在 description 字段
  if (!narrationText) {
    console.warn(`POI ${poi.id} has no narration text.`);
    return null;
  }

  try {
    // 使用 fetch 直接调用 ElevenLabs API
    const response = await fetch(`${ELEVENLABS_BASE_URL}/text-to-speech/pNInz6obpgDQGcFmaJgB`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY || ''
      },
      body: JSON.stringify({
        text: narrationText,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5
        }
      })
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    // 将响应转换为 ArrayBuffer 然后转为 Base64
    const audioBuffer = await response.arrayBuffer();
    const base64Audio = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)));

    // 定义本地存储路径
    const dir = `${FileSystem.documentDirectory}audio/${travelogueUid}/`;
    const path = `${dir}${poi.id}.mp3`;

    // 确保目录存在
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });

    // 写入文件
    await FileSystem.writeAsStringAsync(path, base64Audio, {
      encoding: FileSystem.EncodingType.Base64,
    });

    console.log(`Audio for POI ${poi.id} saved to: ${path}`);
    return path; // 返回本地文件 URI

  } catch (error) {
    console.error(`Failed to generate audio for POI ${poi.id}:`, error);
    return null;
  }
}