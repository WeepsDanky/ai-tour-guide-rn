import React, { createContext, useState, ReactNode, useContext } from 'react';
import { ChatMessage } from '../types';
import { recogniseAndDescribe } from '../services/poi.service';
import { createTour, checkTourGenerationStatus, getTourByUid } from '@/services/tour.service';
import type { TourGenerationTask, TourRequest } from '@/types';

interface ChatContextType {
  messages: ChatMessage[];
  sendPhoto: (uri: string, location?: string, preferences?: string) => Promise<void>;
  addMessage: (message: ChatMessage) => void;
  clearMessages: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

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
      // Update progress message to completion
      setMessages(prev => 
        prev.map(msg => 
          msg.id === progressMsgId 
            ? { ...msg, status: 'done', text: '🎉 游览路线生成完成！您可以在我的页面查看详情。' }
            : msg
        )
      );

      console.log(`[ChatContext] Tour generation completed for tourUid: ${tourUid}`);
    } catch (error) {
      console.error('[ChatContext] Failed to handle tour completion:', error);
      setMessages(prev => 
        prev.map(msg => 
          msg.id === progressMsgId 
            ? { ...msg, status: 'done', text: '游览路线生成完成！您可以在我的页面查看详情。' }
            : msg
        )
      );
    }
  };

  const pollTourProgress = async (tourUid: string, progressMsgId: string) => {
    const poll = async () => {
      try {
        const task: TourGenerationTask = await checkTourGenerationStatus(tourUid);
        console.log('[ChatContext] Received task status:', task);
        
        // Update progress message
        setMessages(prev => 
          prev.map(msg => 
            msg.id === progressMsgId 
              ? { 
                  ...msg, 
                  progress: task.progress,
                  progressText: task.message || getStatusMessage(task.status)
                }
              : msg
          )
        );
        
        if (task.status === 'COMPLETED') {
          console.log('[ChatContext] Tour generation completed');
          
          // Get final tour data
          const finalTourData = await getTourByUid(tourUid);
          if (finalTourData && finalTourData.tourPlan) {
            await handleTourComplete(tourUid, progressMsgId);
          } else {
            throw new Error('Failed to retrieve the final tour plan');
          }
        } else if (task.status === 'FAILED') {
          throw new Error(task.error || 'Tour generation failed');
        } else {
          // Continue polling
          setTimeout(poll, 2000);
        }
      } catch (error) {
        console.error('[ChatContext] Polling error:', error);
        setMessages(prev => 
          prev.map(msg => 
            msg.id === progressMsgId 
              ? { ...msg, status: 'done', text: '生成游览路线失败，请重试。' }
              : msg
          )
        );
      }
    };
    
    poll();
  };

  const startTourGeneration = async (photoUri: string, location: string, preferences?: string) => {
    const progressMsg: ChatMessage = {
      id: Date.now() + '-progress',
      type: 'ai',
      status: 'progress',
      progress: 0,
      progressText: '准备生成游览路线...',
      timestamp: new Date()
    };

    // Add progress message
    setMessages(prev => [...prev, progressMsg]);

    try {
      const request: TourRequest = {
        location: location.trim(),
        photos: [photoUri],
        preferences: preferences?.trim() || undefined,
      };
      
      console.log('[ChatContext] Sending tour generation request:', request);
      
      // Start tour generation
      const statusResponse = await createTour(request);
      console.log('[ChatContext] Tour generation started:', statusResponse);
      
      // Poll for progress
      await pollTourProgress(statusResponse.tourUid, progressMsg.id);
    } catch (error) {
      console.error('[ChatContext] Failed to generate tour:', error);
      setMessages(prev => 
        prev.map(msg => 
          msg.id === progressMsg.id 
            ? { ...msg, status: 'done', text: '抱歉，生成游览路线失败，请重试。' }
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
      timestamp: new Date()
    };

    const loadingMsg: ChatMessage = {
      id: Date.now() + '-ai',
      type: 'ai',
      status: 'loading',
      timestamp: new Date()
    };

    // Add user message and loading message
    setMessages(prev => [...prev, userMsg, loadingMsg]);

    try {
      // Call vision backend
      const aiText = await recogniseAndDescribe(uri);
      
      // Update loading message with AI response
      setMessages(prev => 
        prev.map(msg => 
          msg.id === loadingMsg.id 
            ? { ...msg, status: 'done', text: aiText }
            : msg
        )
      );

      // If location is provided, start tour generation
      if (location) {
        await startTourGeneration(uri, location, preferences);
      }
    } catch (error) {
      // Handle error case
      setMessages(prev => 
        prev.map(msg => 
          msg.id === loadingMsg.id 
            ? { ...msg, status: 'done', text: '抱歉，图片识别失败，请重试。' }
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