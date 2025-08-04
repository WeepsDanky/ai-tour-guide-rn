import React, { createContext, useState, ReactNode, useContext } from 'react';
import { useRouter } from 'expo-router';
import { ChatMessage } from '../types';
import { createTour, checkTourGenerationStatus, getTourByUid } from '@/services/tour.service';
import { uploadImage } from '@/services/file.service';
import type { TourGenerationTask, GenerateTourRequest, TourDataResponse } from '@/types';

interface ChatContextType {
  messages: ChatMessage[];
  sendPhoto: (uri: string, location?: string, preferences?: string) => Promise<void>;
  addMessage: (message: ChatMessage) => void;
  clearMessages: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const router = useRouter();

  const getStatusMessage = (status: string): string => {
    switch (status) {
      case 'PENDING':
        return '准备您的游览请求...';
      case 'GENERATING':
        return 'AI正在为您制作个性化游览路线...';
      case 'COMPLETED':
        return '游览路线生成完成！';
      case 'FAILED':
        return '游览路线生成失败';
      default:
        return '正在处理您的请求...';
    }
  };

  const handleTourComplete = async (tourUid: string, progressMsgId: string) => {
    try {
      // 获取最终的 tour 数据
      const finalTourData = await getTourByUid(tourUid);
      if (!finalTourData) {
        throw new Error('Failed to retrieve final tour data.');
      }

      // 更新 UI 提示
      setMessages(prev => 
        prev.map(msg => 
          msg.id === progressMsgId 
            ? { ...msg, status: 'done', text: '🎉 游览路线生成完成！即将跳转...' }
            : msg
        )
      );

      // 导航到地图/播放器页面，并将 tour 数据作为参数传递
      router.push({
        pathname: '/(appLayout)/(map)/map',
        params: {
          tourData: JSON.stringify(finalTourData),
          tourId: finalTourData.tourUid
        },
      });

    } catch (error) {
      console.error('[ChatContext] Failed to handle tour completion:', error);
      setMessages(prev => 
        prev.map(msg => 
          msg.id === progressMsgId 
            ? { ...msg, status: 'done', text: '生成完成，但获取详情失败，请在"我的"页面查看。' }
            : msg
        )
      );
    }
  };

  const pollTourProgress = async (tourUid: string, progressMsgId: string) => {
    const poll = async () => {
      try {
        const response = await checkTourGenerationStatus(tourUid);
        const task = response; // checkTourGenerationStatus 直接返回 TourGenerationTask

        if (!task) {
          throw new Error("Invalid status response from server");
        }

        console.log('[ChatContext] Polling status:', task.status);
        
        setMessages(prev => 
          prev.map(msg => 
            msg.id === progressMsgId 
              ? { 
                  ...msg, 
                  progress: task.progress || 0, 
                  progressText: task.message || getStatusMessage(task.status)
                }
              : msg
          )
        );

        if (task.status === 'COMPLETED') {
          await handleTourComplete(tourUid, progressMsgId);
        } else if (task.status === 'FAILED') {
          throw new Error(task.error || 'Tour generation failed');
        } else {
          setTimeout(poll, 3000); // 轮询间隔 3 秒
        }
      } catch (error) {
        console.error('[ChatContext] Polling error:', error);
        setMessages(prev => 
          prev.map(msg => 
            msg.id === progressMsgId 
              ? { ...msg, status: 'done', text: '生成游览路线时出错，请重试。' }
              : msg
          )
        );
      }
    };
    
    poll();
  };

  const startTourGeneration = async (photoUrl: string, location: string, preferences?: string) => {
    const progressMsg: ChatMessage = {
      id: Date.now() + '-progress',
      type: 'ai',
      status: 'progress',
      progress: 0,
      progressText: '正在准备您的游览请求...',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, progressMsg]);

    try {
      // 将前端请求格式转换为后端需要的 GenerateTourRequest 格式
      const request: GenerateTourRequest = {
        locationName: location.trim(),
        photoUrls: [photoUrl],
        prefText: preferences?.trim() || '请为我生成一个有趣的导览',
        language: 'zh', // 或者根据用户设置
      };
      
      const response = await createTour(request); // createTour 现在返回 TourGenerationStatusResponse
      const statusResponse = response;

      if (!statusResponse) {
        throw new Error("Failed to start generation process.");
      }

      console.log('[ChatContext] Tour generation started:', statusResponse);
      await pollTourProgress(statusResponse.tourUid, progressMsg.id);
    } catch (error) {
      console.error('[ChatContext] Failed to start tour generation:', error);
      setMessages(prev => 
        prev.map(msg => 
          msg.id === progressMsg.id 
            ? { ...msg, status: 'done', text: `抱歉，请求失败: ${error instanceof Error ? error.message : String(error)}` }
            : msg
        )
      );
    }
  };

  const sendPhoto = async (uri: string, location?: string, preferences?: string) => {
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      image: uri,
      text: preferences, // 同时显示用户的偏好文本
      timestamp: new Date()
    };

    const loadingMsg: ChatMessage = {
      id: Date.now() + '-ai',
      type: 'ai',
      status: 'loading',
      text: '正在上传和识别图片...',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg, loadingMsg]);

    try {
      // 步骤 1: 上传图片
      const imageUrl = await uploadImage(uri);
      
      // 移除 loading 消息, 准备开始生成流程
      setMessages(prev => prev.filter(msg => msg.id !== loadingMsg.id));
      
      // 步骤 2: 开始生成 Tour
      if (location) {
        await startTourGeneration(imageUrl, location, preferences);
      } else {
         // 如果没有位置信息，可以只返回识别结果（如果需要）
         setMessages(prev => [...prev, { 
            id: Date.now() + '-info',
            type: 'ai',
            status: 'done',
            text: '图片已上传，但未提供位置信息，无法生成导览。',
            timestamp: new Date(),
         }]);
      }
    } catch (error) {
      setMessages(prev => 
        prev.map(msg => 
          msg.id === loadingMsg.id 
            ? { ...msg, status: 'done', text: `处理失败: ${error instanceof Error ? error.message : String(error)}` }
            : msg
        )
      );
    }
  };

  const addMessage = (message: ChatMessage) => {
    setMessages(prev => [...prev, message]);
  };

  const clearMessages = () => {
    setMessages([]);
  };

  const value = {
    messages,
    sendPhoto,
    addMessage,
    clearMessages
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}